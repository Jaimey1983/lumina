'use client';

import * as React from 'react';
import { cn } from './lib/utils.js';
import { Skeleton } from './skeleton.js';

export interface StatTrend {
  value: number;
  label?: string;
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: StatTrend | React.ReactNode;
  subLabel?: React.ReactNode;
  loading?: boolean;
  variant?: 'gradient' | 'flat';
}

function renderTrend(trend?: StatTrend | React.ReactNode) {
  if (trend == null) return null;

  if (React.isValidElement(trend)) {
    return trend;
  }

  if (typeof trend === 'object' && 'value' in trend) {
    const diff = trend.value;
    if (diff === 0) {
      return (
        <p className="mt-1 text-lumina-sm font-semibold text-[#9ca3af] dark:text-muted-foreground">
          {trend.label ?? 'Sin cambio vs. mes anterior'}
        </p>
      );
    }
    const up = diff > 0;
    return (
      <p
        className="mt-1 text-lumina-sm font-semibold"
        style={{ color: up ? '#34d399' : '#f87171' }}
      >
        {trend.label ?? `${up ? '+' : ''}${diff} vs. mes anterior`}
      </p>
    );
  }

  return (
    <p className="mt-1 text-lumina-sm font-semibold text-[#6b7280] dark:text-muted-foreground">
      {trend}
    </p>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  subLabel,
  loading = false,
  variant = 'gradient',
  className,
  ...props
}: StatCardProps) {
  if (variant === 'flat') {
    return (
      <div
        data-slot="stat-card"
        data-variant="flat"
        className={cn(
          'rounded-[10px] border border-[#e5e7eb] bg-white p-5 shadow-[0px_2px_6px_rgb(37_99_235_/_0.08)] dark:border-border dark:bg-card',
          className,
        )}
        {...props}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280] dark:text-muted-foreground">
            {label}
          </span>
          {icon ? <span className="text-[#9ca3af] dark:text-muted-foreground">{icon}</span> : null}
        </div>
        {loading ? (
          <>
            <Skeleton className="mb-1.5 h-9 w-28" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <p className="text-3xl font-bold leading-none text-[#111827] dark:text-foreground">
              {value}
            </p>
            {subLabel ? (
              <p className="mt-1.5 text-xs text-[#6b7280] dark:text-muted-foreground">
                {subLabel}
              </p>
            ) : null}
            {renderTrend(trend)}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      data-slot="stat-card"
      data-variant="gradient"
      className={cn(
        'rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-lumina-xs dark:border-border dark:bg-card',
        className,
      )}
      {...props}
    >
      {loading ? (
        <div data-slot="stat-card-skeleton" className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-extrabold">
              <span className="bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">
                {value}
              </span>
            </div>
            {icon ? <span className="text-[#9ca3af] dark:text-muted-foreground">{icon}</span> : null}
          </div>
          <p className="mt-0.5 text-lumina-sm font-medium text-[#6b7280] dark:text-muted-foreground">
            {label}
          </p>
          {subLabel ? (
            <p className="mt-1 text-xs text-[#6b7280] dark:text-muted-foreground">{subLabel}</p>
          ) : null}
          {renderTrend(trend)}
        </>
      )}
    </div>
  );
}
