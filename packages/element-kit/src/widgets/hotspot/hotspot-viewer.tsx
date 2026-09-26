import { useState } from 'react';
import type { HotspotWidget } from '@lumina/types/widget';
import { HotspotParts } from './hotspot-parts.js';
import { hotspotChromeStyle } from './hotspot-config.js';

interface HotspotViewerProps {
  block: HotspotWidget;
}

export function HotspotViewer({ block }: HotspotViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div style={hotspotChromeStyle(block)} className="w-full h-full relative">
      <HotspotParts
        block={block}
        isOpen={isOpen}
        isEditing={false}
        onToggle={handleToggle}
        onClose={handleClose}
      />
    </div>
  );
}
