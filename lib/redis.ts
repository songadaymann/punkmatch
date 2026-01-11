import { Redis } from '@upstash/redis';

// Initialize Redis client
// These env vars are auto-set when you add Upstash from Vercel Marketplace
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// Leaderboard key format: leaderboard:{gridSize}
export function getLeaderboardKey(gridSize: number): string {
  return `leaderboard:${gridSize}`;
}

export interface LeaderboardEntry {
  address: string;
  name: string;
  moves: number;
  time: number;
  timestamp: number;
}
