"use client";

import type { ReactElement } from "react";
import type { Contorno, Escena, Relleno, Sombra } from "@lumina/drawing";
import { CollapsibleSection, type CollapsibleSectionProps } from "@lumina/ui/collapsible-section";
import { FieldHelp } from "@lumina/ui/field-help";
import { AlignCenter, AlignLeft, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart, Bold, Italic, PanelRightClose, Underline } from "lucide-react";
import { CampoNumero, Conmutador, Deslizador, Fila, Opciones, FilaColor } from "./propiedades-campos.js";
import { PanelCapas } from "./propiedades-capas.js";
import {
  SOMBRA_POR_DEFECTO,
  conRadio,
  conRelleno,
  conSombra,
  fijarContorno,
  fijarGeometria,
  fijarOpacidad,
  fijarRadio,
  fijarRelleno,
  fijarSombra,
  fijarTexto,
  hojasDeSeleccion,
  hojasEditables,
  leerGeometria,
  rellenoDeTipo,
  valorComun,
  type CampoGeometria,
  type Valor,
} from "./propiedades.js";

export interface PanelPropiedadesProps {
  escena: Escena;
  seleccion: readonly string[];
  /** Un cambio que entra al historial como una sola entrada. */
  onAplicar: (cambio: (e: Escena) => Escena) => void;
  /** Vista previa mientras se arrastra un deslizador o un selector: no entra al historial hasta `onFinVista`. */
  onVista: (cambio: (e: Escena) => Escena) => void;
  onFinVista: () => void;
  onSeleccionar: (ids: string[], sumar: boolean) => void;
  /** Pliega el panel a un riel (lo da la zona redimensionable que lo envuelve). */
  onPlegar?: () => void;
}

const FUENTES: ReadonlyArray<{ valor: string; nombre: string }> = [
  { valor: "", nombre: "La del tema" },
  { valor: "Arial, Helvetica, sans-serif", nombre: "Sans (Arial)" },
  { valor: "Georgia, 'Times New Roman', serif", nombre: "Serif (Georgia)" },
  { valor: "'Courier New', Courier, monospace", nombre: "Monoespaciada" },
  { valor: "'Comic Sans MS', 'Segoe Print', cursive", nombre: "Manuscrita" },
];

const PATRONES = [
  { valor: "solido", etiqueta: "Sólido" },
  { valor: "guiones", etiqueta: "Guiones" },
  { valor: "puntos", etiqueta: "Puntos" },
] as const;

const TIPOS_RELLENO = [
  { valor: "ninguno", etiqueta: "Ninguno" },
  { valor: "solido", etiqueta: "Sólido" },
  { valor: "degradado", etiqueta: "Degradado" },
] as const;

const ALINEACION_H = [
  { valor: "izquierda", etiqueta: "Texto alineado a la izquierda", icono: <AlignLeft className="size-3.5" /> },
  { valor: "centro", etiqueta: "Texto centrado", icono: <AlignCenter className="size-3.5" /> },
  { valor: "derecha", etiqueta: "Texto alineado a la derecha", icono: <AlignRight className="size-3.5" /> },
] as const;

const ALINEACION_V = [
  { valor: "arriba", etiqueta: "Texto arriba", icono: <AlignVerticalJustifyStart className="size-3.5" /> },
  { valor: "medio", etiqueta: "Texto en el medio", icono: <AlignVerticalJustifyCenter className="size-3.5" /> },
  { valor: "abajo", etiqueta: "Texto abajo", icono: <AlignVerticalJustifyEnd className="size-3.5" /> },
] as const;

/** Sección plegable con un poco de aire arriba y abajo del contenido. */
function Seccion({ children, ...props }: CollapsibleSectionProps): ReactElement {
  return (
    <CollapsibleSection {...props}>
      <div className="pb-2 pt-1">{children}</div>
    </CollapsibleSection>
  );
}

function CampoGrid(props: Parameters<typeof CampoNumero>[0]): ReactElement {
  return (
    <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
      {props.etiqueta}
      <CampoNumero {...props} />
    </label>
  );
}

const porcentaje = (n: number): string => `${Math.round(n * 100)}%`;

export function PanelPropiedades({ escena, seleccion, onAplicar, onVista, onFinVista, onSeleccionar, onPlegar }: PanelPropiedadesProps): ReactElement {
  const todas = hojasDeSeleccion(escena, seleccion);
  const editables = hojasEditables(escena, seleccion);
  const bloqueadas = todas.length > 0 && editables.length === 0;

  const conRell = editables.filter(conRelleno);
  const conSomb = editables.filter(conSombra);
  const conRad = editables.filter(conRadio);

  const relleno = valorComun(conRell, (h) => (h.tipo === "linea" ? ({ tipo: "ninguno" } as Relleno) : h.estilo.relleno));
  const tipoRelleno: Valor<Relleno["tipo"]> | null = relleno ? (relleno.mixto ? valorComun(conRell, (h) => h.estilo.relleno.tipo) : { mixto: false, valor: relleno.valor.tipo }) : null;
  const colorSolido = valorComun(
    conRell.filter((h) => h.estilo.relleno.tipo === "solido"),
    (h) => (h.estilo.relleno.tipo === "solido" ? h.estilo.relleno.color : ""),
  );
  const degradado = (leer: (r: Extract<Relleno, { tipo: "degradado" }>) => string | number) =>
    valorComun(
      conRell.filter((h) => h.estilo.relleno.tipo === "degradado"),
      (h) => (h.estilo.relleno.tipo === "degradado" ? leer(h.estilo.relleno) : ""),
    );
  const desde = degradado((r) => r.desde) as Valor<string> | null;
  const hasta = degradado((r) => r.hasta) as Valor<string> | null;
  const angulo = degradado((r) => r.angulo) as Valor<number> | null;
  const todosSolidos = conRell.length > 0 && conRell.every((h) => h.estilo.relleno.tipo === "solido");
  const todosDegradados = conRell.length > 0 && conRell.every((h) => h.estilo.relleno.tipo === "degradado");

  const colorContorno = valorComun(editables, (h) => h.estilo.contorno.color);
  const grosor = valorComun(editables, (h) => h.estilo.contorno.grosor);
  const patron = valorComun(editables, (h) => h.estilo.contorno.patron);
  const opacidad = valorComun(editables, (h) => h.estilo.opacidad);

  const sombras = valorComun(conSomb, (h) => (h.estilo.sombra ? "si" : "no"));
  const conSombraActiva = conSomb.filter((h) => h.estilo.sombra !== null);
  const sombraDe = <K extends keyof Sombra>(k: K) => valorComun(conSombraActiva, (h) => (h.estilo.sombra as Sombra)[k]) as Valor<Sombra[K]> | null;

  const radio = valorComun(conRad, (h) => h.estilo.radio);

  const et = <K extends keyof (typeof editables)[number]["estiloTexto"]>(k: K) => valorComun(editables, (h) => h.estiloTexto[k]);
  const fuente = et("fuente");
  const fuenteConocida = fuente && !fuente.mixto && FUENTES.some((f) => f.valor === fuente.valor);

  const geometria = leerGeometria(escena, seleccion);
  const geometriaBloqueada = bloqueadas;
  const campoGeo = (campo: CampoGeometria) => (n: number) => onAplicar((e) => fijarGeometria(e, seleccion, campo, n));

  const solo = <T,>(v: T | null | undefined): Valor<T> | null => (v === null || v === undefined ? null : { mixto: false, valor: v });

  return (
    <aside
      aria-label="Propiedades"
      data-dibujo-propiedades=""
      className="flex w-full min-w-0 flex-col overflow-y-auto border-l bg-card text-card-foreground"
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Propiedades
        {onPlegar ? (
          <button
            type="button"
            aria-label="Plegar propiedades"
            title="Plegar propiedades"
            data-zona-alternar=""
            className="flex size-6 cursor-pointer items-center justify-center rounded-md outline-hidden hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
            onClick={onPlegar}
          >
            <PanelRightClose aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {todas.length === 0 ? (
        <p className="px-3 py-3 text-xs text-muted-foreground" data-propiedades-vacio="">
          Elige un elemento del dibujo para cambiar su aspecto. Con varios elegidos, el cambio vale para todos.
        </p>
      ) : bloqueadas ? (
        <p className="px-3 py-3 text-xs text-muted-foreground" data-propiedades-bloqueado="">
          Lo que elegiste está bloqueado. Desbloquéalo en Capas para cambiarlo.
        </p>
      ) : null}

      {editables.length > 0 ? (
        <div className="divide-y px-3">
          <Seccion title="Posición y tamaño" storageKey="dibujo-posicion" defaultOpen>
            <div className="space-y-2">
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                Caja del elemento
                <FieldHelp label="Posición y tamaño">
                  <p>
                    Con una sola forma o cuadro de texto, X, Y, ancho y alto son los de su caja sin girar. Con varios elementos (o un grupo, o una línea) son los de la caja que los envuelve:
                    cambiarlos los mueve o los escala juntos.
                  </p>
                </FieldHelp>
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <CampoGrid etiqueta="X" valor={geometria?.x ?? null} deshabilitado={geometriaBloqueada} onConfirmar={campoGeo("x")} />
                <CampoGrid etiqueta="Y" valor={geometria?.y ?? null} deshabilitado={geometriaBloqueada} onConfirmar={campoGeo("y")} />
                <CampoGrid etiqueta="Ancho" valor={geometria?.ancho ?? null} min={1} max={20000} deshabilitado={geometriaBloqueada} onConfirmar={campoGeo("ancho")} />
                <CampoGrid etiqueta="Alto" valor={geometria?.alto ?? null} min={1} max={20000} deshabilitado={geometriaBloqueada} onConfirmar={campoGeo("alto")} />
                <CampoGrid
                  etiqueta="Rotación"
                  valor={solo(geometria?.rotacion)}
                  min={-360}
                  max={360}
                  unidad="°"
                  deshabilitado={geometriaBloqueada || geometria?.rotacion === null}
                  onConfirmar={campoGeo("rotacion")}
                />
              </div>
            </div>
          </Seccion>

          {conRell.length > 0 ? (
            <Seccion title="Relleno" storageKey="dibujo-relleno" defaultOpen>
              <div className="space-y-2">
                <Opciones
                  etiqueta="Tipo de relleno"
                  opciones={TIPOS_RELLENO}
                  valor={tipoRelleno}
                  onElegir={(t) => onAplicar((e) => fijarRelleno(e, editables, (actual) => (actual.tipo === t ? actual : rellenoDeTipo(t, actual))))}
                />
                {todosSolidos ? (
                  <FilaColor
                    etiqueta="Color"
                    etiquetaColor="Color de relleno"
                    valor={colorSolido as Valor<string> | null}
                    onElegir={(color) => onAplicar((e) => fijarRelleno(e, editables, { tipo: "solido", color }))}
                    onVista={(color) => onVista((e) => fijarRelleno(e, editables, { tipo: "solido", color }))}
                    onFin={onFinVista}
                  />
                ) : null}
                {todosDegradados ? (
                  <>
                    <FilaColor
                      etiqueta="Desde"
                      ayuda={
                        <FieldHelp label="Degradado">
                          <p>El degradado va de un color a otro. El ángulo marca la dirección: 0° es de izquierda a derecha y 90°, de arriba hacia abajo.</p>
                        </FieldHelp>
                      }
                      etiquetaColor="Color inicial del degradado"
                      valor={desde}
                      onElegir={(c) => onAplicar((e) => fijarRelleno(e, editables, (r) => (r.tipo === "degradado" ? { ...r, desde: c } : r)))}
                      onVista={(c) => onVista((e) => fijarRelleno(e, editables, (r) => (r.tipo === "degradado" ? { ...r, desde: c } : r)))}
                      onFin={onFinVista}
                    />
                    <FilaColor
                      etiqueta="Hasta"
                      etiquetaColor="Color final del degradado"
                      valor={hasta}
                      onElegir={(c) => onAplicar((e) => fijarRelleno(e, editables, (r) => (r.tipo === "degradado" ? { ...r, hasta: c } : r)))}
                      onVista={(c) => onVista((e) => fijarRelleno(e, editables, (r) => (r.tipo === "degradado" ? { ...r, hasta: c } : r)))}
                      onFin={onFinVista}
                    />
                    <Fila etiqueta="Ángulo">
                      <Deslizador
                        etiqueta="Ángulo del degradado"
                        valor={angulo}
                        min={0}
                        max={359}
                        paso={1}
                        formato={(n) => `${n}°`}
                        onVista={(n) => onVista((e) => fijarRelleno(e, editables, (r) => (r.tipo === "degradado" ? { ...r, angulo: n } : r)))}
                        onFin={onFinVista}
                      />
                    </Fila>
                  </>
                ) : null}
                {!todosSolidos && !todosDegradados && tipoRelleno?.mixto ? (
                  <p className="text-[11px] text-muted-foreground">Los elegidos tienen rellenos distintos: elige un tipo para igualarlos.</p>
                ) : null}
              </div>
            </Seccion>
          ) : null}

          <Seccion title="Contorno" storageKey="dibujo-contorno" defaultOpen>
            <div className="space-y-2">
              <FilaColor
                etiqueta="Color"
                etiquetaColor="Color del contorno"
                valor={colorContorno}
                onElegir={(color) => onAplicar((e) => fijarContorno(e, editables, { color }))}
                onVista={(color) => onVista((e) => fijarContorno(e, editables, { color }))}
                onFin={onFinVista}
              />
              <Fila etiqueta="Grosor">
                <Deslizador
                  etiqueta="Grosor del contorno"
                  valor={grosor}
                  min={0}
                  max={20}
                  paso={0.5}
                  formato={(n) => `${n}`}
                  onVista={(n) => onVista((e) => fijarContorno(e, editables, { grosor: n }))}
                  onFin={onFinVista}
                />
              </Fila>
              <Fila
                etiqueta="Trazo"
                ayuda={
                  <FieldHelp label="Contorno">
                    <p>Grosor 0 quita el contorno. En una línea o flecha, el contorno es el propio trazo.</p>
                  </FieldHelp>
                }
              >
                <Opciones
                  etiqueta="Patrón del trazo"
                  opciones={PATRONES}
                  valor={patron as Valor<Contorno["patron"]> | null}
                  onElegir={(p) => onAplicar((e) => fijarContorno(e, editables, { patron: p }))}
                />
              </Fila>
            </div>
          </Seccion>

          <Seccion title="Opacidad" storageKey="dibujo-opacidad" defaultOpen>
            <Fila etiqueta="Opacidad">
              <Deslizador etiqueta="Opacidad" valor={opacidad} min={0} max={1} paso={0.05} formato={porcentaje} onVista={(n) => onVista((e) => fijarOpacidad(e, editables, n))} onFin={onFinVista} />
            </Fila>
          </Seccion>

          {conSomb.length > 0 ? (
            <Seccion title="Sombra" storageKey="dibujo-sombra" defaultOpen={false}>
              <div className="space-y-2">
                <Fila
                  etiqueta="Sombra"
                  ayuda={
                    <FieldHelp label="Sombra">
                      <p>
                        Desenfoque suaviza el borde; Desplaz. X e Y la corren hacia la derecha y hacia abajo (con valores negativos, hacia la izquierda y hacia arriba). Las líneas no llevan sombra.
                      </p>
                    </FieldHelp>
                  }
                >
                  <Conmutador
                    etiqueta="Sombra activada"
                    valor={sombras ? (sombras.mixto ? { mixto: true } : { mixto: false, valor: sombras.valor === "si" }) : null}
                    icono={<span className="text-xs">{sombras?.mixto ? "Mixto" : sombras && sombras.valor === "si" ? "Sí" : "No"}</span>}
                    onCambiar={(v) => onAplicar((e) => fijarSombra(e, editables, v ? (actual) => actual ?? SOMBRA_POR_DEFECTO : null))}
                  />
                </Fila>
                {conSombraActiva.length > 0 ? (
                  <>
                    <FilaColor
                      etiqueta="Color"
                      etiquetaColor="Color de la sombra"
                      valor={sombraDe("color")}
                      onElegir={(color) => onAplicar((e) => fijarSombra(e, editables, (s) => (s ? { ...s, color } : s)))}
                      onVista={(color) => onVista((e) => fijarSombra(e, editables, (s) => (s ? { ...s, color } : s)))}
                      onFin={onFinVista}
                    />
                    <Fila etiqueta="Desenfoque">
                      <Deslizador
                        etiqueta="Desenfoque de la sombra"
                        valor={sombraDe("desenfoque")}
                        min={0}
                        max={40}
                        paso={1}
                        onVista={(n) => onVista((e) => fijarSombra(e, editables, (s) => (s ? { ...s, desenfoque: n } : s)))}
                        onFin={onFinVista}
                      />
                    </Fila>
                    <Fila etiqueta="Desplaz. X">
                      <Deslizador
                        etiqueta="Desplazamiento X de la sombra"
                        valor={sombraDe("dx")}
                        min={-40}
                        max={40}
                        paso={1}
                        onVista={(n) => onVista((e) => fijarSombra(e, editables, (s) => (s ? { ...s, dx: n } : s)))}
                        onFin={onFinVista}
                      />
                    </Fila>
                    <Fila etiqueta="Desplaz. Y">
                      <Deslizador
                        etiqueta="Desplazamiento Y de la sombra"
                        valor={sombraDe("dy")}
                        min={-40}
                        max={40}
                        paso={1}
                        onVista={(n) => onVista((e) => fijarSombra(e, editables, (s) => (s ? { ...s, dy: n } : s)))}
                        onFin={onFinVista}
                      />
                    </Fila>
                  </>
                ) : null}
              </div>
            </Seccion>
          ) : null}

          {conRad.length > 0 ? (
            <Seccion title="Esquinas" storageKey="dibujo-esquinas" defaultOpen={false}>
              <Fila
                etiqueta="Radio"
                ayuda={
                  <FieldHelp label="Esquinas">
                    <p>
                      Redondea las esquinas del rectángulo, del cuadro de texto y de los conectores en ángulo recto. Las demás formas tienen su propio contorno; el rectángulo redondeado se ajusta con
                      sus asas.
                    </p>
                  </FieldHelp>
                }
              >
                <Deslizador etiqueta="Radio de las esquinas" valor={radio} min={0} max={100} paso={1} onVista={(n) => onVista((e) => fijarRadio(e, editables, n))} onFin={onFinVista} />
              </Fila>
            </Seccion>
          ) : null}

          <Seccion title="Tipografía" storageKey="dibujo-texto" defaultOpen>
            <div className="space-y-2">
              <Fila etiqueta="Fuente">
                <select
                  aria-label="Familia tipográfica"
                  className="h-8 w-40 rounded-md border bg-background px-2 text-xs"
                  value={fuente ? (fuente.mixto ? "" : fuente.valor) : ""}
                  onChange={(e) => {
                    const elegida = e.target.value;
                    onAplicar((esc) => fijarTexto(esc, editables, { fuente: elegida }));
                  }}
                >
                  {fuente?.mixto ? (
                    <option value="" disabled>
                      Mixto
                    </option>
                  ) : null}
                  {fuente && !fuente.mixto && !fuenteConocida ? <option value={fuente.valor}>{fuente.valor.split(",")[0]}</option> : null}
                  {FUENTES.map((f) => (
                    <option key={f.valor} value={f.valor}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </Fila>
              <Fila etiqueta="Tamaño">
                <CampoNumero
                  etiqueta="Tamaño del texto"
                  valor={et("tamano") as Valor<number> | null}
                  min={6}
                  max={400}
                  unidad="pt"
                  ancho="w-24"
                  onConfirmar={(n) => onAplicar((e) => fijarTexto(e, editables, { tamano: n }))}
                />
              </Fila>
              <Fila etiqueta="Estilo">
                <div className="flex gap-1">
                  <Conmutador
                    etiqueta="Negrita"
                    valor={et("negrita") as Valor<boolean> | null}
                    icono={<Bold className="size-3.5" />}
                    onCambiar={(v) => onAplicar((e) => fijarTexto(e, editables, { negrita: v }))}
                  />
                  <Conmutador
                    etiqueta="Cursiva"
                    valor={et("cursiva") as Valor<boolean> | null}
                    icono={<Italic className="size-3.5" />}
                    onCambiar={(v) => onAplicar((e) => fijarTexto(e, editables, { cursiva: v }))}
                  />
                  <Conmutador
                    etiqueta="Subrayado"
                    valor={et("subrayado") as Valor<boolean> | null}
                    icono={<Underline className="size-3.5" />}
                    onCambiar={(v) => onAplicar((e) => fijarTexto(e, editables, { subrayado: v }))}
                  />
                </div>
              </Fila>
              <Fila etiqueta="Horizontal">
                <Opciones
                  etiqueta="Alineación horizontal"
                  opciones={ALINEACION_H}
                  valor={et("alineacionH") as Valor<(typeof ALINEACION_H)[number]["valor"]> | null}
                  onElegir={(v) => onAplicar((e) => fijarTexto(e, editables, { alineacionH: v }))}
                />
              </Fila>
              <Fila etiqueta="Vertical">
                <Opciones
                  etiqueta="Alineación vertical"
                  opciones={ALINEACION_V}
                  valor={et("alineacionV") as Valor<(typeof ALINEACION_V)[number]["valor"]> | null}
                  onElegir={(v) => onAplicar((e) => fijarTexto(e, editables, { alineacionV: v }))}
                />
              </Fila>
              <FilaColor
                etiqueta="Color"
                etiquetaColor="Color del texto"
                valor={et("color") as Valor<string> | null}
                onElegir={(color) => onAplicar((e) => fijarTexto(e, editables, { color }))}
                onVista={(color) => onVista((e) => fijarTexto(e, editables, { color }))}
                onFin={onFinVista}
              />
            </div>
          </Seccion>
        </div>
      ) : null}

      <div className="border-t px-3">
        <Seccion title="Capas" storageKey="dibujo-capas" defaultOpen badge={escena.elementos.filter((e) => e.tipo !== "grupo").length}>
          <div className="space-y-2">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              Lo de arriba está al frente
              <FieldHelp label="Capas">
                <p>
                  Elige un elemento para cambiarlo, aunque esté oculto o bloqueado. Ocultar no lo borra: deja de verse y de poder elegirse. Bloquear lo deja visible pero sin poder moverlo ni
                  cambiarlo. Doble clic en un nombre lo renombra.
                </p>
              </FieldHelp>
            </p>
            <PanelCapas escena={escena} seleccion={seleccion} onAplicar={onAplicar} onSeleccionar={onSeleccionar} />
          </div>
        </Seccion>
      </div>
    </aside>
  );
}
