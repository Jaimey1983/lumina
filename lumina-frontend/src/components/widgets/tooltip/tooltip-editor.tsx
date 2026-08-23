import type { TooltipWidget } from '@/types/widget.types';
import { TooltipParts } from './tooltip-parts';
import { tooltipChromeStyle } from './tooltip-config';

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
