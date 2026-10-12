import { Suspense, createElement, lazy, useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { Lock } from "lucide-react";
import { cn } from "@lumina/ui/lib/utils";
import type { EstadoObjeto } from "@lumina/types/interaction";
import { WidgetMotion, useWidgetReducedMotion } from "../../_efectos/motion/index.js";
import { VISUALLY_HIDDEN } from "../visually-hidden.js";
import { estaGanado, normalizeSelloWidget } from "./sello-defaults.js";
import { resolverIconoSello } from "./sello-icons.js";
import type { SelloEstado, SelloForma } from "./sello-types.js";
import styles from "./sello.module.css";

// El confeti (lluvia de piezas con la Web Animations API) se carga la primera vez que se gana una
// insignia con confeti: el viewer del alumno no lo paga si no hace falta.
const Confeti = lazy(() => import("../../_efectos/confeti.js").then((m) => ({ default: m.Confeti })));

const TONO: Record<string, string> = {
  oro: "var(--lw-color-warning, #ffc107)",
  azul: "var(--lw-color-primary, #0d6efd)",
  verde: "var(--lw-color-success, #198754)",
  rojo: "var(--lw-color-danger, #dc3545)",
};

/** Contorno (y un aro interior) de cada forma, en un viewBox de 100 × 100. */
function Forma({ forma }: { forma: SelloForma }): ReactElement {
  if (forma === "escudo") {
    const d = "M50 4 L90 18 V50 C90 74 72 90 50 97 C28 90 10 74 10 50 V18 Z";
    return (
      <>
        <path className={styles.cuerpo} d={d} />
        <path className={styles.aro} d={d} transform="translate(7 7) scale(0.86)" />
      </>
    );
  }
  if (forma === "estrella") {
    const pts = "50,4 61,38 97,38 68,59 79,93 50,72 21,93 32,59 3,38 39,38";
    return (
      <>
        <polygon className={styles.cuerpo} points={pts} strokeLinejoin="round" />
        <polygon className={styles.aro} points={pts} transform="translate(12 12) scale(0.76)" strokeLinejoin="round" />
      </>
    );
  }
  return (
    <>
      <circle className={styles.cuerpo} cx="50" cy="50" r="46" />
      <circle className={styles.aro} cx="50" cy="50" r="38" />
    </>
  );
}

export interface SelloViewProps {
  estado: SelloEstado;
  /** Estado de objeto que entrega el runtime (el motor de reglas); sin él, está bloqueada. */
  estadoObjeto?: EstadoObjeto;
  /** En el editor se previsualiza según `vistaPrevia` en vez de según el runtime. */
  editor?: boolean;
  isThumbnail?: boolean;
  onSeleccionar?: () => void;
}

/**
 * Insignia SVG con estados «bloqueado / ganado». Solo muestra un estado que le llega de fuera:
 * no calcula ni guarda puntajes (DT7). Al pasar de bloqueada a ganada con la vista abierta hace
 * un pulso (`WidgetMotion`), un brillo y, si está activo, confeti; con «reducir movimiento» solo
 * cambia de estado y lo anuncia.
 */
export function SelloView({ estado, estadoObjeto, editor = false, isThumbnail = false, onSeleccionar }: SelloViewProps): ReactElement {
  const { configuracion: cfg } = normalizeSelloWidget(estado);
  const reducido = useWidgetReducedMotion();
  const ganado = editor ? cfg.vistaPrevia === "ganado" : estaGanado(cfg.condicion, estadoObjeto);
  const antes = useRef(ganado);
  const [pulso, setPulso] = useState(0);
  const [confeti, setConfeti] = useState(0);
  const [anuncio, setAnuncio] = useState("");

  useEffect(() => {
    if (ganado && !antes.current && !isThumbnail) {
      if (cfg.animacion) setPulso((n) => n + 1);
      if (cfg.confeti && !reducido) setConfeti((n) => n + 1);
      setAnuncio(`¡Insignia ganada: ${cfg.titulo}!`);
    }
    if (!ganado) setAnuncio("");
    antes.current = ganado;
  }, [ganado, isThumbnail, cfg.animacion, cfg.confeti, cfg.titulo, reducido]);

  // `createElement` y no un binding con mayúscula + JSX: el icono se elige en cada render
  // (regla `react-hooks/static-components`); es un icono Lucide de módulo.
  const icono = createElement(resolverIconoSello(cfg.icono), { className: styles.iconoSvg });
  const color = cfg.colorAcento ?? TONO[cfg.tono];
  const estiloRaiz = { ["--sl-color"]: color } as CSSProperties;
  const etiqueta = `Insignia ${ganado ? "ganada" : "bloqueada"}: ${cfg.titulo}`;

  return (
    <div
      className={cn(styles.raiz, ganado ? styles.ganado : styles.bloqueado)}
      style={estiloRaiz}
      data-estado={ganado ? "ganado" : "bloqueado"}
      data-forma={cfg.forma}
      onPointerDown={editor ? onSeleccionar : undefined}
    >
      <WidgetMotion className={styles.insigniaCaja} exito={cfg.animacion ? pulso : undefined}>
        <div className={cn(styles.insignia, ganado && cfg.animacion && pulso > 0 && styles.brillo)} role="img" aria-label={etiqueta}>
          <svg viewBox="0 0 100 100" className={styles.svg} aria-hidden>
            <Forma forma={cfg.forma} />
          </svg>
          <span className={styles.icono} aria-hidden>
            {ganado ? icono : <Lock className={styles.iconoSvg} />}
          </span>
        </div>
      </WidgetMotion>

      <div className={styles.textos}>
        {cfg.titulo.trim() ? <p className={styles.titulo}>{cfg.titulo}</p> : null}
        {ganado ? (
          cfg.subtitulo.trim() ? <p className={styles.subtitulo}>{cfg.subtitulo}</p> : null
        ) : cfg.textoBloqueado.trim() ? (
          <p className={styles.subtitulo}>{cfg.textoBloqueado}</p>
        ) : null}
      </div>

      {confeti > 0 ? (
        <Suspense fallback={null}>
          <Confeti disparo={confeti} activo />
        </Suspense>
      ) : null}

      {/* Región viva presente desde el principio y vacía hasta que se gana: así se anuncia el cambio. */}
      <div role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
        {anuncio}
      </div>
    </div>
  );
}
