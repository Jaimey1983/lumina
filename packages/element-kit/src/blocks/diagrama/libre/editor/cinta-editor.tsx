"use client";

// ─── Cinta del editor de dibujo (Y2) ──────────────────────────────────────────
// Arma las pestañas de la cinta (`@lumina/ui/ribbon`) desde el registro único de comandos: cada botón es
// un comando del registro, así que su etiqueta, atajo y estado (habilitado, activo) salen de un solo sitio.
// Pestañas: Inicio · Insertar · Organizar · Vista, y las contextuales «Formato de forma» (formas o textos elegidos, Y18)
// y «Formato de conector» (líneas elegidas). Una pestaña sin contenido no se muestra (DY1).

import { useId, useState, type KeyboardEvent, type PointerEvent, type ReactElement, type ReactNode } from "react";
import { formasPorGrupo, trazadoForma, type Escena, type Linea, type TipoForma } from "@lumina/drawing";
import { Popover, PopoverContent, PopoverTrigger } from "@lumina/ui/popover";
import { QuickAccessBar, Ribbon, RibbonButton, RibbonGroup, RibbonSplitButton } from "@lumina/ui/ribbon";
import { CornerDownRight, Minus, Shapes, Spline } from "lucide-react";
import { CAMBIAR_FORMA, COMANDOS, ESTILOS_COMANDOS, TEMAS_COMANDOS, comando, ELEGIR, estadoComando, ORGANIZAR, textoDeAtajo, type ContextoComando } from "./comandos-registro.js";
import type { Orden } from "./comandos.js";
import type { DiagramaPaletaId } from "@lumina/types/slide";
import { PALETAS_DIAGRAMA } from "../../diagrama-temas.js";
import { ESTILOS_FORMA } from "./estilos-forma.js";
import { Conmutador } from "./propiedades-campos.js";
import { GaleriaIconos } from "./galeria-iconos.js";
import { AlineacionHorizontal, BotonFormatoTexto, ColorContorno, ColorRelleno, datosDeFormato, GrosorContorno, TamanoLetra, type AccionesDeFormato } from "./mini-barra-capa.js";
import { cambiarEsquinas, cambiarExtremo, cambiarTrazado, EXTREMOS_OPCIONES, hayExtremoLibre, valorComun } from "./conectores.js";

export const PESTANA_INICIO = "inicio";
export const PESTANA_CONECTOR = "conector";
export const PESTANA_FORMATO = "formato-forma";
export const PESTANA_DISENO = "diseno";

/** Orden de secciones en el panel de atajos (Y5); una sola fuente con la cinta. */
export const ORDEN_PESTANAS_ATAJOS = ["Historial", "Inicio", "Insertar", "Organizar", "Diseño", "Vista", "Edición general", "Navegación y ratón"] as const;

const BASE_PESTANA_POR_COMANDO: Record<string, string> = {
  deshacer: "Historial",
  rehacer: "Historial",
  seleccionar: "Inicio",
  linea: "Inicio",
  flecha: "Inicio",
  texto: "Inicio",
  duplicar: "Inicio",
  eliminar: "Inicio",
  agrupar: "Organizar",
  desagrupar: "Organizar",
  "orden-frente": "Organizar",
  "orden-subir": "Organizar",
  "orden-bajar": "Organizar",
  "orden-fondo": "Organizar",
  "alinear-izquierda": "Organizar",
  "alinear-centro": "Organizar",
  "alinear-derecha": "Organizar",
  "alinear-arriba": "Organizar",
  "alinear-medio": "Organizar",
  "alinear-abajo": "Organizar",
  "distribuir-horizontal": "Organizar",
  "distribuir-vertical": "Organizar",
  alejar: "Vista",
  acercar: "Vista",
  "ajustar-vista": "Vista",
  "girar-pagina": "Vista",
  cuadricula: "Vista",
  imantar: "Vista",
  reglas: "Vista",
  "quitar-guias": "Vista",
  "buscar-comando": "Edición general",
  atajos: "Vista",
  "seleccionar-todo": "Inicio",
  "conectar-cadena": "Insertar",
  esquema: "Insertar",
  copiar: "Inicio",
  ...Object.fromEntries(ORGANIZAR.map((c) => [c.id, "Organizar"])),
  "copiar-formato": "Inicio",
  "aplicar-formato": "Inicio",
  cortar: "Inicio",
  pegar: "Inicio",
  "pegar-en-sitio": "Inicio",
  "crear-hijo": "Inicio",
  "crear-hermano": "Inicio",
  "eliminar-rama": "Inicio",
  "plegar-rama": "Inicio",
  "desplegar-todo": "Vista",
  ...Object.fromEntries(ELEGIR.map((c) => [c.id, "Inicio"])),
  ...Object.fromEntries(CAMBIAR_FORMA.map((c) => [c.id, "Formato de forma"])),
  ...Object.fromEntries(ESTILOS_COMANDOS.map((c) => [c.id, "Formato de forma"])),
  ...Object.fromEntries(TEMAS_COMANDOS.map((c) => [c.id, "Diseño"])),
  "pegar-al-mas-cercano": "Formato de conector",
  negrita: "Formato de forma",
  cursiva: "Formato de forma",
  subrayado: "Formato de forma",
};

/** Pestaña de la cinta donde vive cada comando (para el panel de atajos). */
export const PESTANA_POR_COMANDO: Readonly<Record<string, string>> = {
  ...BASE_PESTANA_POR_COMANDO,
  ...Object.fromEntries(COMANDOS.filter((c) => c.id.startsWith("forma-")).map((c) => [c.id, "Insertar"])),
};

const ANCHO_MINIATURA = 30;
const ALTO_MINIATURA = 22;

function Miniatura({ forma }: { forma: TipoForma }): ReactElement {
  return (
    <svg width={ANCHO_MINIATURA} height={ALTO_MINIATURA} viewBox={`-2 -2 ${ANCHO_MINIATURA + 4} ${ALTO_MINIATURA + 4}`} aria-hidden="true" className="overflow-visible">
      <path d={trazadoForma(forma, ANCHO_MINIATURA, ALTO_MINIATURA)} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
}

/**
 * «Cambiar forma» (Y19): un botón que abre una galería con las 22 formas, agrupadas como la de Insertar y con su miniatura; la
 * actual (la de todo lo elegido) va marcada. Cada una es un comando del registro («Cambiar a Rombo»). Las flechas recorren la
 * galería; `Enter` elige; `Escape` cierra.
 */
function SelectorForma({ contexto, onOrden }: { contexto: ContextoComando; onOrden: (orden: Orden) => void }): ReactElement {
  const [abierto, setAbierto] = useState(false);
  const grupos = formasPorGrupo();
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>): void => {
    e.stopPropagation(); // ni las flechas ni Escape llegan al editor
    const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? COLUMNAS_FORMAS : e.key === "ArrowUp" ? -COLUMNAS_FORMAS : 0;
    if (paso === 0) return;
    const botones = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-forma]")];
    const i = botones.indexOf(e.target as HTMLButtonElement);
    if (i === -1) return;
    e.preventDefault();
    botones[Math.min(botones.length - 1, Math.max(0, i + paso))]?.focus();
  };
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <RibbonButton label="Cambiar forma" size="large" icon={<Shapes />} data-cambiar-forma="" />
      </PopoverTrigger>
      <PopoverContent align="start" aria-label="Cambiar forma" className="max-h-80 w-72 overflow-y-auto p-2" onKeyDown={alTeclear}>
        {grupos.map(({ grupo, nombre, formas }) => (
          <div key={grupo} role="group" aria-label={nombre} className="mb-2 last:mb-0">
            <p className="mb-1 text-[11px] text-muted-foreground">{nombre}</p>
            <div className="grid grid-cols-4 gap-1">
              {formas.map((f) => {
                const def = CAMBIAR_FORMA.find((c) => c.id === `cambiar-forma-${f.id}`);
                if (!def) return null;
                const estado = estadoComando(def, contexto);
                return (
                  <button
                    key={f.id}
                    type="button"
                    data-forma={f.id}
                    data-comando={def.id}
                    title={estado.habilitado || estado.activo ? def.etiqueta : `${def.etiqueta} — ${estado.motivo}`}
                    aria-label={def.etiqueta}
                    aria-pressed={estado.activo === true}
                    aria-disabled={!estado.habilitado || undefined}
                    className="flex h-10 items-center justify-center rounded-md border outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-40 aria-pressed:bg-accent aria-pressed:ring-2 aria-pressed:ring-primary"
                    onClick={() => {
                      if (!estado.habilitado) return;
                      onOrden(def.orden);
                      setAbierto(false);
                    }}
                  >
                    <Miniatura forma={f.id} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

const COLUMNAS_FORMAS = 4;

/** Flechas dentro de una galería de botones (`data-galeria-item`): izquierda y derecha de uno en uno, arriba y abajo de a una fila. */
function navegarGaleria(e: KeyboardEvent<HTMLElement>, columnas: number): void {
  const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? columnas : e.key === "ArrowUp" ? -columnas : 0;
  if (paso === 0) return;
  const botones = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-galeria-item]")];
  const i = botones.indexOf(e.target as HTMLButtonElement);
  if (i === -1) return;
  e.preventDefault();
  e.stopPropagation(); // las flechas de la galería no mueven lo elegido en el lienzo
  botones[Math.min(botones.length - 1, Math.max(0, i + paso))]?.focus();
}

/** Lista con viñetas o numerada (Y24a): el botón es el del comando del registro (etiqueta, icono y orden salen de allí). */
function BotonLista({ id, sufijo, contexto, onOrden }: { id: "vinetas-puntos" | "vinetas-numeros"; sufijo: string; contexto: ContextoComando; onOrden: (o: Orden) => void }): ReactElement {
  const def = comando(id);
  const Icono = def.icono;
  const estado = estadoComando(def, contexto);
  return (
    <Conmutador
      sufijo={sufijo}
      etiqueta={def.etiqueta}
      valor={estado.habilitado ? { mixto: false, valor: estado.activo === true } : null}
      icono={Icono ? <Icono className="size-3.5" /> : def.etiqueta}
      deshabilitado={!estado.habilitado}
      onCambiar={() => onOrden(def.orden)}
    />
  );
}

/** Miniatura de un estilo: un rectángulo con su relleno, contorno y la «A» del color de su texto (los tokens siguen al modo del editor). */
function MiniaturaEstilo({ estilo }: { estilo: (typeof ESTILOS_FORMA)[number] }): ReactElement {
  const id = useId();
  const { relleno, contorno, sombra } = estilo.parche.estilo;
  const fill = relleno.tipo === "solido" ? relleno.color : relleno.tipo === "degradado" ? `url(#${id})` : "none";
  return (
    <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden="true">
      {relleno.tipo === "degradado" ? (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={relleno.desde} />
            <stop offset="1" stopColor={relleno.hasta} />
          </linearGradient>
        </defs>
      ) : null}
      {sombra ? <rect x="4" y="5" width="22" height="14" rx="3" fill="currentColor" opacity="0.25" /> : null}
      <rect x="3" y="3" width="22" height="14" rx="3" fill={fill} stroke={contorno?.grosor ? contorno.color : "none"} strokeWidth={Math.min(2, contorno?.grosor ?? 0)} />
      <text x="14" y="13.5" textAnchor="middle" fontSize="9" fontWeight="600" fill={estilo.parche.estiloTexto.color}>
        A
      </text>
    </svg>
  );
}

/** Galería «Estilos» (Y21): los 12 estilos, el activo marcado; cada uno es un comando del registro. */
function GaleriaEstilos({ contexto, onOrden }: { contexto: ContextoComando; onOrden: (orden: Orden) => void }): ReactElement {
  return (
    <div role="group" aria-label="Estilos de forma" data-galeria-estilos="" className="grid grid-cols-6 gap-1" onKeyDown={(e) => navegarGaleria(e, 6)}>
      {ESTILOS_FORMA.map((estilo, i) => {
        const def = ESTILOS_COMANDOS[i];
        if (!def) return null;
        const estado = estadoComando(def, contexto);
        return (
          <button
            key={estilo.id}
            type="button"
            data-galeria-item=""
            data-comando={def.id}
            title={estado.habilitado ? def.etiqueta : `${def.etiqueta} — ${estado.motivo}`}
            aria-label={def.etiqueta}
            aria-pressed={estado.activo === true}
            aria-disabled={!estado.habilitado || undefined}
            className="flex h-8 w-9 items-center justify-center rounded-md border outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-40 aria-pressed:bg-accent aria-pressed:ring-2 aria-pressed:ring-primary"
            onClick={() => {
              if (estado.habilitado) onOrden(def.orden);
            }}
          >
            <MiniaturaEstilo estilo={estilo} />
          </button>
        );
      })}
    </div>
  );
}

/** Galería «Temas» (Y21): las 10 paletas con su nombre y siete pastillas (el acento y los seis colores). */
function GaleriaTemas({ contexto, onOrden }: { contexto: ContextoComando; onOrden: (orden: Orden) => void }): ReactElement {
  return (
    <div role="group" aria-label="Temas del diagrama" data-galeria-temas="" className="grid grid-cols-5 gap-1" onKeyDown={(e) => navegarGaleria(e, 5)}>
      {TEMAS_COMANDOS.map((def) => {
        const paleta = PALETAS_DIAGRAMA[def.id.slice("tema-".length) as DiagramaPaletaId];
        const estado = estadoComando(def, contexto);
        return (
          <button
            key={def.id}
            type="button"
            data-galeria-item=""
            data-comando={def.id}
            title={estado.habilitado ? `${def.etiqueta} — ${paleta.descripcion}` : `${def.etiqueta} — ${estado.motivo}`}
            aria-label={def.etiqueta}
            aria-disabled={!estado.habilitado || undefined}
            className="flex w-32 flex-col items-start gap-1 rounded-md border px-2 py-1 text-left text-[11px] outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-40"
            onClick={() => {
              if (estado.habilitado) onOrden(def.orden);
            }}
          >
            <span className="truncate">{paleta.nombre}</span>
            <svg width="112" height="10" viewBox="0 0 112 10" aria-hidden="true">
              {[paleta.acentoPrincipal, ...paleta.colores].map((c, i) => (
                <rect key={i} x={i * 16} width="16" height="10" fill={c} />
              ))}
            </svg>
          </button>
        );
      })}
    </div>
  );
}

/** Cómo se pidió una orden: `fija` deja la herramienta elegida hasta que se elija otra (Mayús al elegirla, o doble clic en su botón). */
export interface OpcionesOrden {
  fija?: boolean;
}

export interface CintaEditorProps {
  contexto: ContextoComando;
  /** Conectores elegidos (la pestaña «Formato de conector» aparece si hay alguno). */
  lineas: readonly Linea[];
  pestana: string;
  onPestana: (id: string) => void;
  /** Un botón o un atajo piden lo mismo: una orden que el editor ejecuta. */
  onOrden: (orden: Orden, opciones?: OpcionesOrden) => void;
  /** La herramienta activa quedó fija (Y11): su botón lo marca con `data-fija`. */
  herramientaFija?: boolean;
  /** El pincel quedó fijo (Y12b): el botón «Copiar formato» lo marca con `data-fija`. */
  pincelFijo?: boolean;
  /** Se aprieta el botón de una forma de la galería: si la persona arrastra, el editor la suelta en el lienzo (Y11). */
  onArrastrarForma?: (forma: TipoForma, evento: PointerEvent<HTMLButtonElement>) => void;
  /** Enter sobre una forma de la galería: se coloca al centro de la vista (Y11). */
  onColocarForma?: (forma: TipoForma) => void;
  /** Cambio sobre los conectores elegidos: una sola entrada de historial. */
  onCambiarConector: (nueva: Escena) => void;
  /** Cómo cambian los campos de «Formato de forma» la escena (los mismos que usa la mini barra, DY11). */
  formato?: AccionesDeFormato;
  /** F6 más allá de la cinta: el foco vuelve al lienzo. */
  onSalirALienzo: () => void;
  /** Acciones propias del editor que van junto a «Listo» (hoy, «Exportar», de W9, con su propio desplegable). */
  acciones?: ReactNode;
}

export function CintaEditor({ contexto, lineas, pestana, onPestana, onOrden, herramientaFija, pincelFijo, onArrastrarForma, onColocarForma, onCambiarConector, formato, onSalirALienzo, acciones }: CintaEditorProps): ReactElement {
  /** Botón de un comando del registro. */
  const boton = (id: string, size: "large" | "medium" | "small" = "medium", icono?: ReactNode): ReactElement => {
    const def = comando(id);
    const estado = estadoComando(def, contexto);
    const Icono = def.icono;
    // Las herramientas de crear se pueden dejar fijas (Mayús al elegirlas o doble clic) y las formas se arrastran desde la galería (Y11).
    const forma = def.orden.tipo === "herramienta-forma" ? def.orden.forma : null;
    const esHerramienta = forma !== null || (def.orden.tipo === "herramienta" && def.orden.herramienta !== "seleccionar") || def.orden.tipo === "copiar-formato";
    return (
      <RibbonButton
        key={id}
        label={def.etiqueta}
        size={size}
        icon={icono ?? (Icono ? <Icono /> : undefined)}
        shortcut={textoDeAtajo(def)}
        active={estado.activo}
        disabled={!estado.habilitado}
        disabledReason={estado.motivo || undefined}
        data-comando={id}
        {...(estado.activo && (def.orden.tipo === "copiar-formato" ? pincelFijo : herramientaFija) ? { "data-fija": "" } : {})}
        onClick={(e) => (esHerramienta ? onOrden(def.orden, { fija: e.shiftKey }) : onOrden(def.orden))}
        {...(esHerramienta ? { onDoubleClick: () => onOrden(def.orden, { fija: true }) } : {})}
        {...(forma !== null
          ? {
              onPointerDown: (e: PointerEvent<HTMLButtonElement>) => onArrastrarForma?.(forma, e),
              onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
                if (e.key !== "Enter" || e.ctrlKey || e.metaKey || e.altKey || !onColocarForma) return;
                e.preventDefault(); // sin esto el Enter también «haría clic» y elegiría la herramienta
                onColocarForma(forma);
              },
            }
          : {})}
      />
    );
  };

  /** «Seleccionar todo» con la flecha de las demás selecciones (Y15): todas salen del registro. */
  const botonSeleccionar = (): ReactElement => {
    const principal = comando("seleccionar-todo");
    const Icono = principal.icono;
    return (
      <RibbonSplitButton
        key="seleccionar-todo"
        size="large"
        label={principal.etiqueta}
        icon={Icono ? <Icono /> : undefined}
        shortcut={textoDeAtajo(principal)}
        data-comando="seleccionar-todo"
        onClick={() => onOrden(principal.orden)}
        menuLabel="Más selecciones"
        items={ELEGIR.map((v) => {
          const Ic = v.icono;
          const estado = estadoComando(v, contexto);
          return { id: v.id, label: v.etiqueta, icon: Ic ? <Ic /> : undefined, disabled: !estado.habilitado, onSelect: () => onOrden(v.orden) };
        })}
      />
    );
  };

  /** «Organizar automáticamente» con la flecha de las variantes (jerárquico, árbol y radial): todas salen del registro. */
  const botonOrganizar = (): ReactElement => {
    const principal = comando("organizar-auto");
    const estado = estadoComando(principal, contexto);
    const variantes = ORGANIZAR.filter((c) => c.id !== "organizar-auto");
    const Icono = principal.icono;
    return (
      <RibbonSplitButton
        key="organizar-auto"
        size="large"
        label={principal.etiqueta}
        icon={Icono ? <Icono /> : undefined}
        disabled={!estado.habilitado}
        disabledReason={estado.motivo || undefined}
        data-comando="organizar-auto"
        onClick={() => onOrden(principal.orden)}
        menuLabel="Más disposiciones"
        items={variantes.map((v) => {
          const Ic = v.icono;
          return { id: v.id, label: v.etiqueta, icon: Ic ? <Ic /> : undefined, disabled: !estadoComando(v, contexto).habilitado, onSelect: () => onOrden(v.orden) };
        })}
      />
    );
  };

  const gruposDeFormas = formasPorGrupo().map(({ grupo, nombre, formas }) => (
    <RibbonGroup key={grupo} label={nombre}>
      {formas.map((f) => boton(`forma-${f.id}`, "small", <Miniatura forma={f.id} />))}
    </RibbonGroup>
  ));

  const trazado = valorComun(lineas, (l) => l.trazado);
  const redondeadas = valorComun(lineas, (l) => l.estilo.radio > 0);
  const inicio = valorComun(lineas, (l) => l.inicio);
  const fin = valorComun(lineas, (l) => l.fin);
  const ids = lineas.map((l) => l.id);
  const escena = contexto.escena;
  const botonTrazado = (valor: "recto" | "ortogonal" | "curvo", etiqueta: string, icono: ReactElement): ReactElement => (
    <RibbonButton key={valor} label={etiqueta} size="medium" icon={icono} active={trazado === valor} onClick={() => onCambiarConector(cambiarTrazado(escena, ids, valor))} />
  );
  const selectorExtremo = (cual: "inicio" | "fin", valor: string | null): ReactElement => (
    <label key={cual} className="flex items-center gap-1 px-1 text-xs text-muted-foreground">
      {cual === "inicio" ? "Inicio" : "Final"}
      <select
        className="h-7 rounded-md border bg-background px-1.5 text-xs text-foreground"
        value={valor ?? ""}
        aria-label={cual === "inicio" ? "Extremo inicial" : "Extremo final"}
        onChange={(e) => onCambiarConector(cambiarExtremo(escena, ids, cual, e.target.value as (typeof EXTREMOS_OPCIONES)[number]["valor"]))}
      >
        {valor === null ? (
          <option value="" disabled>
            Mixto
          </option>
        ) : null}
        {EXTREMOS_OPCIONES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );

  const datosFormato = formato ? datosDeFormato(contexto.escena, contexto.seleccion) : null;

  const tabs = [
    {
      id: PESTANA_INICIO,
      label: "Inicio",
      content: (
        <>
          <RibbonGroup label="Portapapeles">
            {boton("pegar", "large")}
            {boton("cortar", "medium")}
            {boton("copiar", "medium")}
            {boton("pegar-en-sitio", "medium")}
          </RibbonGroup>
          <RibbonGroup label="Formato">
            {boton("copiar-formato", "medium")}
            {boton("aplicar-formato", "medium")}
          </RibbonGroup>
          <RibbonGroup label="Herramientas">
            {boton("seleccionar", "large")}
            {boton("linea", "large")}
            {boton("flecha", "large")}
            {boton("texto", "large")}
          </RibbonGroup>
          <RibbonGroup label="Seleccionar">{botonSeleccionar()}</RibbonGroup>
          <RibbonGroup label="Edición">
            {boton("duplicar", "large")}
            {boton("eliminar", "large")}
            {boton("crear-hijo", "medium")}
            {boton("crear-hermano", "medium")}
            {boton("eliminar-rama", "medium")}
            {boton("plegar-rama", "medium")}
          </RibbonGroup>
        </>
      ),
    },
    {
      id: "insertar",
      label: "Insertar",
      content: (
        <>
          <RibbonGroup label="Conexión">
            {boton("conectar-cadena", "large")}
          </RibbonGroup>
          <RibbonGroup label="Texto a diagrama">
            {boton("esquema", "large")}
          </RibbonGroup>
          {gruposDeFormas}
          <RibbonGroup label="Iconos">
            <GaleriaIconos contexto={contexto} onOrden={onOrden} {...(onColocarForma ? { onColocarForma } : {})} />
          </RibbonGroup>
        </>
      ),
    },
    {
      id: "organizar",
      label: "Organizar",
      content: (
        <>
          <RibbonGroup label="Agrupar">
            {boton("agrupar", "large")}
            {boton("desagrupar", "large")}
          </RibbonGroup>
          <RibbonGroup label="Orden">
            {boton("orden-frente")}
            {boton("orden-subir")}
            {boton("orden-bajar")}
            {boton("orden-fondo")}
          </RibbonGroup>
          <RibbonGroup label="Alinear">
            {boton("alinear-izquierda", "small")}
            {boton("alinear-centro", "small")}
            {boton("alinear-derecha", "small")}
            {boton("alinear-arriba", "small")}
            {boton("alinear-medio", "small")}
            {boton("alinear-abajo", "small")}
          </RibbonGroup>
          <RibbonGroup label="Distribuir">
            {boton("distribuir-horizontal", "small")}
            {boton("distribuir-vertical", "small")}
          </RibbonGroup>
          <RibbonGroup label="Disposición">{botonOrganizar()}</RibbonGroup>
        </>
      ),
    },
    {
      id: PESTANA_DISENO,
      label: "Diseño",
      content: (
        <div data-cinta-diseno="" className="flex items-stretch">
          <RibbonGroup label="Temas">
            <GaleriaTemas contexto={contexto} onOrden={onOrden} />
          </RibbonGroup>
        </div>
      ),
    },
    {
      id: "vista",
      label: "Vista",
      content: (
        <>
          <RibbonGroup label="Zoom">
            {boton("alejar", "small")}
            <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground" data-dibujo-zoom="">
              {Math.round(contexto.zoom * 100)}%
            </span>
            {boton("acercar", "small")}
            {boton("ajustar-vista", "small")}
          </RibbonGroup>
          <RibbonGroup label="Ayudas">
            {boton("cuadricula", "large")}
            {boton("imantar", "large")}
            {boton("reglas", "large")}
            {boton("quitar-guias", "medium")}
            {boton("atajos", "medium")}
          </RibbonGroup>
          <RibbonGroup label="Página">{boton("girar-pagina", "large")}</RibbonGroup>
          <RibbonGroup label="Ramas">{boton("desplegar-todo", "large")}</RibbonGroup>
        </>
      ),
    },
    ...(datosFormato && formato
      ? [
          {
            id: PESTANA_FORMATO,
            label: "Formato de forma",
            contextual: true,
            content: (
              <div data-cinta-formato="" className="flex items-stretch">
                <RibbonGroup label="Relleno">
                  <ColorRelleno datos={datosFormato} sufijo="(cinta)" {...formato} />
                </RibbonGroup>
                {datosFormato.destino.some((h) => h.tipo === "forma") ? (
                  <RibbonGroup label="Forma">
                    <SelectorForma contexto={contexto} onOrden={onOrden} />
                  </RibbonGroup>
                ) : null}
                <RibbonGroup label="Estilos">
                  <GaleriaEstilos contexto={contexto} onOrden={onOrden} />
                </RibbonGroup>
                <RibbonGroup label="Contorno">
                  <ColorContorno datos={datosFormato} sufijo="(cinta)" {...formato} />
                  <GrosorContorno datos={datosFormato} sufijo="(cinta)" {...formato} />
                </RibbonGroup>
                <RibbonGroup label="Texto">
                  <TamanoLetra datos={datosFormato} sufijo="(cinta)" {...formato} />
                  <BotonFormatoTexto id="negrita" datos={datosFormato} sufijo="(cinta)" contexto={contexto} onOrden={onOrden} />
                  <BotonFormatoTexto id="cursiva" datos={datosFormato} sufijo="(cinta)" contexto={contexto} onOrden={onOrden} />
                  <BotonFormatoTexto id="subrayado" datos={datosFormato} sufijo="(cinta)" contexto={contexto} onOrden={onOrden} />
                  <BotonLista id="vinetas-puntos" sufijo="(cinta)" contexto={contexto} onOrden={onOrden} />
                  <BotonLista id="vinetas-numeros" sufijo="(cinta)" contexto={contexto} onOrden={onOrden} />
                  {boton("ajustar-al-texto", "small")}
                  <AlineacionHorizontal datos={datosFormato} sufijo="(cinta)" {...formato} />
                </RibbonGroup>
              </div>
            ),
          },
        ]
      : []),
    ...(lineas.length > 0
      ? [
          {
            id: PESTANA_CONECTOR,
            label: "Formato de conector",
            contextual: true,
            content: (
              <div data-cinta-conector="" className="flex items-stretch">
                <RibbonGroup label={lineas.length > 1 ? `Trazado (${lineas.length} conectores)` : "Trazado"}>
                  {botonTrazado("recto", "Recto", <Minus />)}
                  {botonTrazado("ortogonal", "En ángulo recto", <CornerDownRight />)}
                  {botonTrazado("curvo", "Curvo", <Spline />)}
                  {trazado === "ortogonal" || trazado === null ? (
                    <RibbonButton label="Esquinas redondeadas" size="medium" active={redondeadas === true} onClick={() => onCambiarConector(cambiarEsquinas(escena, ids, redondeadas !== true))} />
                  ) : null}
                </RibbonGroup>
                <RibbonGroup label="Extremos">
                  {selectorExtremo("inicio", inicio)}
                  {selectorExtremo("fin", fin)}
                </RibbonGroup>
                <RibbonGroup label="Unión">
                  {lineas.some(hayExtremoLibre) ? (
                    <span data-extremo-libre-aviso="" className="px-2 text-xs font-medium text-orange-600 dark:text-orange-400">
                      Extremo libre
                    </span>
                  ) : null}
                  {boton("pegar-al-mas-cercano", "medium")}
                </RibbonGroup>
              </div>
            ),
          },
        ]
      : []),
  ];

  const listo = comando("listo");
  return (
    <Ribbon
      tabs={tabs}
      activeTab={pestana}
      onActiveTabChange={onPestana}
      onNavigateOut={onSalirALienzo}
      quickAccess={
        <QuickAccessBar label="Acceso rápido">
          {boton("buscar-comando", "small")}
          {boton("deshacer", "small")}
          {boton("rehacer", "small")}
        </QuickAccessBar>
      }
      trailing={
        <>
          {acciones}
          <RibbonButton label={listo.etiqueta} size="medium" icon={listo.icono ? <listo.icono /> : undefined} data-dibujo-listo="" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onOrden(listo.orden)} />
        </>
      }
    />
  );
}
