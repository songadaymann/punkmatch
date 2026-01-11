'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const TRACKS = [
  '/music/4406.mp3',
  '/music/4434.mp3',
  '/music/4446.mp3',
  '/music/4467.mp3',
  '/music/4511.mp3',
  '/music/5544.mp3',
  '/music/5739.mp3',
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function MusicPlayer() {
  const [muted, setMuted] = useState(true); // Start muted, user opts in
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize shuffled playlist
  useEffect(() => {
    setPlaylist(shuffle(TRACKS));
  }, []);

  // Handle track end - play next
  const playNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  }, [playlist.length]);

  // Set up audio element
  useEffect(() => {
    if (playlist.length === 0) return;

    const audio = new Audio(playlist[currentIndex]);
    audio.volume = 0.5;
    audioRef.current = audio;

    audio.addEventListener('ended', playNext);

    if (!muted) {
      audio.play().catch(() => {
        // Autoplay blocked - that's ok
      });
      setIsPlaying(true);
    }

    return () => {
      audio.removeEventListener('ended', playNext);
      audio.pause();
      audio.src = '';
    };
  }, [playlist, currentIndex, muted, playNext]);

  // Toggle mute
  const toggleMute = () => {
    if (muted) {
      // Unmuting - start playing
      setMuted(false);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      // Muting - pause
      setMuted(true);
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <button
      className="music-toggle"
      onClick={toggleMute}
      title={muted ? 'Play music' : 'Mute music'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
