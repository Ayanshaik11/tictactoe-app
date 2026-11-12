import React, { useState } from 'react';

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line: [a, b, c] };
    }
  }
  return null;
}

export default function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });

  const result = getWinner(board);
  const isDraw = !result && board.every(Boolean);
  const gameOver = Boolean(result) || isDraw;

  function play(i) {
    if (board[i] || gameOver) return;
    const next = board.slice();
    next[i] = xTurn ? 'X' : 'O';
    setBoard(next);

    const w = getWinner(next);
    if (w) {
      setScore((s) => ({ ...s, [w.player]: s[w.player] + 1 }));
    } else if (next.every(Boolean)) {
      setScore((s) => ({ ...s, draw: s.draw + 1 }));
    } else {
      setXTurn(!xTurn);
    }
  }

  function newRound() {
    setBoard(Array(9).fill(null));
    setXTurn(true);
  }

  function resetAll() {
    newRound();
    setScore({ X: 0, O: 0, draw: 0 });
  }

  let status;
  if (result) status = `Player ${result.player} wins!`;
  else if (isDraw) status = "It's a draw!";
  else status = `Player ${xTurn ? 'X' : 'O'}'s turn`;

  return (
    <div className="app">
      <h1>Tic Tac Toe</h1>

      <div className="scoreboard">
        <div className="score x"><span>X</span><b>{score.X}</b></div>
        <div className="score"><span>Draw</span><b>{score.draw}</b></div>
        <div className="score o"><span>O</span><b>{score.O}</b></div>
      </div>

      <div className={`status ${gameOver ? 'over' : ''}`}>{status}</div>

      <div className="board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`cell ${cell ? cell.toLowerCase() : ''} ${
              result && result.line.includes(i) ? 'win' : ''
            }`}
            onClick={() => play(i)}
            aria-label={`Cell ${i + 1}`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="actions">
        <button className="btn primary" onClick={newRound}>New Round</button>
        <button className="btn" onClick={resetAll}>Reset Score</button>
      </div>
    </div>
  );
}
