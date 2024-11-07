const chess = new Chess(); // Create a new Chess instance
const chessboard = document.getElementById('chessboard');
const resetButton = document.getElementById('resetButton');
const backButton = document.getElementById('backButton');
const forwardButton = document.getElementById('forwardButton');
const gameStatus = document.getElementById('gameStatus');
const gameOverMessage = document.getElementById('gameOverMessage');
let selectedSquare = null;
let moveHistory = [];
let currentMoveIndex = -1;

// Render the chessboard and pieces
function renderBoard() {
    chessboard.innerHTML = ''; // Clear the board

    chess.board().forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareDiv = document.createElement('div');
            squareDiv.classList.add('square');
            squareDiv.classList.add((rowIndex + colIndex) % 2 === 0 ? 'white' : 'black');
            const squareName = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
            squareDiv.setAttribute('data-square', squareName);

            // Add piece icon if there's a piece on the square
            if (square) {
                const pieceClass = getPieceIcon(square);
                squareDiv.innerHTML = `<i class="fas ${pieceClass}"></i>`;
                squareDiv.setAttribute('data-piece', square.type);
                squareDiv.setAttribute('data-color', square.color);
            }

            // Add click event for piece movement
            squareDiv.addEventListener('click', () => handleSquareClick(squareName));

            chessboard.appendChild(squareDiv);
        });
    });

    updateGameStatus();
}

// Returns the appropriate icon class for a piece
function getPieceIcon(piece) {
    const pieceIcons = {
        'p': 'fa-chess-pawn',
        'r': 'fa-chess-rook',
        'n': 'fa-chess-knight',
        'b': 'fa-chess-bishop',
        'q': 'fa-chess-queen',
        'k': 'fa-chess-king'
    };
    const colorClass = piece.color === 'w' ? 'text-brown' : 'text-dark';
    return `${pieceIcons[piece.type]} ${colorClass}`;
}

// Handle board square clicks for piece movement
function handleSquareClick(square) {
    const piece = chess.get(square);

    // If a square is already selected, attempt to move the piece
    if (selectedSquare) {
        const move = chess.move({
            from: selectedSquare,
            to: square,
            promotion: 'q' // Always promote to queen for simplicity
        });

        // If the move is legal, clear selection and re-render board
        if (move) {
            // Record the move and update history
            moveHistory = moveHistory.slice(0, currentMoveIndex + 1); // Trim forward history if any
            moveHistory.push(move);
            currentMoveIndex++;

            selectedSquare = null;
            renderBoard();
        } else {
            // Clear selection if the move is illegal
            selectedSquare = null;
        }
    } else if (piece && piece.color === chess.turn()) {
        // If no square is selected, allow the current player to select their piece
        selectedSquare = square;
    }
}

// Undo last move
function undoMove() {
    if (currentMoveIndex >= 0) {
        chess.undo();
        currentMoveIndex--;
        renderBoard();
    }
}

// Redo move
function redoMove() {
    if (currentMoveIndex < moveHistory.length - 1) {
        const move = moveHistory[currentMoveIndex + 1];
        chess.move(move);
        currentMoveIndex++;
        renderBoard();
    }
}

// Animate the move of a piece from one square to another
function animateMove(fromSquare, toSquare) {
    const fromElem = document.querySelector(`[data-square="${fromSquare}"]`);
    const toElem = document.querySelector(`[data-square="${toSquare}"]`);
    const pieceElem = fromElem.querySelector('i');

    const fromRect = fromElem.getBoundingClientRect();
    const toRect = toElem.getBoundingClientRect();

    const deltaX = toRect.left - fromRect.left;
    const deltaY = toRect.top - fromRect.top;

    pieceElem.style.transition = 'transform 0.3s ease';
    pieceElem.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    // Reset transform after animation
    setTimeout(() => {
        pieceElem.style.transition = '';
        pieceElem.style.transform = '';
        renderBoard();
    }, 300);
}

// Update the game status (e.g., check, checkmate, turn information)
function updateGameStatus() {
    if (chess.in_checkmate()) {
        gameOverMessage.innerText = `${chess.turn().toUpperCase()} wins by checkmate!`;
    } else if (chess.in_draw()) {
        gameOverMessage.innerText = 'Game is a draw!';
    } else if (chess.in_check()) {
        gameStatus.innerText = `${chess.turn().toUpperCase()} is in check!`;
    } else {
        gameStatus.innerText = `${chess.turn().toUpperCase()}'s turn`;
    }
}

// Reset game functionality
resetButton.addEventListener('click', () => {
    chess.reset();
    moveHistory = [];
    currentMoveIndex = -1;
    selectedSquare = null;
    renderBoard();
    gameOverMessage.innerText = '';
});

// Back button functionality
backButton.addEventListener('click', undoMove);

// Forward button functionality
forwardButton.addEventListener('click', redoMove);

// Initialize the game board
renderBoard();
