import type { BotonWidget } from '@/types/widget.types';
import { BotonParts } from './boton-parts';

interface BotonEditorProps {
  block: BotonWidget;
  onEnsureBlockSelected: () => void;
}

export function BotonEditor({ block, onEnsureBlockSelected }: BotonEditorProps) {
  return (
    <div className="relative h-full w-full">
      <BotonParts block={block} isEditing onSelect={onEnsureBlockSelected} />
    </div>
  );
}
