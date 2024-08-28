/*----Cached elements -----*/
const startGameButton = document.getElementById('start-game');
const resetGameButton = document.getElementById('reset-game');
const statusMessageEl = document.getElementById('statusMessage');
const chatBoxEl = document.getElementById('chat-box');
const playerHeaders = document.querySelectorAll('.player h2');
const sendMessageButtons = document.querySelectorAll('.send-message');

document.addEventListener('DOMContentLoaded', () => initializeGame());

/*----Game state and variables -----*/
const boardSize = 12;
const shipSizes = [5, 4, 3, 3, 2];

let boards;
let activePlayer = 0;
let gameOver = false;
let placingShips = false;
let currentShipSize = 0;
let currentShipIndex = 0;
let currentCells = [];
let currentPlayer = 0;
let hasGameStarted = false;


/*----Event listeners -----*/
resetGameButton.addEventListener('click', resetGame);
startGameButton.addEventListener('click', startGame);

sendMessageButtons.forEach(button => {
    button.addEventListener('click', sendMessage);
});


/*----Functions ------*/

function initializeGame() {
    gameOver = false;
    hasGameStarted = false;

    boards = [{ cells: [], ships: [] }, { cells: [], ships: [] }];
    createBoard('player1', 0);
    createBoard('player2', 1);
    
    updateStatusMessage('Player 1: Place your ships.');
    setActivePlayer(0);
    startPlacingShips(0);
}

/*----create board ------*/
function createBoard(boardId, playerIndex) {
    const gameBoard = document.getElementById(boardId);
    gameBoard.innerHTML = '';

    boards[playerIndex].cells = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.dataset.player = playerIndex;
            cell.addEventListener('click', cellClick);
            gameBoard.appendChild(cell);

            boards[playerIndex].cells.push({ row: i, col: j, hit: false, hasShip: false });
        }
    }
}

/*----ship placement ------*/
function startPlacingShips(playerIndex) {
    currentPlayer = playerIndex;
    currentShipSize = shipSizes[currentShipIndex];

    if (currentShipSize !== undefined) {
        placingShips = true;
        updateStatusMessage(`Player ${currentPlayer + 1}: Place your ship of size ${currentShipSize} cells.`);
    } else {
        placingShips = false;
        currentShipIndex = 0;

        if (currentPlayer === 0) {
            updateStatusMessage('Player 1 has finished. Player 2: Place your ships.');
            setActivePlayer(1);
            startPlacingShips(1);
        } else {
            updateStatusMessage('Both players have placed their ships. Click "Start Game" to begin!');
            startGameButton.style.display = 'block';
        }
    }
}

/*----Cell cliks ------*/
function cellClick(event) {
    if (gameOver) return;
    if (!placingShips && !hasGameStarted) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    const player = parseInt(event.target.dataset.player);
    const cellIndex = row * boardSize + col;
    const cell = boards[player].cells[cellIndex];

    if (placingShips) {
        handleShipPlacement(cell, row, col, player, event.target);
    } else {
        handleTurnPlay(cell, player, event.target);
    }
}

/*----validates cells are adjacent to each other ------*/
function handleShipPlacement(cell, row, col, player, target) {
    if (currentPlayer === player) {
        if (!cell.hasShip && !cell.placed && validateAdjacentCell(row, col)) {
            currentCells.push(cell);
            cell.placed = true;
            target.classList.add('placing');

            if (currentCells.length === currentShipSize) {
                if (validateShipPlacement(currentCells)) {
                    placeCurrentShip();
                }
            }
        } else {
            resetCurrentShipPlacement();
            updateStatusMessage(`That's an invalid cell. Please select cells that are next to each other.`);
        }
    }
}

/*----Players turn handling ------*/
function handleTurnPlay(cell, player, target) {
    if (!hasGameStarted) return;

    if (player === activePlayer) {
        updateStatusMessage("It's not your turn yet!");
        return;
    }

    if (cell.hit) {
        updateStatusMessage("You've already hit this cell. Try again.");
        return;
    }

    cell.hit = true;
    target.classList.add(cell.hasShip ? 'hit' : 'miss');
    if (cell.hasShip && checkGameOver()) {
        updateStatusMessage(`Player ${activePlayer + 1} wins!`);
        highlightWinner(activePlayer);
        gameOver = true;
    } else {
        toggleActivePlayer();
        updateStatusMessage(`${cell.hasShip ? 'Hit' : 'Miss'}! Player ${activePlayer + 1}'s turn.`);
    }
}

function validateAdjacentCell(row, col) {
    if (currentCells.length === 0) return true;

    if (currentCells.length === 1) {
        const [firstCell] = currentCells;
        const isHorizontal = firstCell.row === row;
        const isVertical = firstCell.col === col;

        if (!isHorizontal && !isVertical) {
            return false;
        }
    } else {
        const [firstCell, secondCell] = currentCells;
        const isHorizontal = firstCell.row === secondCell.row;
        const isVertical = firstCell.col === secondCell.col;

        if (isHorizontal && firstCell.row !== row) return false;
        if (isVertical && firstCell.col !== col) return false;
    }
    const [lastCell] = currentCells.slice(-1);
    return (Math.abs(lastCell.row - row) + Math.abs(lastCell.col - col)) === 1;
}

function validateShipPlacement(cells) {
    if (cells.length !== currentShipSize) return false;

    const [firstCell] = cells;
    let sameRow = cells.every(cell => cell.row === firstCell.row);
    let sameCol = cells.every(cell => cell.col === firstCell.col);

    if (!sameRow && !sameCol) return false;

    return cells.every(cell => (
        cell.row >= 0 && cell.row < boardSize && cell.col >= 0 && cell.col < boardSize && !boards[currentPlayer].cells[cell.row * boardSize + cell.col].hasShip
    ));
}

function placeCurrentShip() {
    currentCells.forEach(cell => {
        const index = cell.row * boardSize + cell.col;
        boards[currentPlayer].cells[index].hasShip = true;
        document.querySelector(`.cell[data-row='${cell.row}'][data-col='${cell.col}'][data-player='${currentPlayer}']`).classList.add('placed');
    });
    resetCurrentShipPlacement();
    currentShipIndex++;
    startPlacingShips(currentPlayer);
}

/*----Resets cells if ship is not in order ------*/
function resetCurrentShipPlacement() {
    currentCells.forEach(cell => {
        document.querySelector(`.cell[data-row='${cell.row}'][data-col='${cell.col}'][data-player='${currentPlayer}']`).classList.remove('placing');
        cell.placed = false;
    });
    currentCells = [];
}

function playTurn(row, col, cell) {
    const targetBoard = boards[1 - activePlayer];
    cell = targetBoard.cells[row * boardSize + col];

    if (cell.hit) return false;

    cell.hit = true;
    const cellElement = document.querySelector(`.cell[data-row='${row}'][data-col='${col}'][data-player='${1 - activePlayer}']`);
    cellElement.classList.add(cell.hasShip ? 'hit' : 'miss');

    if (cell.hasShip && checkGameOver()) {
        updateStatusMessage(`Player ${activePlayer + 1} wins!`);
        highlightWinner(activePlayer);
        gameOver = true;
    } else {
        toggleActivePlayer();
        updateStatusMessage(`${cell.hasShip ? 'Hit' : 'Miss'}! Player ${activePlayer + 1}'s turn.`);
    }
}

function toggleActivePlayer() {
    activePlayer = 1 - activePlayer;
    setActivePlayer(activePlayer);
}

function setActivePlayer(playerIndex) {
    playerHeaders.forEach((header, index) => {
        header.classList.toggle('activePlayer', index === playerIndex);
    });
}

function updateStatusMessage(message) {
    statusMessageEl.textContent = message;
}

function checkGameOver() {
    const targetBoard = boards[1 - activePlayer];
    return targetBoard.cells.every(cell => !cell.hasShip || cell.hit);
}

/*----reset game to initial state ------*/
function resetGame() {
    gameOver = false;
    activePlayer = 0;
    placingShips = false;
    currentShipIndex = 0;
    currentCells = [];
    currentPlayer = 0;
    hasGameStarted = false;

    startGameButton.style.display = 'none';

    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('hit', 'miss', 'placing', 'placed');
    });

    toggleClassOnElements('.player h2', 'winner', false);
    toggleClassOnElements('.player h2', 'activePlayer', false);

    initializeGame();
}

/*----start game after all players have ships placed ------*/
function startGame() {
    if (placingShips) return;

    placingShips = false;
    activePlayer = 0;
    setActivePlayer(0);
    hasGameStarted = true;
    startGameButton.style.display = 'none';

    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('placing', 'placed');
    });

    updateStatusMessage('Game has started! Player 1\'s turn.');
}

/*----Highlights game winner ------*/
function highlightWinner(winnerIndex) {
    playerHeaders.forEach((header, index) => {
        header.classList.toggle('winner', index === winnerIndex);
        header.classList.remove('activePlayer');
    });
}

/*----chat messages ------*/
function sendMessage(event) {
    const player = event.target.dataset.player;
    const chatInput = document.getElementById(`chat-input-${player}`);
    const message = chatInput.value.trim();

    if (message) {
        const playerPrefix = player === '1' ? 'Player 1: ' : 'Player 2: ';
        const finalMessage = playerPrefix + message;

        const messageElement = document.createElement('div');
        messageElement.textContent = finalMessage;
        chatBoxEl.appendChild(messageElement);

        chatBoxEl.scrollTop = chatBoxEl.scrollHeight;

        chatInput.value = '';
    }
}

function toggleClassOnElements(querySelector, className, shouldAdd) {
    document.querySelectorAll(querySelector).forEach(element => {
        element.classList.toggle(className, shouldAdd);
    });
}   