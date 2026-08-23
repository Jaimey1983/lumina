import type { ContadorWidget } from '@/types/widget.types';
import { mergedContadorConfig } from './contador-config';
import { ContadorParts } from './contador-parts';

interface ContadorEditorProps {
  block: ContadorWidget;
  onEnsureBlockSelected: () => void;
}

export function ContadorEditor({ block, onEnsureBlockSelected }: ContadorEditorProps) {
  const cfg = mergedContadorConfig(block);
  const displaySeconds = cfg.modo === 'cronometro' ? 0 : cfg.segundos;

  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center">
      <ContadorParts
        block={block}
        displaySeconds={displaySeconds}
        displayNumber={cfg.valorInicial}
        isEditing
        showControls={cfg.mostrarControles}
        onSelect={onEnsureBlockSelected}
      />
    </div>
  );
}
