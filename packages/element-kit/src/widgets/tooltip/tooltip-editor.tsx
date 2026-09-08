import type { TooltipWidget } from '@lumina/types/widget';
import { TooltipParts } from './tooltip-parts.js';
import { tooltipChromeStyle } from './tooltip-config.js';

interface TooltipEditorProps {
  block: TooltipWidget;
  onEnsureBlockSelected: () => void;
  isSelected?: boolean;
}

export function TooltipEditor({
  block,
  onEnsureBlockSelected,
  isSelected = false,
}: TooltipEditorProps) {
  return (
    <div style={tooltipChromeStyle(block)} className="relative h-full w-full overflow-visible">
      <TooltipParts
        block={block}
        isOpen={false}
        isEditing={isSelected}
        onSelectTrigger={onEnsureBlockSelected}
      />
    </div>
  );
}
