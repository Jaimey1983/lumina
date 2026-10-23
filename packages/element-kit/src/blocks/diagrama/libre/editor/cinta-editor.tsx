"use client";

// ─── Cinta del editor de dibujo (Y2) ──────────────────────────────────────────
// Arma las pestañas de la cinta (`@lumina/ui/ribbon`) desde el registro único de comandos: cada botón es
// un comando del registro, así que su etiqueta, atajo y estado (habilitado, activo) salen de un solo sitio.
// Pestañas: Inicio · Insertar · Organizar · Vista, y la contextual «Formato de conector» cuando lo elegido
// son líneas. «Formato de forma» llega con la fase D (estilos y mini barra): una pestaña sin contenido no se muestra (DY1).

import type { KeyboardEvent, PointerEvent, ReactElement, ReactNode } from "react";
import { formasPorGrupo, trazadoForma, type Escena, type Linea, type TipoForma } from "@lumina/drawing";
import { QuickAccessBar, Ribbon, RibbonButton, RibbonGroup, RibbonSplitButton } from "@lumina/ui/ribbon";
import { CornerDownRight, Minus, Spline } from "lucide-react";
import { COMANDOS, comando, ELEGIR, estadoComando, ORGANIZAR, textoDeAtajo, type ContextoComando } from "./comandos-registro.js";
import type { Orden } from "./comandos.js";
import { cambiarEsquinas, cambiarExtremo, cambiarTrazado, EXTREMOS_OPCIONES, hayExtremoLibre, valorComun } from "./conectores.js";

export const PESTANA_INICIO = "inicio";
export const PESTANA_CONECTOR = "conector";

/** Orden de secciones en el panel de atajos (Y5); una sola fuente con la cinta. */
export const ORDEN_PESTANAS_ATAJOS = ["Historial", "Inicio", "Insertar", "Organizar", "Vista", "Edición general", "Navegación y ratón"] as const;

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
  cuadricula: "Vista",
  imantar: "Vista",
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
  ...Object.fromEntries(ELEGIR.map((c) => [c.id, "Inicio"])),
  "pegar-al-mas-cercano": "Formato de conector",
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
  /** F6 más allá de la cinta: el foco vuelve al lienzo. */
  onSalirALienzo: () => void;
  /** Acciones propias del editor que van junto a «Listo» (hoy, «Exportar», de W9, con su propio desplegable). */
  acciones?: ReactNode;
}

export function CintaEditor({ contexto, lineas, pestana, onPestana, onOrden, herramientaFija, pincelFijo, onArrastrarForma, onColocarForma, onCambiarConector, onSalirALienzo, acciones }: CintaEditorProps): ReactElement {
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
            {boton("atajos", "medium")}
          </RibbonGroup>
        </>
      ),
    },
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
