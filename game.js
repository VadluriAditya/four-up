// Four Up -- Connect Four vs a minimax + alpha-beta AI. Difficulty scales via
// search depth: Easy=2, Medium=4, Hard=5 ply.

const ROWS = 6, COLS = 7;
const HUMAN = 1, AI = 2;
const DEPTHS = { easy: 2, medium: 4, hard: 5 };

function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }

function getNextOpenRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) if (board[r][col] === 0) return r;
  return -1;
}
function validCols(board) {
  const cols = [];
  for (let c = 0; c < COLS; c++) if (board[0][c] === 0) cols.push(c);
  return cols;
}
function cloneBoard(board) { return board.map(r => r.slice()); }

function checkWinAt(board, piece) {
  // horizontal
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0,1,2,3].every(k => board[r][c+k] === piece)) return [[r,c],[r,c+1],[r,c+2],[r,c+3]];
  // vertical
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r <= ROWS - 4; r++)
      if ([0,1,2,3].every(k => board[r+k][c] === piece)) return [[r,c],[r+1,c],[r+2,c],[r+3,c]];
  // diagonal down-right
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0,1,2,3].every(k => board[r+k][c+k] === piece)) return [[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]];
  // diagonal up-right
  for (let r = 3; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0,1,2,3].every(k => board[r-k][c+k] === piece)) return [[r,c],[r-1,c+1],[r-2,c+2],[r-3,c+3]];
  return null;
}

function evaluateWindow(cells, piece) {
  const opp = piece === AI ? HUMAN : AI;
  const countP = cells.filter(v => v === piece).length;
  const countO = cells.filter(v => v === opp).length;
  const countE = cells.filter(v => v === 0).length;
  if (countP === 4) return 100;
  if (countP === 3 && countE === 1) return 5;
  if (countP === 2 && countE === 2) return 2;
  if (countO === 3 && countE === 1) return -4;
  return 0;
}

function scorePosition(board, piece) {
  let score = 0;
  const centerCol = Math.floor(COLS / 2);
  const centerCount = board.reduce((s, row) => s + (row[centerCol] === piece ? 1 : 0), 0);
  score += centerCount * 3;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      score += evaluateWindow([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]], piece);
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r <= ROWS - 4; r++)
      score += evaluateWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]], piece);
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c <= COLS - 4; c++)
      score += evaluateWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]], piece);
  for (let r = 3; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      score += evaluateWindow([board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]], piece);
  return score;
}

function isTerminal(board) {
  return !!checkWinAt(board, HUMAN) || !!checkWinAt(board, AI) || validCols(board).length === 0;
}

function minimax(board, depth, alpha, beta, maximizing) {
  const valid = validCols(board);
  const terminal = isTerminal(board);
  if (depth === 0 || terminal) {
    if (terminal) {
      if (checkWinAt(board, AI)) return [null, 10_000_000];
      if (checkWinAt(board, HUMAN)) return [null, -10_000_000];
      return [null, 0];
    }
    return [null, scorePosition(board, AI)];
  }
  let bestCol = valid[Math.floor(Math.random() * valid.length)];
  if (maximizing) {
    let value = -Infinity;
    for (const col of valid) {
      const row = getNextOpenRow(board, col);
      const b2 = cloneBoard(board);
      b2[row][col] = AI;
      const score = minimax(b2, depth - 1, alpha, beta, false)[1];
      if (score > value) { value = score; bestCol = col; }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  } else {
    let value = Infinity;
    for (const col of valid) {
      const row = getNextOpenRow(board, col);
      const b2 = cloneBoard(board);
      b2[row][col] = HUMAN;
      const score = minimax(b2, depth - 1, alpha, beta, true)[1];
      if (score < value) { value = score; bestCol = col; }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  }
}

let board = emptyBoard();
let difficulty = "medium";
let turn = HUMAN;
let winner = null;
let winCells = [];
let thinking = false;

const app = document.getElementById("app");

function newGame() {
  board = emptyBoard();
  turn = HUMAN;
  winner = null;
  winCells = [];
  thinking = false;
  render();
}

function drop(col) {
  if (winner || thinking || turn !== HUMAN) return;
  const row = getNextOpenRow(board, col);
  if (row === -1) return;
  board[row][col] = HUMAN;
  const win = checkWinAt(board, HUMAN);
  if (win) { winner = HUMAN; winCells = win; render(); return; }
  if (validCols(board).length === 0) { winner = "draw"; render(); return; }
  turn = AI;
  thinking = true;
  render();
  setTimeout(aiMove, 250);
}

function aiMove() {
  const [col] = minimax(board, DEPTHS[difficulty], -Infinity, Infinity, true);
  const row = getNextOpenRow(board, col);
  board[row][col] = AI;
  const win = checkWinAt(board, AI);
  thinking = false;
  if (win) { winner = AI; winCells = win; render(); return; }
  if (validCols(board).length === 0) { winner = "draw"; render(); return; }
  turn = HUMAN;
  render();
}

function isWinCell(r, c) { return winCells.some(([wr, wc]) => wr === r && wc === c); }

function render() {
  let html = `
    <div class="eyebrow">Four Up</div>
    <h1>Four Up</h1>
    <div class="sub">Connect four before the AI does. Pick your difficulty.</div>
    <div class="levels">
  `;
  Object.keys(DEPTHS).forEach(d => {
    html += `<button class="level-btn ${d === difficulty ? "active" : ""}" data-level="${d}">${d[0].toUpperCase() + d.slice(1)}</button>`;
  });
  html += `</div><div class="board">`;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      const cls = v === HUMAN ? "p1" : v === AI ? "p2" : "";
      const win = isWinCell(r, c) ? "win" : "";
      html += `<div class="cell ${cls} ${win}" data-col="${c}"></div>`;
    }
  }
  html += `</div>`;
  if (winner) {
    const msg = winner === "draw" ? "It's a draw." : winner === HUMAN ? "You win!" : "The AI wins.";
    html += `<div class="overlay"><div>${msg}</div><button class="btn" id="newBtn">New game</button></div>`;
  } else {
    html += `<div class="status">${thinking ? "AI thinking..." : turn === HUMAN ? "Your turn" : ""}</div>`;
  }
  app.innerHTML = html;
  app.querySelectorAll("[data-col]").forEach(el => {
    el.addEventListener("click", () => drop(parseInt(el.getAttribute("data-col"), 10)));
  });
  app.querySelectorAll("[data-level]").forEach(el => {
    el.addEventListener("click", () => { difficulty = el.getAttribute("data-level"); newGame(); });
  });
  const newBtn = document.getElementById("newBtn");
  if (newBtn) newBtn.addEventListener("click", newGame);
}

newGame();

(function selfCheck() {
  const check = (cond, msg) => { if (!cond) console.error("Four Up self-check FAILED:", msg); };
  const b = emptyBoard();
  [0,1,2,3].forEach(c => { b[ROWS-1][c] = HUMAN; });
  check(!!checkWinAt(b, HUMAN), "horizontal win detected");
  check(!checkWinAt(b, AI), "no false positive for other player");

  const b2 = emptyBoard();
  [0,1,2,3].forEach(r => { b2[ROWS-1-r][2] = AI; });
  check(!!checkWinAt(b2, AI), "vertical win detected");

  const b3 = emptyBoard();
  // diagonal down-right: (2,0)(3,1)(4,2)(5,3)
  b3[2][0]=HUMAN; b3[3][1]=HUMAN; b3[4][2]=HUMAN; b3[5][3]=HUMAN;
  check(!!checkWinAt(b3, HUMAN), "diagonal win detected");

  // AI should take an obvious winning move when 3-in-a-row with an open 4th slot
  const b4 = emptyBoard();
  b4[ROWS-1][0]=AI; b4[ROWS-1][1]=AI; b4[ROWS-1][2]=AI;
  const [col] = minimax(b4, 3, -Infinity, Infinity, true);
  check(col === 3, `AI takes the winning move (got col ${col})`);

  console.log("Four Up self-check passed.");
})();
