'use client';

import React from 'react';

interface GamificationBadgeToastProps {
  badges: string[];
}

export function GamificationBadgeToast({ badges }: GamificationBadgeToastProps) {
  if (!badges.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {badges.map((badge, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl bg-yellow-400 px-4 py-3 shadow-xl animate-bounce"
        >
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs font-semibold text-yellow-900">¡Nuevo logro!</p>
            <p className="text-sm font-bold text-yellow-900">{badge}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
