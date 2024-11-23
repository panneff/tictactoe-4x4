const board = document.getElementById("game-board");
const status = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const setup = document.getElementById("setup");
const game = document.getElementById("game");
const chooseXBtn = document.getElementById("choose-x");
const chooseOBtn = document.getElementById("choose-o");
const themesTab = document.getElementById("themes-tab");
const themesMenu = document.getElementById("themes-menu");
const themeButtons = document.querySelectorAll(".theme-btn");

const boardSize = 4;
let playerScore = 0;
let computerScore = 0;
let gameBoard = Array(boardSize * boardSize).fill(null);
let playerSymbol = "X";
let computerSymbol = "O";
let currentPlayer = "X"; // Player goes first
let isGameOver = false;
let winningCombination = [];

// Save and load scores using localStorage
function saveScore(key, score) {
  localStorage.setItem(key, score);
  console.log(`Saved ${key}: ${score}`);
}

function loadScore(key) {
  const score = localStorage.getItem(key) || 0; 
  console.log(`Loaded ${key}: ${score}`);
  if (key === 'playerScore') {
    playerScore = score;
    document.getElementById('player-score').textContent = `Player: ${playerScore}`;
  } else if (key === 'computerScore') {
    computerScore = score;
    document.getElementById('computer-score').textContent = `Computer: ${computerScore}`;
  }
}

// Symbol choice handling
chooseXBtn.addEventListener("click", () => {
  playerSymbol = "X";
  computerSymbol = "O";
  localStorage.setItem('playerSymbol', 'X');  // Store the choice in localStorage
  startGame();
});

chooseOBtn.addEventListener("click", () => {
  playerSymbol = "O";
  computerSymbol = "X";
  localStorage.setItem('playerSymbol', 'O');  // Store the choice in localStorage
  startGame();
});

document.addEventListener("DOMContentLoaded", () => {
  loadScore("playerScore");
  loadScore("computerScore");

  // Load saved symbol from localStorage if available
  const savedPlayerSymbol = localStorage.getItem('playerSymbol');
  if (savedPlayerSymbol) {
    playerSymbol = savedPlayerSymbol;
    computerSymbol = playerSymbol === "X" ? "O" : "X";
  }

  // Show the main page (setup screen)
  setup.classList.remove("hidden");
  game.classList.add("hidden");
});


themeButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const theme = e.target.dataset.theme;
      document.body.className = theme; // Apply theme to body
      themesMenu.classList.remove("visible"); // Hide menu after selecting theme
      localStorage.setItem("theme", theme); // Save theme to localStorage
    });
  });


// Theme handling
themeButtons.forEach(btn => {
  btn.addEventListener("click", (e) => {
    const theme = e.target.dataset.theme;
    document.body.className = theme; // Apply theme to body
    themesMenu.classList.remove("visible");
    localStorage.setItem("theme", theme);  // Save theme to localStorage
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "eva"; 
  document.body.classList.add(savedTheme);
});

function startGame() {
  setup.classList.add("hidden");
  game.classList.remove("hidden");
  gameBoard = Array(boardSize * boardSize).fill(null);
  currentPlayer = playerSymbol;
  status.textContent = `Player ${playerSymbol}'s turn`;
  initBoard();
}

function initBoard() {
  board.innerHTML = "";
  gameBoard.forEach((_, index) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = index;
    cell.addEventListener("click", handleCellClick);
    board.appendChild(cell);
  });
}

function handleCellClick(event) {
    const index = event.target.dataset.index;
  
    if (isGameOver || gameBoard[index]) return;
  
    gameBoard[index] = currentPlayer;
  
    const cell = document.querySelector(`[data-index='${index}']`);
    cell.textContent = currentPlayer;
    cell.classList.add("taken"); // todo
  
    if (checkWinner()) {
      isGameOver = true;
      status.textContent = `${currentPlayer} wins!`;
      return;
    }
  
    if (!gameBoard.includes(null)) {
      isGameOver = true;
      status.textContent = "It's a draw!";
      return;
    }
  
    currentPlayer = currentPlayer === playerSymbol ? computerSymbol : playerSymbol;
    status.textContent = `${currentPlayer === playerSymbol ? "Player" : "Computer"}'s turn`;
  
    if (currentPlayer === computerSymbol && !isGameOver) {
      const bestMove = findBestMove();
      setTimeout(() => {
        makeMove(bestMove, computerSymbol);
        if (checkWinner()) {
          isGameOver = true;
          status.textContent = "Computer wins!";
        } else if (!gameBoard.includes(null)) {
          isGameOver = true;
          status.textContent = "It's a draw!";
        } else {
          currentPlayer = playerSymbol;
          status.textContent = "Player's turn";
        }
      }, 1000);
    }
  }
  

function checkWinner() {
    const winningCombinations = [];
    
    for (let i = 0; i < boardSize; i++) {
      const row = [];
      const col = [];
      for (let j = 0; j < boardSize; j++) {
        row.push(i * boardSize + j);
        col.push(j * boardSize + i);
      }
      winningCombinations.push(row);
      winningCombinations.push(col);
    }
  
    const diagonal1 = [];
    const diagonal2 = [];
    for (let i = 0; i < boardSize; i++) {
      diagonal1.push(i * boardSize + i);
      diagonal2.push(i * boardSize + (boardSize - i - 1));
    }
    winningCombinations.push(diagonal1);
    winningCombinations.push(diagonal2);
  
    for (const combination of winningCombinations) {
      if (combination.every(index => gameBoard[index] === currentPlayer)) {
        winningCombination = combination;
        if (currentPlayer === playerSymbol) {
          playerScore++;
          saveScore('playerScore', playerScore);
          document.getElementById('player-score').textContent = `Player: ${playerScore}`;
        } else {
          computerScore++;
          saveScore('computerScore', computerScore);
          document.getElementById('computer-score').textContent = `Computer: ${computerScore}`;
        }
        return true;
      }
    }
    return false;
  }
  

function findBestMove() {
  const availableMoves = gameBoard.map((cell, index) => (cell === null ? index : null)).filter(index => index !== null);

  const optimalPlayProbability = Math.min(0.5 + (computerScore * 0.07), 1);

  function findThreatOrWin(symbol) {
    for (let i = 0; i < boardSize; i++) {
      const rowStart = i * boardSize;
      const row = gameBoard.slice(rowStart, rowStart + boardSize);
      const emptyIndexInRow = row.indexOf(null);
      if (row.filter(cell => cell === symbol).length === boardSize - 1 && emptyIndexInRow !== -1) {
        return rowStart + emptyIndexInRow;
      }

      const column = [];
      let emptyIndexInColumn = -1;
      for (let j = 0; j < boardSize; j++) {
        const index = j * boardSize + i;
        column.push(gameBoard[index]);
        if (gameBoard[index] === null) emptyIndexInColumn = index;
      }
      if (column.filter(cell => cell === symbol).length === boardSize - 1 && emptyIndexInColumn !== -1) {
        return emptyIndexInColumn;
      }
    }

    const diagonal1 = [];
    const diagonal2 = [];
    let emptyIndexDiagonal1 = -1;
    let emptyIndexDiagonal2 = -1;

    for (let i = 0; i < boardSize; i++) {
      const diag1Index = i * boardSize + i;
      const diag2Index = i * boardSize + (boardSize - i - 1);

      diagonal1.push(gameBoard[diag1Index]);
      diagonal2.push(gameBoard[diag2Index]);

      if (gameBoard[diag1Index] === null) emptyIndexDiagonal1 = diag1Index;
      if (gameBoard[diag2Index] === null) emptyIndexDiagonal2 = diag2Index;
    }

    if (diagonal1.filter(cell => cell === symbol).length === boardSize - 1 && emptyIndexDiagonal1 !== -1) {
      return emptyIndexDiagonal1;
    }

    if (diagonal2.filter(cell => cell === symbol).length === boardSize - 1 && emptyIndexDiagonal2 !== -1) {
      return emptyIndexDiagonal2;
    }

    return null;
  }

  const playOptimally = Math.random() < optimalPlayProbability;

  if (playOptimally) {
    const winningMove = findThreatOrWin(computerSymbol);
    if (winningMove !== null) return winningMove;

    const blockingMove = findThreatOrWin(playerSymbol);
    if (blockingMove !== null) return blockingMove;
  }

  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function makeMove(index, symbol) {
  gameBoard[index] = symbol;
  const cell = document.querySelector(`[data-index='${index}']`);
  cell.textContent = symbol;
  cell.classList.add("taken");
  checkWinner();
}

restartBtn.addEventListener("click", () => {
  gameBoard = Array(boardSize * boardSize).fill(null);
  currentPlayer = playerSymbol;
  isGameOver = false;
  status.textContent = `Player ${playerSymbol}'s turn`;
  initBoard();
});
