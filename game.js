const chess = new Chess();
const chessboard = document.getElementById('chessboard');
const resetButton = document.getElementById('resetButton');
const startButton = document.getElementById('startButton');
const backButton = document.getElementById('backButton');
const forwardButton = document.getElementById('forwardButton');
const gameStatus = document.getElementById('gameStatus');
const gameOverMessage = document.getElementById('gameOverMessage');
const multiplayerButton = document.getElementById('multiplayerButton');
const computerButton = document.getElementById('computerButton');
const whiteTimerDisplay = document.getElementById('whiteTimer');
const blackTimerDisplay = document.getElementById('blackTimer');

let selectedSquare = null;
let moveHistory = [];
let currentMoveIndex = -1;
let isComputerMode = false;
const MAX_DEPTH = 2;
const TIME_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds
let whiteTime = TIME_LIMIT;
let blackTime = TIME_LIMIT;
let timerInterval = null;

// Start Button functionality
startButton.addEventListener('click', () => {
    chess.reset();
    moveHistory = [];
    currentMoveIndex = -1;
    selectedSquare = null;
    whiteTime = TIME_LIMIT;
    blackTime = TIME_LIMIT;
    stopTimers();
    renderBoard();
    gameOverMessage.innerText = '';
    updateTimersDisplay();
    gameStatus.innerText = "Game started! Player's turn";
    
    // Start the timers when the game starts
    startTimers();
});

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

    // Remove previously highlighted square and legal moves
    const previouslySelected = document.querySelector('.highlighted');
    if (previouslySelected) {
        previouslySelected.classList.remove('highlighted');
    }

    const previouslyHighlightedMoves = document.querySelectorAll('.highlighted-move');
    previouslyHighlightedMoves.forEach(move => move.classList.remove('highlighted-move'));

    if (!isComputerMode || chess.turn() === 'w') {
        if (selectedSquare) {
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

                // Switch timers and update time display
                switchTimers();

                if (isComputerMode && chess.turn() === 'b') {
                    setTimeout(makeComputerMove, 500);
                }
            } else {
                selectedSquare = null;
            }
        } else if (piece && piece.color === chess.turn()) {
            selectedSquare = square;
            highlightSelectedPiece(square);
            highlightLegalMoves(square);
        }
    }
}

// Highlight the selected piece (square)
function highlightSelectedPiece(square) {
    const squareDiv = document.querySelector(`[data-square="${square}"]`);
    if (squareDiv) {
        squareDiv.classList.add('highlighted');
    }
}

// Highlight the legal moves for the selected piece
function highlightLegalMoves(square) {
    const legalMoves = chess.moves({
        square: square,
        verbose: true
    });

    legalMoves.forEach(move => {
        const targetSquare = move.to;
        const squareDiv = document.querySelector(`[data-square="${targetSquare}"]`);
        if (squareDiv) {
            squareDiv.classList.add('highlighted-move');
        }
    });
}

// AI Move (Minimax with Alpha-Beta Pruning)
function makeComputerMove() {
    const bestMove = minimaxRoot(MAX_DEPTH, true);
    if (bestMove) {
        chess.move(bestMove);
        moveHistory.push(bestMove);
        currentMoveIndex++;
        renderBoard();
        updateGameStatus();
        switchTimers();
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
        if (chess.turn() === 'w') {
            gameOverMessage.textContent = "Black's Win!";
            stopTimers();
        } else {
            gameOverMessage.textContent = "White's Win!";
            stopTimers();
        }
    } else if (chess.in_draw()) {
        gameOverMessage.innerText = 'Game is a draw!';
        stopTimers();
    } else if (chess.in_check()) {
        gameStatus.innerText = `${chess.turn().toUpperCase()} is in check!`;
    } else {
        gameStatus.innerText = `${chess.turn().toUpperCase()}'s turn`;
    }
}

// Timer functionality
function startTimers() {
    stopTimers();
    timerInterval = setInterval(() => {
        if (chess.turn() === 'w') {
            whiteTime -= 1000;
            if (whiteTime <= 0) {
                gameOverMessage.innerText = 'Black wins on time!';
                stopTimers();
            }
        } else {
            blackTime -= 1000;
            if (blackTime <= 0) {
                gameOverMessage.innerText = 'White wins on time!';
                stopTimers();
            }
        }
        updateTimersDisplay();
    }, 1000);
}

function stopTimers() {
    clearInterval(timerInterval);
}

function switchTimers() {
    if (!chess.game_over()) {
        startTimers();
    }
}

function updateTimersDisplay() {
    whiteTimerDisplay.innerText = formatTime(whiteTime);
    blackTimerDisplay.innerText = formatTime(blackTime);
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Reset button functionality
resetButton.addEventListener('click', () => {
    chess.reset();
    moveHistory = [];
    currentMoveIndex = -1;
    selectedSquare = null;
    whiteTime = TIME_LIMIT;
    blackTime = TIME_LIMIT;
    stopTimers();
    renderBoard();
    gameOverMessage.innerText = '';
    updateTimersDisplay();
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

// Initialize the game board and make sure timer is not started
renderBoard();
updateTimersDisplay();
