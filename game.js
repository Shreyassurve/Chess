const chess = new Chess(); // Create a new Chess instance
const chessboard = document.getElementById('chessboard');
const resetButton = document.getElementById('resetButton');
const gameStatus = document.getElementById('gameStatus');
const gameOverMessage = document.getElementById('gameOverMessage');
let selectedSquare = null;

// Render the chessboard and pieces
function renderBoard() {
    chessboard.innerHTML = ''; // Clear the board

    const board = chess.board();
    board.forEach((row, rowIndex) => {
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
    return pieceIcons[piece.type] + (piece.color === 'w' ? ' text-light' : ' text-dark');
}

// Handle board square clicks for piece movement
function handleSquareClick(square) {
    if (selectedSquare) {
        const move = chess.move({
            from: selectedSquare,
            to: square,
            promotion: 'q' // Always promote to queen for simplicity
        });

        if (move) {
            animateMove(selectedSquare, square);
            renderBoard(); // Re-render the board after the move
        }
        selectedSquare = null;
    } else {
        const piece = chess.get(square);
        if (piece && piece.color === chess.turn()) {
            selectedSquare = square; // Select the piece to move
        }
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
    renderBoard();
    gameOverMessage.innerText = '';
});

// Initialize the game board
renderBoard();
