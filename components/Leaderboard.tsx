'use client';

import { useEffect, useState } from 'react';
import { LeaderboardEntry } from '@/lib/redis';

interface LeaderboardProps {
  gridSize: number;
}

function formatTime(secs: number): string {
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, '0')}`;
}

export function Leaderboard({ gridSize }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?gridSize=${gridSize}&limit=10`);
        const data = await res.json();
        if (data.success) {
          // Parse entries (they come as JSON strings from Redis)
          const parsed = data.entries.map((e: string | LeaderboardEntry) =>
            typeof e === 'string' ? JSON.parse(e) : e
          );
          setEntries(parsed);
        }
      } catch (e) {
        console.error('Failed to fetch leaderboard:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [gridSize]);

  if (loading) {
    return (
      <div className="leaderboard">
        <h3>leaderboard</h3>
        <p style={{ textAlign: 'center', color: 'var(--cyan)' }}>loading...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="leaderboard">
        <h3>leaderboard ({gridSize}x{gridSize})</h3>
        <p style={{ textAlign: 'center', color: 'var(--cyan)', fontSize: '1.2rem' }}>
          no scores yet. be the first!
        </p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h3>leaderboard ({gridSize}x{gridSize})</h3>
      <div className="leaderboard-table">
        <div className="leaderboard-row header">
          <span>#</span>
          <span>name</span>
          <span className="moves">moves</span>
          <span className="time">time</span>
        </div>
        {entries.map((entry, i) => (
          <div key={i} className="leaderboard-row">
            <span className="rank">{i + 1}</span>
            <span className="name">{entry.name}</span>
            <span className="moves">{entry.moves}</span>
            <span className="time">{formatTime(entry.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
