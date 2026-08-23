import { useCallback } from 'react';
import type {
  HotspotInnerSelection,
  HotspotWidget,
  WidgetSlideContent,
  WidgetSlideTextField,
} from '@/types/widget.types';
import { HotspotParts } from './hotspot-parts';
import { hotspotChromeStyle, isEditingHotspotOverlay, normalizeHotspotWidget } from './hotspot-config';

interface HotspotEditorProps {
  block: HotspotWidget;
  onChange: (block: HotspotWidget) => void;
  onEnsureBlockSelected: () => void;
  innerSelection: HotspotInnerSelection | null;
  onInnerSelectionChange?: (sel: HotspotInnerSelection | null) => void;
}

export function HotspotEditor({
  block,
  onChange,
  onEnsureBlockSelected,
  innerSelection,
  onInnerSelectionChange,
}: HotspotEditorProps) {
  const isEditing = isEditingHotspotOverlay(innerSelection);

  const patchWidget = useCallback(
    (fn: (w: HotspotWidget) => HotspotWidget) => {
      onChange(fn(normalizeHotspotWidget(block)));
    },
    [block, onChange],
  );

  const patchOverlay = useCallback(
    (patch: Partial<WidgetSlideContent>) => {
      patchWidget((w) => ({
        ...w,
        overlay: { ...w.overlay, ...patch },
      }));
    },
    [patchWidget],
  );

  const handleEditOverlay = useCallback(() => {
    onEnsureBlockSelected();
    onInnerSelectionChange?.({ kind: 'overlay-text', field: 'encabezado' });
  }, [onEnsureBlockSelected, onInnerSelectionChange]);

  const handleCloseOverlay = useCallback(() => {
    onInnerSelectionChange?.(null);
  }, [onInnerSelectionChange]);

  const handleSelectText = useCallback(
    (field: WidgetSlideTextField) => {
      onEnsureBlockSelected();
      onInnerSelectionChange?.({ kind: 'overlay-text', field });
    },
    [onEnsureBlockSelected, onInnerSelectionChange],
  );

  const handleSelectImage = useCallback(() => {
    onEnsureBlockSelected();
    onInnerSelectionChange?.({ kind: 'overlay-image' });
  }, [onEnsureBlockSelected, onInnerSelectionChange]);

  return (
    <div style={hotspotChromeStyle(block)} className="w-full h-full relative">
      <HotspotParts
        block={block}
        isOpen={false}
        isEditing={isEditing}
        innerSelection={innerSelection}
        onToggle={handleEditOverlay}
        onClose={handleCloseOverlay}
        onEditOverlay={handleEditOverlay}
        onPatchOverlay={patchOverlay}
        onSelectText={handleSelectText}
        onSelectImage={handleSelectImage}
      />
    </div>
  );
}
