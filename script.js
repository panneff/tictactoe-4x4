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
const difficultySlider = document.getElementById("difficulty-slider");
const difficultyLabel = document.getElementById("difficulty-label");
const modeSelectionForm = document.getElementById("mode-selection");

const boardSize = 4;
let difficulty = "medium";
let isMultiplayer = false;
let playerScore = 0;
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
    document.getElementById('player-score').textContent = `Score: ${playerScore}`;
  }
}

// Symbol choice handling
chooseXBtn.addEventListener("click", () => {
  playerSymbol = "X";
  computerSymbol = "O";
  localStorage.setItem('playerSymbol', 'X');  // Store the choice in localStorage
  startGame();
});

// local multiplayer thing (not online)
modeSelectionForm.addEventListener("change", (event) => {
  const selectedMode = event.target.value;
  isMultiplayer = selectedMode === "multi";
  const modeText = isMultiplayer ? "Multiplayer Mode" : "Single Player Mode";
  document.getElementById("status").textContent = modeText;
});

chooseOBtn.addEventListener("click", () => {
  playerSymbol = "O";
  computerSymbol = "X";
  localStorage.setItem('playerSymbol', 'O');  // Store the choice in localStorage
  startGame();
});

document.addEventListener("DOMContentLoaded", () => {
  const singlePlayerRadio = document.getElementById("singleplayer-radio");
  if (singlePlayerRadio) {
    singlePlayerRadio.checked = true;
  }

  loadScore("playerScore");

  setup.classList.remove("hidden");
  game.classList.add("hidden");
});


const mainMenuBtn = document.getElementById("main-menu");
mainMenuBtn.addEventListener("click", () => {
  location.reload();  // Reload the page to return to the setup screen because I'm lazy
});


const difficultyLevels = {
  1: "easy",
  2: "medium",
  3: "hard",
};

const difficultyDescriptions = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

difficultySlider.addEventListener("input", (e) => {
  difficulty = difficultyLevels[e.target.value];
  difficultyLabel.textContent = difficultyDescriptions[difficulty];
  localStorage.setItem("difficulty", difficulty);
  console.log(`Difficulty set to: ${difficulty}`);
});

document.addEventListener("DOMContentLoaded", () => {
  const savedDifficulty = localStorage.getItem("difficulty") || "medium";
  difficulty = savedDifficulty;

  const sliderValue = Object.keys(difficultyLevels).find(
    (key) => difficultyLevels[key] === savedDifficulty
  );
  difficultySlider.value = sliderValue;
  difficultyLabel.textContent = difficultyDescriptions[savedDifficulty];
});

themeButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const theme = e.target.dataset.theme;
      document.body.className = theme; // Apply theme to body
      themesMenu.classList.remove("visible");
      localStorage.setItem("theme", theme); // Save theme to localStorage
    });
  });

  themesTab.addEventListener("click", () => {
    themesMenu.classList.toggle("visible"); // Toggle visibility of the themes menu
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
  status.textContent = `Player ${playerSymbol}'s turn (Difficulty: ${difficultyDescriptions[difficulty]})`;
  status.textContent = isMultiplayer
  ? `Player ${currentPlayer}'s turn (Multiplayer Mode)`
  : `Player ${playerSymbol}'s turn (Single Player Mode)`;
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

  // Prevent clicks on already-taken cells or if the game is over
  if (isGameOver || gameBoard[index]) return;

  // Current player makes a move
  gameBoard[index] = currentPlayer;

  const cell = document.querySelector(`[data-index='${index}']`);
  cell.textContent = currentPlayer;
  cell.classList.add("taken");

  // Check if the current move resulted in a win or draw
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

  // Multiplayer mode: Switch to the other player
  if (isMultiplayer) {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    status.textContent = `Player ${currentPlayer}'s turn`;
    return;
  }

  // Single-player mode: Allow AI to make its move
  currentPlayer = currentPlayer === playerSymbol ? computerSymbol : playerSymbol;
  status.textContent = `${currentPlayer === playerSymbol ? "Player" : "Computer"}'s turn`;

  if (currentPlayer === computerSymbol && !isGameOver) {
    setTimeout(() => {
      const bestMove = findBestMove();
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
          document.getElementById('player-score').textContent = `Score: ${playerScore}`;
        }
        return true;
      }
    }
    return false;
  }
  

  function findBestMove() {
    const availableMoves = gameBoard
      .map((cell, index) => (cell === null ? index : null))
      .filter(index => index !== null);
  
    let optimalPlayProbability;
  
    switch (difficulty) {
      case "easy":
        optimalPlayProbability = 0.3; 
        break;
      case "medium":
        optimalPlayProbability = 0.6; 
        break;
      case "hard":
        optimalPlayProbability = 0.9;
        break;
      default:
        optimalPlayProbability = 0.5; // not really need but yeah
    }

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

      const playOptimally = Math.random() < optimalPlayProbability;

      if (playOptimally) {
        const winningMove = findThreatOrWin(computerSymbol);
        if (winningMove !== null) return winningMove;
    
        const blockingMove = findThreatOrWin(playerSymbol);
        if (blockingMove !== null) return blockingMove;
      }
    
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
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
