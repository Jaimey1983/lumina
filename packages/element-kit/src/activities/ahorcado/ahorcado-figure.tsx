import styles from './ahorcado.module.css'

export const AHORCADO_PARTES_MUNECO = 6

/** Cuántas partes del muñeco mostrar (0–6) según fallos e intentos máximos. */
export function partesMuñecoAhorcado(fallos: number, maxIntentos: number): number {
  if (fallos <= 0 || maxIntentos <= 0) return 0
  return Math.min(
    AHORCADO_PARTES_MUNECO,
    Math.ceil((fallos / maxIntentos) * AHORCADO_PARTES_MUNECO),
  )
}

export type AhorcadoFigureEstado = 'jugando' | 'ganado' | 'perdido'

interface AhorcadoFigureProps {
  partes: number
  estado?: AhorcadoFigureEstado
  className?: string
  'aria-label'?: string
}

const PART_LABELS = ['Cabeza', 'Cuerpo', 'Brazo izq.', 'Brazo der.', 'Pierna izq.', 'Pierna der.']

export function AhorcadoFigure({
  partes,
  estado = 'jugando',
  className = '',
  'aria-label': ariaLabel = 'Dibujo del ahorcado',
}: AhorcadoFigureProps) {
  const clamped = Math.max(0, Math.min(AHORCADO_PARTES_MUNECO, partes))
  const figuraColor =
    estado === 'perdido' ? '#b91c1c' : estado === 'ganado' ? '#15803d' : '#1e3a5f'
  const cabezaFill =
    estado === 'perdido' ? '#fecaca' : estado === 'ganado' ? '#bbf7d0' : '#fde68a'

  return (
    <svg
      viewBox="0 0 180 210"
      className={`${styles.munecoSvg} ${className}`.trim()}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id="ahorcado-madera" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a16207" />
          <stop offset="50%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="ahorcado-suelo" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d9f99d" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#84cc16" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="ahorcado-cuerda" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#78716c" />
          <stop offset="100%" stopColor="#57534e" />
        </linearGradient>
        <filter id="ahorcado-sombra" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Fondo interior del panel */}
      <rect x="8" y="8" width="164" height="168" rx="10" className={styles.munecoFondo} />

      {/* Suelo */}
      <ellipse cx="90" cy="168" rx="62" ry="9" fill="url(#ahorcado-suelo)" />
      <ellipse cx="90" cy="170" rx="48" ry="4" fill="#65a30d" opacity="0.2" />

      {/* Horca */}
      <g
        className={styles.munecoHorca}
        stroke="url(#ahorcado-madera)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#ahorcado-sombra)"
      >
        <line x1="18" y1="172" x2="148" y2="172" />
        <line x1="48" y1="172" x2="48" y2="28" />
        <line x1="48" y1="28" x2="118" y2="28" />
        <path d="M 118 28 L 118 24 L 124 28 L 118 32 Z" fill="#92400e" stroke="none" />
      </g>

      {/* Cuerda + nudo */}
      <g stroke="url(#ahorcado-cuerda)" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <line x1="118" y1="32" x2="118" y2="52" />
        <circle cx="118" cy="54" r="2.5" fill="#57534e" stroke="none" />
      </g>

      {/* Muñeco */}
      <g
        className={styles.munecoCuerpo}
        stroke={figuraColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#ahorcado-sombra)"
      >
        {clamped >= 1 ? (
          <g className={styles.munecoParte}>
            <circle cx="118" cy="70" r="16" fill={cabezaFill} stroke={figuraColor} strokeWidth="3.5" />
            {estado === 'perdido' ? (
              <>
                <line x1="110" y1="64" x2="114" y2="68" strokeWidth="2.5" />
                <line x1="114" y1="64" x2="110" y2="68" strokeWidth="2.5" />
                <line x1="122" y1="64" x2="126" y2="68" strokeWidth="2.5" />
                <line x1="126" y1="64" x2="122" y2="68" strokeWidth="2.5" />
                <path d="M 110 78 Q 118 74 126 78" strokeWidth="2.5" fill="none" />
              </>
            ) : estado === 'ganado' ? (
              <>
                <circle cx="111" cy="66" r="1.8" fill={figuraColor} stroke="none" />
                <circle cx="125" cy="66" r="1.8" fill={figuraColor} stroke="none" />
                <path d="M 109 76 Q 118 82 127 76" strokeWidth="2.5" fill="none" />
              </>
            ) : (
              <>
                <circle cx="111" cy="66" r="1.5" fill={figuraColor} stroke="none" />
                <circle cx="125" cy="66" r="1.5" fill={figuraColor} stroke="none" />
              </>
            )}
          </g>
        ) : null}

        {clamped >= 2 ? (
          <line x1="118" y1="86" x2="118" y2="128" className={styles.munecoParte} />
        ) : null}
        {clamped >= 3 ? (
          <line x1="118" y1="98" x2="92" y2="116" className={styles.munecoParte} />
        ) : null}
        {clamped >= 4 ? (
          <line x1="118" y1="98" x2="144" y2="116" className={styles.munecoParte} />
        ) : null}
        {clamped >= 5 ? (
          <line x1="118" y1="128" x2="98" y2="158" className={styles.munecoParte} />
        ) : null}
        {clamped >= 6 ? (
          <line x1="118" y1="128" x2="138" y2="158" className={styles.munecoParte} />
        ) : null}
      </g>

      {/* Indicadores de partes (6 puntos) */}
      <g className={styles.munecoIndicadores}>
        {PART_LABELS.map((_, index) => {
          const activo = index < clamped
          return (
            <circle
              key={index}
              cx={54 + index * 14}
              cy="192"
              r="4"
              className={activo ? styles.munecoIndicadorActivo : styles.munecoIndicador}
            />
          )
        })}
      </g>
    </svg>
  )
}
