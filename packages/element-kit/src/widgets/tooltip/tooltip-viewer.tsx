import { useCallback, useEffect, useRef, useState } from 'react';
import type { TooltipWidget } from '@lumina/types/widget';
import { useEscapeToClose } from '@lumina/editor-shared/widget-editor-utils';
import { TooltipParts } from './tooltip-parts.js';
import { tooltipChromeStyle } from './tooltip-config.js';

const LEAVE_DELAY_MS = 180;

interface TooltipViewerProps {
  block: TooltipWidget;
}

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

export function TooltipViewer({ block }: TooltipViewerProps) {
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
    clearLeaveTimer();
    setIsOpen(true);
  }, [clearLeaveTimer]);

  const close = useCallback(() => {
    clearLeaveTimer();
    setIsOpen(false);
  }, [clearLeaveTimer]);

  const scheduleClose = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      leaveTimerRef.current = null;
    }, LEAVE_DELAY_MS);
  }, [clearLeaveTimer]);

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer]);
  useEscapeToClose(isOpen, close);

  const handleFocus = () => {
    if (coarseRef.current) return;
    open();
  };

  const handleBlur = () => {
    if (coarseRef.current) return;
    scheduleClose();
  };

  useEffect(() => {
    if (!isOpen || !coarseRef.current) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

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
        isOpen={isOpen}
        isEditing={false}
        onToggle={handleToggle}
        onFocusTrigger={handleFocus}
        onBlurTrigger={handleBlur}
      />
    </div>
  );
}
