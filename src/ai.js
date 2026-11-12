export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function getWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line: [a, b, c] };
    }
  }
  return null;
}

const empties = (b) => b.reduce((r, v, i) => (v ? r : [...r, i]), []);
const other = (p) => (p === 'X' ? 'O' : 'X');
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function minimax(board, turn, me, depth) {
  const w = getWinner(board);
  if (w) return w.player === me ? 10 - depth : depth - 10;
  const free = empties(board);
  if (!free.length) return 0;
  const scores = free.map((i) => {
    const next = board.slice();
    next[i] = turn;
    return minimax(next, other(turn), me, depth + 1);
  });
  return turn === me ? Math.max(...scores) : Math.min(...scores);
}

/** All optimal moves for `player` (used by Hard mode and by hints). */
export function bestMoves(board, player) {
  const free = empties(board);
  const scored = free.map((i) => {
    const next = board.slice();
    next[i] = player;
    return { i, s: minimax(next, other(player), player, 1) };
  });
  const top = Math.max(...scored.map((m) => m.s));
  return scored.filter((m) => m.s === top).map((m) => m.i);
}

function winningMove(board, player) {
  return empties(board).find((i) => {
    const next = board.slice();
    next[i] = player;
    return getWinner(next);
  });
}

export function computerMove(board, player, level) {
  const free = empties(board);
  if (level === 'hard') return pick(bestMoves(board, player));
  if (level === 'medium') {
    const win = winningMove(board, player);
    if (win !== undefined) return win;
    const block = winningMove(board, other(player));
    if (block !== undefined) return block;
    if (free.includes(4) && Math.random() < 0.6) return 4;
  }
  return pick(free);
}
