'use client'

import React from 'react'

interface ActivityTimerProps {
  segundos: number           // segundos restantes (controlado externamente)
  urgente?: number           // segundos para activar estilo urgente (default 10)
}

export function ActivityTimer({ segundos, urgente = 10 }: ActivityTimerProps) {
  const mins = Math.floor(segundos / 60)
  const secs = segundos % 60
  const esUrgente = segundos <= urgente && segundos >= 0

  return (
    <div
      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold tabular-nums transition-colors ${
        esUrgente
          ? 'bg-red-100 text-red-600 animate-pulse'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`}
    </div>
  )
}
