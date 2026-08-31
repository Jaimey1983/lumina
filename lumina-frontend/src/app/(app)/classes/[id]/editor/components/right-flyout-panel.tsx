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
import { SlideThemesPanel } from './panels/themes-panel';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { SlideTheme } from '@/types/slide.types';
import {
  LiveResponsesPanel,
  type StudentResponse,
} from './panels/live-responses-panel';
import { GamificationLeaderboard } from '@/components/gamification/gamification-leaderboard';
import type { EstudianteLeaderboard } from '@/hooks/use-gamification';
import { TorneoPanel } from '@/components/editor/panels/torneo-panel';
import { EscapeRoomLiveDashboard } from '@/components/editor/panels/escape-room-live-dashboard';
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
  activeSlide?: ApiSlide | null;
  activeTemaId?: string;
  customThemes?: SlideTheme[];
  isThemeSaving?: boolean;
  onApplyThemeToSlide?: (theme: SlideTheme) => void;
  onApplyThemeToAllSlides?: (theme: SlideTheme) => void;
  onSaveCustomThemes?: (themes: SlideTheme[]) => void;
  desempenoEnunciado?: string;
  hasActivity?: boolean;
  /** Inserta una actividad generada por IA en el slide actual (o crea uno nuevo). */
  onInsertActivity?: (activityContent: Record<string, unknown>) => void;
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
  gamificacionActiva?: boolean;
  gamificationLeaderboard?: EstudianteLeaderboard[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export const RightFlyoutPanel = forwardRef<HTMLElement, RightFlyoutPanelProps>(
  function RightFlyoutPanel(
    {
      activePanel,
      onClose,
      onAddActivity,
      activeSlide,
      activeTemaId,
      customThemes = [],
      isThemeSaving,
      onApplyThemeToSlide,
      onApplyThemeToAllSlides,
      onSaveCustomThemes,
      desempenoEnunciado,
      hasActivity,
      onInsertActivity,
      liveResponses,
      activeSlideId,
      activeSlideIndex,
      activeActivity,
      showAutonomousSlideProgress,
      autonomousStudentsPerSlide,
      liveSocket,
      liveSessionId,
      classId,
      gamificacionActiva,
      gamificationLeaderboard = [],
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
          activePanel
            ? activePanel === 'themes'
              ? 'w-72 opacity-100'
              : 'w-64 opacity-100'
            : 'w-0 border-transparent opacity-0 shadow-none',
        )}
      >
      {activePanel && (
        <div
          className={cn(
            activePanel === 'themes' ? 'flex h-full w-72 flex-col' : 'flex h-full w-64 flex-col',
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
              <ActivitiesAiPanel
                desempenoEnunciado={desempenoEnunciado}
                hasActivity={hasActivity}
                onInsertActivity={onInsertActivity}
              />
            )}
            {activePanel === 'activities' && (
              <ActivitiesPanel
                onAddActivity={onAddActivity}
                hasActivity={hasActivity}
              />
            )}
            {activePanel === 'themes' && onApplyThemeToSlide && onApplyThemeToAllSlides && onSaveCustomThemes && (
              <SlideThemesPanel
                activeSlide={activeSlide ?? null}
                activeTemaId={activeTemaId}
                customThemes={customThemes}
                isSaving={isThemeSaving}
                onApplyToCurrentSlide={onApplyThemeToSlide}
                onApplyToAllSlides={onApplyThemeToAllSlides}
                onSaveCustomThemes={onSaveCustomThemes}
              />
            )}
            {activePanel === 'live' &&
              activeActivity?.tipo === 'torneo' &&
              liveSocket &&
              classId ? (
                <TorneoPanel
                  classId={classId}
                  sessionId={liveSessionId ?? classId}
                  activity={activeActivity}
                  socket={liveSocket}
                />
              ) : activePanel === 'live' &&
                activeActivity?.tipo === 'escape_room' &&
                liveSocket &&
                classId &&
                activeSlideId ? (
                <EscapeRoomLiveDashboard
                  classId={classId}
                  slideId={activeSlideId}
                  activity={activeActivity}
                  socket={liveSocket}
                />
              ) : activePanel === 'live' ? (
                <div className="flex flex-col gap-4 p-3">
                  {gamificacionActiva && gamificationLeaderboard.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#2563EB]">
                        Ranking XP
                      </p>
                      <GamificationLeaderboard leaderboard={gamificationLeaderboard} />
                    </div>
                  ) : null}
                  <LiveResponsesPanel
                    liveResponses={liveResponses ?? new Map()}
                    activeSlideId={activeSlideId ?? ''}
                    activeSlideIndex={activeSlideIndex ?? 0}
                    activeActivity={activeActivity}
                    showAutonomousSlideProgress={showAutonomousSlideProgress}
                    autonomousStudentsPerSlide={autonomousStudentsPerSlide}
                  />
                </div>
              ) : null
            }
          </div>

        </div>
      )}
      </aside>
    );
  }
);
