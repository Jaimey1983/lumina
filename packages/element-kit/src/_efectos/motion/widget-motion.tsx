'use client';

import { LazyMotion, domAnimation, m, useAnimate } from 'motion/react';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { Animacion } from '@lumina/types/animation';

import {
  ENTRADA_TRANSICION,
  ENTRADA_VARIANTES,
  EXITO_KEYFRAMES,
  EXITO_TRANSICION,
  HOVER,
  INTERACCION_TRANSICION,
  PRESS,
  entradaPorDefectoApagada,
  type EntradaVariante,
} from './motion-presets.js';
import { useWidgetReducedMotion } from './reduced-motion.js';

export interface WidgetMotionProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  role?: string;
  /** Entrada al montarse. Sin valor, no hay entrada. */
  entrada?: EntradaVariante;
  /** Retraso de la entrada, en segundos. */
  delay?: number;
  /**
   * `Block.animaciones`: si trae una animación de entrada del docente, la
   * `entrada` por defecto del widget se apaga (la del docente manda).
   */
  animaciones?: readonly Animacion[];
  /** Escala al pulsar (0.97). */
  press?: boolean;
  /** Se eleva un poco al pasar el puntero. */
  hover?: boolean;
  /** Cada vez que este número sube, el elemento hace un pulso de éxito. */
  exito?: number;
  /** Si está, este elemento reparte la entrada de sus `WidgetMotionItem` con ese desfase (s). */
  stagger?: number;
}

const CONTENEDOR_STAGGER = (stagger: number, delay: number) => ({
  oculto: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/**
 * Envoltorio de movimiento de un widget: entrada, press, hover y éxito sobre
 * `motion` (con `LazyMotion`, solo las funciones de DOM). Con «reducir
 * movimiento» renderiza un `<div>` plano: sin animación, contenido visible.
 */
export function WidgetMotion({
  children,
  className,
  style,
  id,
  role,
  entrada,
  delay = 0,
  animaciones,
  press = false,
  hover = false,
  exito,
  stagger,
}: WidgetMotionProps) {
  const reducido = useWidgetReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const exitoPrevio = useRef(exito);

  useEffect(() => {
    if (reducido || exito === undefined || exito === exitoPrevio.current) {
      exitoPrevio.current = exito;
      return;
    }
    exitoPrevio.current = exito;
    void animate(scope.current, EXITO_KEYFRAMES, EXITO_TRANSICION);
  }, [exito, reducido, animate, scope]);

  if (reducido) {
    return (
      <div id={id} role={role} className={className} style={style}>
        {children}
      </div>
    );
  }

  const variante = entrada && !entradaPorDefectoApagada(animaciones) ? entrada : undefined;
  const variants = stagger !== undefined ? CONTENEDOR_STAGGER(stagger, delay) : variante ? ENTRADA_VARIANTES[variante] : undefined;

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        ref={scope}
        id={id}
        role={role}
        className={className}
        style={style}
        variants={variants}
        initial={variants ? 'oculto' : undefined}
        animate={variants ? 'visible' : undefined}
        transition={variante ? { ...ENTRADA_TRANSICION, delay } : undefined}
        whileTap={press ? { ...PRESS, transition: INTERACCION_TRANSICION } : undefined}
        whileHover={hover ? { ...HOVER, transition: INTERACCION_TRANSICION } : undefined}
        data-widget-motion
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

/** Hijo de un `WidgetMotion` con `stagger`: entra con el desfase del grupo. */
export function WidgetMotionItem({
  children,
  className,
  style,
  entrada = 'slide-up',
}: Pick<WidgetMotionProps, 'children' | 'className' | 'style' | 'entrada'>) {
  const reducido = useWidgetReducedMotion();
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
        className={className}
        style={style}
        variants={ENTRADA_VARIANTES[entrada ?? 'slide-up']}
        transition={ENTRADA_TRANSICION}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
