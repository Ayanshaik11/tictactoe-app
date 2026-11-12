import React, { useEffect, useRef, useState } from 'react';
import { bestMoves, computerMove, getWinner } from './ai';
import {
  initAds, isNative, setAdSimulator, showInterstitial, showRewarded,
} from './ads';
import { INTERSTITIAL_EVERY } from './adsConfig';

const EMPTY = () => Array(9).fill(null);

function load(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

/** Browser-only stand-in for full screen ads, so the design can be previewed. */
function FakeAd({ kind, onDone }) {
  const [left, setLeft] = useState(3);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const rewarded = kind === 'rewarded';
  return (
    <div className="fake-ad" role="dialog" aria-modal="true">
      <div className="fake-card">
        <small>{rewarded ? 'Rewarded video' : 'Interstitial'} · test ad</small>
        <h2>Unity Ads</h2>
        <p>{rewarded ? 'Watch to the end to earn your hint.' : 'Full-screen ad between rounds.'}</p>
        {left > 0 ? (
          <div className="btn" aria-live="polite">Ad ends in {left}s</div>
        ) : (
          <button className="btn primary" onClick={() => onDone('completed')}>
            {rewarded ? 'Claim reward' : 'Close'}
          </button>
        )}
        {rewarded && left > 0 && (
          <button className="link" onClick={() => onDone('skipped')}>Skip (no reward)</button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState(() => load('ttt-mode', 'cpu'));       // 'cpu' | 'pvp'
  const [level, setLevel] = useState(() => load('ttt-level', 'medium')); // easy | medium | hard
  const [board, setBoard] = useState(EMPTY);
  const [turn, setTurn] = useState('X');
  const [round, setRound] = useState(0);        // decides who starts
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });
  const [hint, setHint] = useState(null);
  const [toast, setToast] = useState('');
  const [adBusy, setAdBusy] = useState(false);
  const [fake, setFake] = useState(null);       // browser-only fake ad
  const finished = useRef(0);                   // rounds finished
  const lastAd = useRef(0);

  const result = getWinner(board);
  const isDraw = !result && board.every(Boolean);
  const gameOver = Boolean(result) || isDraw;
  const cpuTurn = mode === 'cpu' && turn === 'O' && !gameOver;

  useEffect(() => {
    setAdSimulator((kind) => new Promise((resolve) => setFake({ kind, resolve })));
    initAds();
  }, []);

  useEffect(() => { save('ttt-mode', mode); }, [mode]);
  useEffect(() => { save('ttt-level', level); }, [level]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function place(i, player) {
    const next = board.slice();
    next[i] = player;
    setBoard(next);
    setHint(null);
    const w = getWinner(next);
    if (w) {
      finished.current += 1;
      setScore((s) => ({ ...s, [w.player]: s[w.player] + 1 }));
    } else if (next.every(Boolean)) {
      finished.current += 1;
      setScore((s) => ({ ...s, draw: s.draw + 1 }));
    } else {
      setTurn(player === 'X' ? 'O' : 'X');
    }
  }

  function play(i) {
    if (board[i] || gameOver || cpuTurn || adBusy) return;
    place(i, turn);
  }

  // Computer plays 'O'
  useEffect(() => {
    if (!cpuTurn || adBusy) return undefined;
    const t = setTimeout(() => place(computerMove(board, 'O', level), 'O'), 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpuTurn, adBusy, board, level]);

  async function startRound(nextRound = round + 1) {
    setBoard(EMPTY());
    setHint(null);
    setRound(nextRound);
    setTurn(nextRound % 2 === 0 ? 'X' : 'O'); // alternate who starts
  }

  async function newRound() {
    if (adBusy) return;
    // Interstitial: after every N finished rounds, only when starting a new one
    if (finished.current - lastAd.current >= INTERSTITIAL_EVERY) {
      lastAd.current = finished.current;
      setAdBusy(true);
      await showInterstitial();
      setAdBusy(false);
    }
    startRound();
  }

  function resetAll() {
    if (adBusy) return;
    setScore({ X: 0, O: 0, draw: 0 });
    finished.current = 0;
    lastAd.current = 0;
    startRound(0);
  }

  function changeMode(m) {
    if (m === mode) return;
    setMode(m);
    resetAll();
  }

  async function getHint() {
    if (adBusy || gameOver || cpuTurn || hint !== null) return;
    setAdBusy(true);
    const r = await showRewarded();
    setAdBusy(false);
    if (r === 'completed') {
      const moves = bestMoves(board, turn);
      setHint(moves[0]);
      setToast('Hint unlocked!');
    } else if (r === 'skipped') {
      setToast('Watch the full ad to get a hint');
    } else {
      setToast('No ad available, try again soon');
    }
  }

  const names = mode === 'cpu'
    ? { X: 'You (X)', O: 'Computer (O)' }
    : { X: 'Player X', O: 'Player O' };

  let status;
  if (result) {
    status = mode === 'cpu'
      ? (result.player === 'X' ? 'You win!' : 'Computer wins!')
      : `Player ${result.player} wins!`;
  } else if (isDraw) status = "It's a draw!";
  else if (mode === 'cpu') status = turn === 'X' ? 'Your turn' : 'Computer is thinking…';
  else status = `Player ${turn}'s turn`;

  return (
    <div className="app">
      <main className="stage">
        <h1>Tic Tac Toe</h1>

        <div className="seg" role="tablist" aria-label="Game mode">
          <button className={mode === 'cpu' ? 'on' : ''} onClick={() => changeMode('cpu')}>
            vs Computer
          </button>
          <button className={mode === 'pvp' ? 'on' : ''} onClick={() => changeMode('pvp')}>
            2 Players
          </button>
        </div>

        <div className={`seg small ${mode === 'cpu' ? '' : 'hidden'}`} aria-label="Difficulty">
          {['easy', 'medium', 'hard'].map((l) => (
            <button key={l} className={level === l ? 'on' : ''} onClick={() => setLevel(l)}
              tabIndex={mode === 'cpu' ? 0 : -1}>
              {l[0].toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>

        <div className="scoreboard">
          <div className="score x"><span>{names.X}</span><b>{score.X}</b></div>
          <div className="score"><span>Draw</span><b>{score.draw}</b></div>
          <div className="score o"><span>{names.O}</span><b>{score.O}</b></div>
        </div>

        <div className={`status ${gameOver ? 'over' : ''}`} aria-live="polite">{status}</div>

        <div className="board">
          {board.map((cell, i) => (
            <button
              key={i}
              className={`cell ${cell ? cell.toLowerCase() : ''} ${
                result && result.line.includes(i) ? 'win' : ''
              } ${hint === i ? 'hint' : ''}`}
              onClick={() => play(i)}
              aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ''}`}
            >
              {cell}
            </button>
          ))}
        </div>

        <div className="actions">
          <button className="btn primary" onClick={newRound}>New Round</button>
          <button className="btn" onClick={resetAll}>Reset Score</button>
          <button className="btn wide hintbtn" onClick={getHint}
            disabled={gameOver || cpuTurn || adBusy || hint !== null}>
            Hint <small>· watch a short ad</small>
          </button>
        </div>
      </main>

      {/* Banner ad lives here. Native Unity banner overlays this slot. */}
      <div className={`ad-slot ${isNative ? 'native' : ''}`}>
        {!isNative && <span>Banner ad · test</span>}
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
      {fake && (
        <FakeAd
          kind={fake.kind}
          onDone={(r) => { fake.resolve(r); setFake(null); }}
        />
      )}
    </div>
  );
}
