'use client'

import React from 'react'

interface ActivityLivesProps {
  vidas: number        // vidas actuales
  maxVidas: number     // vidas máximas (para mostrar corazones vacíos)
}

export function ActivityLives({ vidas, maxVidas }: ActivityLivesProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxVidas }, (_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 transition-all ${i < vidas ? 'text-red-500' : 'text-gray-300'}`}
          fill={i < vidas ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ))}
    </div>
  )
}
