import { NextRequest, NextResponse } from 'next/server';
import { redis, getLeaderboardKey, LeaderboardEntry } from '@/lib/redis';

// GET /api/leaderboard?gridSize=4&limit=10
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gridSize = parseInt(searchParams.get('gridSize') || '4');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const key = getLeaderboardKey(gridSize);

    // Get top scores (lowest moves = best, so we use ZRANGE with low scores first)
    const entries = await redis.zrange<LeaderboardEntry[]>(key, 0, limit - 1, {
      withScores: false,
    });

    return NextResponse.json({
      success: true,
      gridSize,
      entries: entries || [],
    });
  } catch (error) {
    console.error('Leaderboard GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

// POST /api/leaderboard
// Body: { address, name, moves, time, gridSize }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, name, moves, time, gridSize } = body;

    // Validate required fields
    if (!address || !name || moves === undefined || time === undefined || !gridSize) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Sanitize name (max 20 chars, alphanumeric + spaces)
    const sanitizedName = name.slice(0, 20).replace(/[^a-zA-Z0-9 ._-]/g, '');

    const entry: LeaderboardEntry = {
      address,
      name: sanitizedName,
      moves: parseInt(moves),
      time: parseInt(time),
      timestamp: Date.now(),
    };

    const key = getLeaderboardKey(gridSize);

    // Score = moves * 10000 + time (prioritize fewer moves, then faster time)
    const score = entry.moves * 10000 + entry.time;

    // Add to sorted set (lower score = better)
    await redis.zadd(key, {
      score,
      member: JSON.stringify(entry),
    });

    // Get the player's rank
    const rank = await redis.zrank(key, JSON.stringify(entry));

    return NextResponse.json({
      success: true,
      entry,
      rank: rank !== null ? rank + 1 : null,
    });
  } catch (error) {
    console.error('Leaderboard POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}
