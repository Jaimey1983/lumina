import { useRef, useState } from 'react';
import type { EstadoObjeto, EventoTipo } from '@lumina/types/interaction';
import type { HotspotWidget } from '@lumina/types/widget';
import { HotspotParts } from './hotspot-parts.js';
import { useAbrirOverlayPorId } from '../abrir-overlay.js';
import { hotspotChromeStyle, mergedHotspotConfig } from './hotspot-config.js';

interface HotspotViewerProps {
  block: HotspotWidget;
  isThumbnail?: boolean;
  /** Etapa K / K3: avisa al motor de interacción. Sin él, el hotspot se comporta como siempre. */
  emitir?: (evento: EventoTipo) => void;
  /** Estado de objeto según el motor: si ya es `visitado` no se vuelve a emitir. */
  estadoObjeto?: EstadoObjeto;
  /** Id del bloque: con él, el hotspot responde a «abrir overlay por id» (T15). */
  bloqueId?: string;
}

export function HotspotViewer({
  block,
  isThumbnail = false,
  emitir,
  estadoObjeto,
  bloqueId,
}: HotspotViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // `visitado` se emite UNA vez: la primera apertura. Las reglas suelen sumar
  // (p. ej. «hotspots vistos»), así que repetirlo falsearía el conteo.
  const visitadoEmitido = useRef(false);
  const dispararPorClic = mergedHotspotConfig(block).triggerEvento === 'click';

  const marcarVisita = () => {
    if (!visitadoEmitido.current && estadoObjeto !== 'visitado') {
      visitadoEmitido.current = true;
      emitir?.('visitado');
    }
  };

  const handleToggle = () => {
    if (!isThumbnail) {
      // `clic` solo cuando el disparador ES un clic; con `hover` no hay clic.
      if (dispararPorClic) emitir?.('clic');
      if (!isOpen) marcarVisita();
      setIsOpen((prev) => !prev);
    }
  };

  const handleClose = () => {
    if (!isThumbnail) {
      setIsOpen(false);
    }
  };

  // T15: otro widget (p. ej. un Botón) puede abrirlo o cerrarlo por id. Abrir cuenta como visita.
  useAbrirOverlayPorId(
    bloqueId,
    (accion) => {
      if (accion === 'cerrar' || (accion === 'alternar' && isOpen)) return handleClose();
      if (isOpen) return;
      // Abrirlo desde fuera no es un clic sobre el hotspot: no se emite `clic`.
      marcarVisita();
      setIsOpen(true);
    },
    !isThumbnail,
  );

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
