import { useState } from 'react';
import type { HotspotWidget } from '@/types/widget.types';
import { HotspotParts } from './hotspot-parts';
import { hotspotChromeStyle } from './hotspot-config';

interface HotspotViewerProps {
  block: HotspotWidget;
  isThumbnail?: boolean;
}

export function HotspotViewer({ block, isThumbnail = false }: HotspotViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (!isThumbnail) {
      setIsOpen((prev) => !prev);
    }
  };

  const handleClose = () => {
    if (!isThumbnail) {
      setIsOpen(false);
    }
  };

  return (
    <div style={hotspotChromeStyle(block)} className="w-full h-full relative">
      <HotspotParts
        block={block}
        isOpen={isThumbnail ? false : isOpen}
        isEditing={false}
        onToggle={handleToggle}
        onClose={handleClose}
      />
    </div>
  );
}
