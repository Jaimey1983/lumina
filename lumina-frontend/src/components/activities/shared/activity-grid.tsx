'use client';

import React from 'react';

interface ActivityGridProps {
  columnas: number;
  gap?: number;
  children: React.ReactNode;
  className?: string;
}

export function ActivityGrid({
  columnas,
  gap = 12,
  children,
  className = '',
}: ActivityGridProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnas}, 1fr)`,
        gap: `${gap}px`,
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}
