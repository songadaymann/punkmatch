'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Leaderboard } from './Leaderboard';
import { FloatingPunks } from './FloatingPunks';

const TOTAL_PUNKS = 10000;

interface PunkMetadata {
  id: number;
  type: string;
  gender: string;
  skinTone: string | null;
  accessoryCount: number;
  accessories: string[];
}

interface CardData {
  punkId: number;
  index: number;
  flipped: boolean;
  matched: boolean;
}

function formatTime(secs: number): string {
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, '0')}`;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function calculateSimilarity(punk1: PunkMetadata, punk2: PunkMetadata): number {
  let score = 0;
  if (punk1.type === punk2.type) score += 0.3;
  if (punk1.gender === punk2.gender) score += 0.2;
  if (punk1.skinTone === punk2.skinTone) score += 0.2;

  const set1 = new Set(punk1.accessories);
  const set2 = new Set(punk2.accessories);
  const intersection = [...set1].filter((x) => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;
  if (union > 0) score += 0.3 * (intersection / union);

  return score;
}

export function Game() {
  const { address, isConnected } = useAccount();

  // Metadata
  const [metadata, setMetadata] = useState<PunkMetadata[]>([]);
  const [rarePunks, setRarePunks] = useState<PunkMetadata[]>([]);
  const [humanPunks, setHumanPunks] = useState<PunkMetadata[]>([]);

  // Game state
  const [gridSize, setGridSize] = useState(4);
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Win modal
  const [showWinModal, setShowWinModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rank, setRank] = useState<number | null>(null);

  // Leaderboard refresh key
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  // Load metadata
  useEffect(() => {
    fetch('/punks-metadata.json')
      .then((res) => res.json())
      .then((data: PunkMetadata[]) => {
        setMetadata(data);
        setRarePunks(data.filter((p) => ['Alien', 'Ape', 'Zombie'].includes(p.type)));
        setHumanPunks(data.filter((p) => p.type === 'Human'));
      })
      .catch((e) => console.warn('Could not load metadata:', e));
  }, []);

  // Timer
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Get diverse punk IDs
  const getDiversePunkIds = useCallback(
    (count: number): number[] => {
      if (metadata.length === 0) {
        const ids = new Set<number>();
        while (ids.size < count) {
          ids.add(Math.floor(Math.random() * TOTAL_PUNKS));
        }
        return Array.from(ids);
      }

      const selected: PunkMetadata[] = [];
      const MAX_SIMILARITY = 0.5;

      // Always include at least one rare
      if (rarePunks.length > 0) {
        selected.push(rarePunks[Math.floor(Math.random() * rarePunks.length)]);
      }

      const candidates = shuffle([...humanPunks]);
      let attempts = 0;

      while (selected.length < count && attempts < 1000) {
        attempts++;
        const candidate = candidates[attempts % candidates.length];

        let tooSimilar = false;
        for (const existing of selected) {
          if (calculateSimilarity(candidate, existing) > MAX_SIMILARITY) {
            tooSimilar = true;
            break;
          }
        }

        if (!tooSimilar && !selected.find((s) => s.id === candidate.id)) {
          selected.push(candidate);
        }
      }

      while (selected.length < count) {
        const randomPunk = metadata[Math.floor(Math.random() * metadata.length)];
        if (!selected.find((s) => s.id === randomPunk.id)) {
          selected.push(randomPunk);
        }
      }

      return selected.map((p) => p.id);
    },
    [metadata, rarePunks, humanPunks]
  );

  // Initialize game
  const initGame = useCallback(() => {
    setShowWinModal(false);
    setSubmitted(false);
    setRank(null);
    setTimerRunning(false);
    setSeconds(0);
    setMoves(0);
    setFlippedIndices([]);
    setIsLocked(false);

    const numPairs = (gridSize * gridSize) / 2;
    const punkIds = getDiversePunkIds(numPairs);
    const cardPairs = shuffle([...punkIds, ...punkIds]);

    setCards(
      cardPairs.map((punkId, index) => ({
        punkId,
        index,
        flipped: false,
        matched: false,
      }))
    );
  }, [gridSize, getDiversePunkIds]);

  // Initialize on mount and grid change
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Handle card click
  const handleCardClick = (index: number) => {
    if (isLocked) return;
    if (cards[index].flipped || cards[index].matched) return;

    // Start timer on first click
    if (!timerRunning) {
      setTimerRunning(true);
    }

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);

      const [first, second] = newFlipped;
      const match = cards[first].punkId === cards[second].punkId;

      if (match) {
        newCards[first].matched = true;
        newCards[second].matched = true;
        setCards(newCards);
        setFlippedIndices([]);

        // Check for win
        const allMatched = newCards.every((c) => c.matched);
        if (allMatched) {
          setTimerRunning(false);
          setShowWinModal(true);
        }
      } else {
        setIsLocked(true);
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[first].flipped = false;
          resetCards[second].flipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 800);
      }
    }
  };

  // Submit score
  const submitScore = async () => {
    if (!address || !playerName.trim()) return;

    setSubmitting(true);
    try {
      // Score = moves * 10000 + time (lower is better)
      const score = moves * 10000 + seconds;

      const res = await fetch('https://mann.cool/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'punkmatch',
          variant: `${gridSize}x${gridSize}`,
          address,
          name: playerName.trim(),
          score,
          moves,
          time: seconds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setRank(data.rank);
        setLeaderboardKey((k) => k + 1);
      }
    } catch (e) {
      console.error('Failed to submit score:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const matchedCount = cards.filter((c) => c.matched).length / 2;
  const totalPairs = (gridSize * gridSize) / 2;

  return (
    <>
      <FloatingPunks />
      <div className="dither" />

      <div className="container">
        <div className="header">
          <div className="header-center">
            <h1>punk. match.</h1>
            <div className="subtitle">10,000 cryptopunks. one memory.</div>
          </div>
          <div className="header-wallet">
            <ConnectButton />
          </div>
        </div>

        <div className="controls">
          <label>
            grid:
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
            >
              <option value={4}>4x4</option>
              <option value={6}>6x6</option>
              <option value={8}>8x8</option>
              <option value={16}>16x16</option>
            </select>
          </label>
          <button className="btn" onClick={initGame}>
            new game
          </button>
        </div>

        <div className="stats">
          <span>
            moves: <span>{moves}</span>
          </span>
          <span>
            time: <span>{formatTime(seconds)}</span>
          </span>
          <span>
            matched: <span>{matchedCount}/{totalPairs}</span>
          </span>
        </div>

        <div
          className="game-board"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              className={`card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
              onClick={() => handleCardClick(i)}
            >
              <div className="card-inner">
                <div className="card-front">P</div>
                <div className="card-back">
                  <img
                    src={`/punks/${card.punkId}.png`}
                    alt={`Punk #${card.punkId}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Leaderboard key={leaderboardKey} gridSize={gridSize} />

        {/* Win Modal */}
        {showWinModal && (
          <div className="modal-overlay" onClick={() => !submitting && setShowWinModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>matched.</h2>
              <p>
                moves: <span>{moves}</span>
              </p>
              <p>
                time: <span>{formatTime(seconds)}</span>
              </p>

              {!submitted ? (
                <>
                  {isConnected ? (
                    <>
                      <input
                        type="text"
                        placeholder="enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={20}
                        disabled={submitting}
                      />
                      <div className="modal-buttons">
                        <button
                          className="btn"
                          onClick={submitScore}
                          disabled={!playerName.trim() || submitting}
                        >
                          {submitting ? 'submitting...' : 'submit score'}
                        </button>
                        <button className="btn" onClick={initGame}>
                          play again
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
                        connect wallet to save score
                      </p>
                      <div className="modal-buttons">
                        <ConnectButton />
                        <button className="btn" onClick={initGame}>
                          play again
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p>
                    rank: <span>#{rank}</span>
                  </p>
                  <div className="modal-buttons">
                    <button className="btn" onClick={initGame}>
                      play again
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
