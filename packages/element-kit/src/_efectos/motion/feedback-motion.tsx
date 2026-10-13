'use client';

import { LazyMotion, domAnimation, m, useAnimate } from 'motion/react';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

import { FEEDBACK_MOVIMIENTO, GIRO_ENTRADA, type SenalFeedback } from './motion-presets.js';
import { useWidgetReducedMotion } from './reduced-motion.js';

export interface FeedbackMotionProps {
  /** Qué movimiento hacer; `null` = ninguno. */
  senal: SenalFeedback | null;
  /** Contador de disparos: el movimiento corre cada vez que SUBE (no al bajar a 0). */
  n: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Hace el movimiento de una señal de feedback (acierto, error, pista, logro) sobre su
 * contenido. Con «reducir movimiento» es un `<div>` plano: no anima, el contenido se ve igual.
 * Es el único lugar donde una actividad obtiene este movimiento (DU5): no importa `motion`.
 */
export function FeedbackMotion({ senal, n, className, style, children }: FeedbackMotionProps) {
  const reducido = useWidgetReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const previo = useRef(n);

  useEffect(() => {
    const subio = n > previo.current;
    previo.current = n;
    if (reducido || !subio || senal === null || !scope.current) return;
    const { keyframes, transicion } = FEEDBACK_MOVIMIENTO[senal];
    void animate(scope.current, keyframes, transicion);
  }, [n, senal, reducido, animate, scope]);

  if (reducido) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div ref={scope} className={className} style={style} data-feedback-motion>
        {children}
      </m.div>
    </LazyMotion>
  );
}

export interface GiroEntradaProps {
  /** Identifica la cara actual: al cambiar, la nueva cara entra girando. */
  cara: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Cara de una carta que se voltea. El contenido cambia AL INSTANTE (el DOM nunca muestra las
 * dos caras, así la respuesta de una carta tapada no queda en el documento) y la cara nueva
 * entra con un giro corto. La primera cara no anima. Con «reducir movimiento», sin giro.
 */
export function GiroEntrada({ cara, className, style, children }: GiroEntradaProps) {
  const reducido = useWidgetReducedMotion();
  const primera = useRef(true);
  useEffect(() => {
    primera.current = false;
  }, []);

  if (reducido) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        key={cara}
        className={className}
        style={style}
        initial={primera.current ? false : { rotateY: GIRO_ENTRADA.desde, opacity: 0.6 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={GIRO_ENTRADA.transicion}
        data-giro-entrada
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
