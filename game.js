const chess = new Chess();
const chessboard = document.getElementById('chessboard');
const resetButton = document.getElementById('resetButton');
const backButton = document.getElementById('backButton');
const forwardButton = document.getElementById('forwardButton');
const gameStatus = document.getElementById('gameStatus');
const gameOverMessage = document.getElementById('gameOverMessage');
const multiplayerButton = document.getElementById('multiplayerButton');
const computerButton = document.getElementById('computerButton');

let selectedSquare = null;
let moveHistory = [];
let currentMoveIndex = -1;
let isComputerMode = false; // By default, set to Multiplayer mode

// Max depth for AI
const MAX_DEPTH = 2;

// Render the board
function renderBoard() {
    chessboard.innerHTML = '';
    chess.board().forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareDiv = document.createElement('div');
            squareDiv.classList.add('square', (rowIndex + colIndex) % 2 === 0 ? 'white' : 'black');
            const squareName = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
            squareDiv.setAttribute('data-square', squareName);

            if (square) {
                const pieceClass = getPieceIcon(square);
                squareDiv.innerHTML = `<i class="fas ${pieceClass}"></i>`;
            }

            squareDiv.addEventListener('click', () => handleSquareClick(squareName));
            chessboard.appendChild(squareDiv);
        });
    });
    updateGameStatus();
}

// Get piece icon class for rendering
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

// Handle square clicks for human moves
function handleSquareClick(square) {
    const piece = chess.get(square);
    if (selectedSquare && chess.turn() === 'w') {
        const move = chess.move({
            from: selectedSquare,
            to: square,
            promotion: 'q'
        });

        if (move) {
            moveHistory.push(move);
            currentMoveIndex++;
            selectedSquare = null;
            renderBoard();

            if (!chess.game_over() && isComputerMode && chess.turn() === 'b') {
                setTimeout(makeComputerMove, 500);  // AI makes its move
            }
        } else {
            selectedSquare = null;
        }
    } else if (piece && piece.color === 'w' && chess.turn() === 'w') {
        selectedSquare = square;
    }
}

// AI Move (Minimax with Alpha-Beta Pruning)
function makeComputerMove() {
    const bestMove = minimaxRoot(MAX_DEPTH, true);
    if (bestMove) {
        chess.move(bestMove);
        moveHistory.push(bestMove);
        currentMoveIndex++;
        renderBoard();
    }
}

// Minimax root function to start search
function minimaxRoot(depth, isMaximizingPlayer) {
    let bestMove = null;
    let bestValue = -Infinity;
    const moves = chess.moves({ verbose: true });

    for (const move of moves) {
        chess.move(move);
        const value = minimax(depth - 1, -Infinity, Infinity, !isMaximizingPlayer);
        chess.undo();

        if (value > bestValue) {
            bestValue = value;
            bestMove = move;
        }
    }
    return bestMove;
}

// Minimax with Alpha-Beta Pruning
function minimax(depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0 || chess.game_over()) {
        return evaluateBoard();
    }

    const moves = chess.moves({ verbose: true });

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of moves) {
            chess.move(move);
            const eval = minimax(depth - 1, alpha, beta, false);
            chess.undo();
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            chess.move(move);
            const eval = minimax(depth - 1, alpha, beta, true);
            chess.undo();
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// Simple evaluation function (material-based)
function evaluateBoard() {
    const values = { p: 1, r: 5, n: 3, b: 3.5, q: 9, k: 1000 };
    let evaluation = 0;

    chess.board().forEach(row => {
        row.forEach(piece => {
            if (piece) {
                const value = values[piece.type];
                evaluation += piece.color === 'w' ? value : -value;
            }
        });
    });
    return evaluation;
}

// Update the game status (e.g., turn, checkmate)
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

// Reset button functionality
resetButton.addEventListener('click', () => {
    chess.reset();
    moveHistory = [];
    currentMoveIndex = -1;
    selectedSquare = null;
    renderBoard();
    gameOverMessage.innerText = '';
});

// Back button functionality
backButton.addEventListener('click', () => {
    if (currentMoveIndex >= 0) {
        chess.undo();
        currentMoveIndex--;
        renderBoard();
    }
});

// Forward button functionality
forwardButton.addEventListener('click', () => {
    if (currentMoveIndex < moveHistory.length - 1) {
        const move = moveHistory[currentMoveIndex + 1];
        chess.move(move);
        currentMoveIndex++;
        renderBoard();
    }
});

// Multiplayer Button (switch to Player vs Player)
multiplayerButton.addEventListener('click', () => {
    isComputerMode = false;
    gameStatus.innerText = "Player vs Player mode";
    renderBoard();
});

// Computer Button (switch to Player vs AI)
computerButton.addEventListener('click', () => {
    isComputerMode = true;
    gameStatus.innerText = "Player vs Computer mode";
    renderBoard();
});

// Initialize the game board
renderBoard();
