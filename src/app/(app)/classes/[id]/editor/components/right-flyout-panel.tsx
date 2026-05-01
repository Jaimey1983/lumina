'use client';

import { forwardRef } from 'react';
import type { Socket } from 'socket.io-client';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RightPanelId } from './right-rail';
import type { ActivityType } from './panels/activities-panel';
import { ActivitiesAiPanel } from './panels/activities-ai-panel';
import { ActivitiesPanel } from './panels/activities-panel';
import { ThemesPanel } from './panels/themes-panel';
import {
  LiveResponsesPanel,
  type StudentResponse,
} from './panels/live-responses-panel';
import { TorneoPanel } from '@/components/editor/panels/torneo-panel';
import type { Activity } from '@/types/slide.types';

// ─── Panel labels ─────────────────────────────────────────────────────────────

const PANEL_LABELS: Record<RightPanelId, string> = {
  ia:         'Actividades con IA',
  activities: 'Actividades',
  themes:     'Temas',
  live:       'En vivo',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RightFlyoutPanelProps {
  activePanel: RightPanelId | null;
  onClose: () => void;
  onAddActivity: (type: ActivityType) => void;
  onApplyTheme: (bg: string) => void;
  desempenoEnunciado?: string;
  hasActivity?: boolean;
  liveResponses?: Map<string, { activityType: string; responses: StudentResponse[] }>;
  activeSlideId?: string;
  activeSlideIndex?: number;
  activeActivity?: Activity | null;
  showAutonomousSlideProgress?: boolean;
  autonomousStudentsPerSlide?: number[];
  /** Socket de la sesión en vivo — requerido para TorneoPanel. */
  liveSocket?: Socket | null;
  /** ID de la sesión en vivo activa. */
  liveSessionId?: string | null;
  /** classId activo. */
  classId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const RightFlyoutPanel = forwardRef<HTMLElement, RightFlyoutPanelProps>(
  function RightFlyoutPanel(
    {
      activePanel,
      onClose,
      onAddActivity,
      onApplyTheme,
      desempenoEnunciado,
      hasActivity,
      liveResponses,
      activeSlideId,
      activeSlideIndex,
      activeActivity,
      showAutonomousSlideProgress,
      autonomousStudentsPerSlide,
      liveSocket,
      liveSessionId,
      classId,
    },
    ref,
  ) {
    return (
      <aside
        ref={ref}
        className={cn(
          'flex shrink-0 flex-col overflow-hidden border-l border-[#e5e7eb] bg-white shadow-xl',
          'motion-safe:transition-[width,box-shadow,opacity] motion-safe:duration-200 motion-safe:ease-out',
          'motion-reduce:transition-none',
          activePanel ? 'w-64 opacity-100' : 'w-0 border-transparent opacity-0 shadow-none',
        )}
      >
      {activePanel && (
        <div
          className={cn(
            'flex h-full w-64 flex-col',
            'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-200',
            'motion-reduce:animate-none',
          )}
        >

          {/* Header */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#e5e7eb] px-4">
            <span className="border-b-2 border-[#2563EB] pb-0.5 text-xs font-bold leading-tight text-[#2563EB]">
              {PANEL_LABELS[activePanel]}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label="Cerrar panel"
              onClick={onClose}
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activePanel === 'ia' && (
              <ActivitiesAiPanel desempenoEnunciado={desempenoEnunciado} hasActivity={hasActivity} />
            )}
            {activePanel === 'activities' && (
              <ActivitiesPanel onAddActivity={onAddActivity} hasActivity={hasActivity} />
            )}
            {activePanel === 'themes' && (
              <ThemesPanel onApplyTheme={onApplyTheme} />
            )}
            {activePanel === 'live' &&
              activeActivity?.tipo === 'torneo' &&
              liveSocket &&
              liveSessionId &&
              classId ? (
                <TorneoPanel
                  classId={classId}
                  sessionId={liveSessionId}
                  activity={activeActivity}
                  socket={liveSocket}
                />
              ) : activePanel === 'live' ? (
                <LiveResponsesPanel
                  liveResponses={liveResponses ?? new Map()}
                  activeSlideId={activeSlideId ?? ''}
                  activeSlideIndex={activeSlideIndex ?? 0}
                  activeActivity={activeActivity}
                  showAutonomousSlideProgress={showAutonomousSlideProgress}
                  autonomousStudentsPerSlide={autonomousStudentsPerSlide}
                />
              ) : null
            }
          </div>

        </div>
      )}
      </aside>
    );
  }
);
