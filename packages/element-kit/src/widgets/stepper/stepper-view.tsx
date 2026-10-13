import { useEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@lumina/ui/lib/utils";
import type { EstadoObjeto, EventoTipo } from "@lumina/types/interaction";
import { useSlideNav } from "@lumina/editor-shared/slide-nav-context";
import { looksLikeRichHtml, sanitizeWidgetHtml } from "@lumina/editor-shared/rich-text/widget-html";
import { WidgetMotion } from "../../_efectos/motion/widget-motion.js";
import { VISUALLY_HIDDEN } from "../visually-hidden.js";
import { normalizeStepperWidget } from "./stepper-defaults.js";
import type { StepperEstado, StepperPaso, StepperTransicion } from "./stepper-types.js";
import styles from "./stepper.module.css";

const ENTRADA = { ninguna: undefined, fundido: "fade", subir: "slide-up" } as const satisfies Record<
  StepperTransicion,
  "fade" | "slide-up" | undefined
>;

function Cuerpo({ texto }: { texto: string }): ReactElement | null {
  const t = texto.trim();
  if (!t) return null;
  return looksLikeRichHtml(t) ? (
    <div className={styles.cuerpo} dangerouslySetInnerHTML={{ __html: sanitizeWidgetHtml(t) }} />
  ) : (
    <p className={styles.cuerpo}>{t}</p>
  );
}

function TarjetaPaso({ paso, numero, total, actual }: { paso: StepperPaso; numero: number; total: number; actual: boolean }) {
  return (
    <article className={cn(styles.paso, actual && styles.pasoActual)} aria-current={actual ? "step" : undefined}>
      <p className={styles.pasoEtiqueta}>
        Paso {numero} de {total}
      </p>
      {paso.titulo.trim() ? <h3 className={styles.titulo}>{paso.titulo}</h3> : null}
      <Cuerpo texto={paso.cuerpo} />
    </article>
  );
}

export interface StepperViewProps {
  estado: StepperEstado;
  /** En el editor se recorren los pasos para verlos, pero no se emite nada ni se avanza el slide. */
  editor?: boolean;
  isThumbnail?: boolean;
  onSeleccionar?: () => void;
  /** Etapa K: avisa al motor de interacción. Sin él, el widget se comporta como siempre. */
  emitir?: (evento: EventoTipo) => void;
  /** Etapa K: estado del objeto; si ya es `visitado` no se vuelve a emitir. */
  estadoObjeto?: EstadoObjeto;
}

/**
 * Contenido que se revela paso a paso. El avance es siempre lineal (Siguiente / Anterior): con
 * `bloquearSaltos` el indicador solo deja ir a pasos ya vistos. Al llegar al último paso emite
 * `visitado` una sola vez (sin variables ni notas, DT7).
 */
export function StepperView({
  estado,
  editor = false,
  isThumbnail = false,
  onSeleccionar,
  emitir,
  estadoObjeto,
}: StepperViewProps): ReactElement {
  const { configuracion: cfg } = normalizeStepperWidget(estado);
  const { pasos } = cfg;
  const total = pasos.length;
  const { navigate } = useSlideNav();
  const [actual, setActual] = useState(0);
  // El paso más lejano al que se llegó: define hasta dónde se puede saltar con el indicador.
  const [maximo, setMaximo] = useState(0);
  const visitadoEmitido = useRef(false);
  const ultimoRef = useRef<HTMLDivElement | null>(null);

  const indice = Math.min(actual, total - 1);
  const esUltimo = indice === total - 1;
  const interactivo = !isThumbnail;
  const alcance = Math.min(maximo, total - 1);

  useEffect(() => {
    if (!esUltimo || editor || isThumbnail || visitadoEmitido.current) return;
    visitadoEmitido.current = true;
    if (estadoObjeto !== "visitado") emitir?.("visitado");
  }, [esUltimo, editor, isThumbnail, emitir, estadoObjeto]);

  useEffect(() => {
    // En el modo acumulativo el paso nuevo se muestra al final de la lista.
    if (cfg.modo === "acumulativo" && indice > 0) ultimoRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [indice, cfg.modo]);

  const ir = (destino: number) => {
    const d = Math.max(0, Math.min(total - 1, destino));
    setActual(d);
    setMaximo((m) => Math.max(m, d));
  };
  // Con `bloquearSaltos`: a los pasos ya vistos o al inmediato siguiente (como «Siguiente»).
  const puedeIrA = (i: number) => (cfg.bloquearSaltos ? i <= alcance + 1 : true);

  const entrada = ENTRADA[cfg.transicion];
  const envolver = (k: string, hijo: ReactNode) =>
    entrada && interactivo && !editor ? (
      <WidgetMotion key={k} entrada={entrada}>
        {hijo}
      </WidgetMotion>
    ) : (
      <div key={k}>{hijo}</div>
    );

  const paso = pasos[indice];
  const visibles = cfg.modo === "acumulativo" ? pasos.slice(0, indice + 1) : [paso];

  const indicador = (
    <ol className={cn(styles.indicador, styles[`ind_${cfg.indicador}`])} aria-label="Progreso">
      {pasos.map((p, i) => {
        const hecho = i < indice;
        const esActual = i === indice;
        const permitido = interactivo && puedeIrA(i);
        const etiqueta = `Paso ${i + 1}: ${p.titulo.trim() || `Paso ${i + 1}`}`;
        return (
          <li key={p.id} className={styles.indicadorItem}>
            <button
              type="button"
              className={cn(styles.marca, hecho && styles.marcaHecha, esActual && styles.marcaActual)}
              aria-label={etiqueta}
              aria-current={esActual ? "step" : undefined}
              disabled={!permitido}
              onClick={() => ir(i)}
            >
              {cfg.indicador === "numeros" ? (hecho ? <Check className={styles.marcaIcono} aria-hidden /> : i + 1) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );

  const avanceSlide = cfg.avance === "slide" && esUltimo && interactivo && !editor && navigate !== null;

  return (
    <section
      className={styles.raiz}
      aria-label="Paso a paso"
      style={{ ["--st-progreso"]: `${total > 1 ? (indice / (total - 1)) * 100 : 100}%` } as CSSProperties}
      onPointerDown={editor ? onSeleccionar : undefined}
    >
      {cfg.indicador === "barra" ? (
        <div className={styles.barra} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={indice + 1} aria-label="Progreso">
          <div className={styles.barraRelleno} />
        </div>
      ) : (
        indicador
      )}

      <div className={styles.pasos}>
        {cfg.modo === "acumulativo"
          ? visibles.map((p, i) => (
              <div key={p.id} ref={i === visibles.length - 1 ? ultimoRef : undefined}>
                {envolver(p.id, <TarjetaPaso paso={p} numero={i + 1} total={total} actual={i === indice} />)}
              </div>
            ))
          : envolver(paso.id, <TarjetaPaso paso={paso} numero={indice + 1} total={total} actual />)}
      </div>

      {interactivo ? (
        <div className={styles.controles}>
          {cfg.mostrarAnterior ? (
            <button type="button" className={styles.boton} disabled={indice === 0} onClick={() => ir(indice - 1)}>
              <ChevronLeft className={styles.botonIcono} aria-hidden /> Anterior
            </button>
          ) : (
            <span />
          )}
          <span className={styles.contador}>
            {indice + 1} / {total}
          </span>
          {esUltimo ? (
            avanceSlide ? (
              <button type="button" className={cn(styles.boton, styles.botonPrimario)} onClick={() => navigate?.({ kind: "siguiente" })}>
                Continuar <ChevronRight className={styles.botonIcono} aria-hidden />
              </button>
            ) : (
              <span className={styles.completo}>{editor ? "" : "¡Completado!"}</span>
            )
          ) : (
            <button type="button" className={cn(styles.boton, styles.botonPrimario)} onClick={() => ir(indice + 1)}>
              Siguiente <ChevronRight className={styles.botonIcono} aria-hidden />
            </button>
          )}
        </div>
      ) : null}

      {/* Región viva: anuncia el paso nuevo y el final, no cada clic. */}
      <div role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
        {interactivo && maximo > 0
          ? `Paso ${indice + 1} de ${total}: ${paso.titulo}${esUltimo ? ". Completado." : ""}`
          : ""}
      </div>
    </section>
  );
}
