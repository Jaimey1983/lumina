import { useCallback, useEffect, useRef, useState } from 'react';
import type { TooltipWidget } from '@/types/widget.types';
import { useEscapeToClose } from '@/components/widgets/shared/widget-editor-utils';
import { TooltipParts } from './tooltip-parts';
import { tooltipChromeStyle } from './tooltip-config';

const LEAVE_DELAY_MS = 180;

interface TooltipViewerProps {
  block: TooltipWidget;
  isThumbnail?: boolean;
}

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

export function TooltipViewer({ block, isThumbnail = false }: TooltipViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const coarseRef = useRef(false);

  useEffect(() => {
    coarseRef.current = isCoarsePointer();
  }, []);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const open = useCallback(() => {
    if (isThumbnail) return;
    clearLeaveTimer();
    setIsOpen(true);
  }, [clearLeaveTimer, isThumbnail]);

  const close = useCallback(() => {
    if (isThumbnail) return;
    clearLeaveTimer();
    setIsOpen(false);
  }, [clearLeaveTimer, isThumbnail]);

  const scheduleClose = useCallback(() => {
    if (isThumbnail) return;
    clearLeaveTimer();
    leaveTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      leaveTimerRef.current = null;
    }, LEAVE_DELAY_MS);
  }, [clearLeaveTimer, isThumbnail]);

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer]);
  useEscapeToClose(isOpen && !isThumbnail, close);

  const handleFocus = () => {
    if (coarseRef.current) return;
    open();
  };

  const handleBlur = () => {
    if (coarseRef.current) return;
    scheduleClose();
  };

  useEffect(() => {
    if (!isOpen || isThumbnail || !coarseRef.current) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, isThumbnail]);

  const handleMouseEnter = () => {
    if (coarseRef.current) return;
    open();
  };

  const handleMouseLeave = () => {
    if (coarseRef.current) return;
    scheduleClose();
  };

  const handleToggle = () => {
    if (!coarseRef.current) return;
    if (isOpen) close();
    else open();
  };

  return (
    <div
      ref={rootRef}
      style={tooltipChromeStyle(block)}
      className="relative h-full w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TooltipParts
        block={block}
        isOpen={isThumbnail ? false : isOpen}
        isEditing={false}
        onToggle={handleToggle}
        onFocusTrigger={handleFocus}
        onBlurTrigger={handleBlur}
      />
    </div>
  );
}
