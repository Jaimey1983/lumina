'use client';

import React from 'react';
import type { EstudianteLeaderboard } from '@/hooks/use-gamification';

interface GamificationLeaderboardProps {
  leaderboard: EstudianteLeaderboard[];
  miStudentId?: string;
  compact?: boolean;
}

export function GamificationLeaderboard({
  leaderboard,
  miStudentId,
  compact = false,
}: GamificationLeaderboardProps) {
  if (!leaderboard.length) return null;

  const top = compact ? leaderboard.slice(0, 5) : leaderboard.slice(0, 10);

  return (
    <div className={`flex flex-col gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
      {top.map((e, i) => {
        const esMio = e.studentId === miStudentId;
        const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return (
          <div
            key={e.studentId}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
              esMio
                ? 'bg-[#2563EB] text-white'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            <span className="w-6 shrink-0 text-center">{medalla}</span>
            <span className="flex-1 truncate font-medium">{e.nombre}</span>
            {e.racha > 1 && (
              <span className="text-orange-400 text-xs">🔥{e.racha}</span>
            )}
            <span className="font-bold tabular-nums">{e.xp} XP</span>
          </div>
        );
      })}
    </div>
  );
}
