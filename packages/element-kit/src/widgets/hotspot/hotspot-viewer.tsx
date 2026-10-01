import { useRef, useState } from 'react';
import type { EstadoObjeto, EventoTipo } from '@lumina/types/interaction';
import type { HotspotWidget } from '@lumina/types/widget';
import { HotspotParts } from './hotspot-parts.js';
import { hotspotChromeStyle, mergedHotspotConfig } from './hotspot-config.js';

interface HotspotViewerProps {
  block: HotspotWidget;
  isThumbnail?: boolean;
  /** Etapa K / K3: avisa al motor de interacción. Sin él, el hotspot se comporta como siempre. */
  emitir?: (evento: EventoTipo) => void;
  /** Estado de objeto según el motor: si ya es `visitado` no se vuelve a emitir. */
  estadoObjeto?: EstadoObjeto;
}

export function HotspotViewer({
  block,
  isThumbnail = false,
  emitir,
  estadoObjeto,
}: HotspotViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // `visitado` se emite UNA vez: la primera apertura. Las reglas suelen sumar
  // (p. ej. «hotspots vistos»), así que repetirlo falsearía el conteo.
  const visitadoEmitido = useRef(false);
  const dispararPorClic = mergedHotspotConfig(block).triggerEvento === 'click';

  const handleToggle = () => {
    if (!isThumbnail) {
      // `clic` solo cuando el disparador ES un clic; con `hover` no hay clic.
      if (dispararPorClic) emitir?.('clic');
      if (!isOpen && !visitadoEmitido.current && estadoObjeto !== 'visitado') {
        visitadoEmitido.current = true;
        emitir?.('visitado');
      }
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
