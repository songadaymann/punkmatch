'use client';

import { useEffect, useRef } from 'react';

const TOTAL_PUNKS = 10000;

export function FloatingPunks() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function spawnFloatingPunk() {
      if (!container) return;

      const punk = document.createElement('img');
      const punkId = Math.floor(Math.random() * TOTAL_PUNKS);
      punk.src = `/punks/${punkId}.png`;
      punk.className = 'floating-punk';

      const size = 48 + Math.random() * 48;
      punk.style.width = `${size}px`;
      punk.style.height = `${size}px`;
      punk.style.left = `${Math.random() * 100}%`;

      const duration = 8 + Math.random() * 12;
      punk.style.animationDuration = `${duration}s`;

      container.appendChild(punk);

      setTimeout(() => {
        punk.remove();
      }, (duration + 2) * 1000);
    }

    // Initial burst
    for (let i = 0; i < 8; i++) {
      setTimeout(() => spawnFloatingPunk(), i * 300);
    }

    // Keep spawning
    const interval = setInterval(() => {
      if (container.children.length < 15) {
        spawnFloatingPunk();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return <div ref={containerRef} className="punk-bg" />;
}
