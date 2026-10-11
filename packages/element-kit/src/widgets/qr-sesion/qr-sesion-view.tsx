import { Suspense, lazy, useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { stopWidgetInnerPointer } from "@lumina/editor-shared/widget-editor-utils";
import { VISUALLY_HIDDEN } from "../visually-hidden.js";
import { QR_TAMANOS, normalizeQrSesionWidget, urlDeUnion } from "./qr-sesion-defaults.js";
import type { QrSesionEstado } from "./qr-sesion-types.js";
import styles from "./qr-sesion.module.css";

// `qrcode.react` se carga solo cuando hay un código que dibujar: el viewer de un slide sin QR no
// paga la librería (DT5).
const QRCodeSVG = lazy(() => import("qrcode.react").then((m) => ({ default: m.QRCodeSVG })));

/** Un QR escaneable necesita contraste: en `alto` va negro sobre blanco, no los colores del tema. */
const NEGRO = "#000000";
const BLANCO = "#ffffff";

/** Copia al portapapeles; sin `navigator.clipboard` (contexto no seguro) cae a `execCommand`. */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Permiso denegado: se prueba el respaldo.
  }
  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand?.("copy") === true;
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export interface QrSesionViewProps {
  estado: QrSesionEstado;
  /** En el editor un clic selecciona el bloque y los botones de copiar no actúan. */
  editor?: boolean;
  isThumbnail?: boolean;
  onSeleccionar?: () => void;
}

export function QrSesionView({ estado, editor = false, isThumbnail = false, onSeleccionar }: QrSesionViewProps): ReactElement {
  const { configuracion: cfg } = normalizeQrSesionWidget(estado);
  // El origen del navegador solo existe en el cliente: se lee tras montar (sin desajuste de hidratación).
  const [origenAuto, setOrigenAuto] = useState("");
  const [copiado, setCopiado] = useState<"" | "codigo" | "enlace" | "error">("");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOrigenAuto(window.location.origin);
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const origen = cfg.origen === "personalizado" && cfg.origenPersonalizado ? cfg.origenPersonalizado : origenAuto;
  const url = origen ? urlDeUnion(origen, cfg.codigo) : null;
  const porcentaje = QR_TAMANOS.find((t) => t.id === cfg.tamano)?.porcentaje ?? 75;
  const alto = cfg.contraste === "alto";
  const colores = alto
    ? { fg: NEGRO, bg: BLANCO }
    : { fg: "currentColor", bg: "transparent" };

  const copiar = async (que: "codigo" | "enlace") => {
    if (editor || isThumbnail) return;
    const texto = que === "codigo" ? cfg.codigo : url;
    if (!texto) return;
    const ok = await copiarAlPortapapeles(texto);
    setCopiado(ok ? que : "error");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setCopiado(""), 2000);
  };

  const sinCodigo = cfg.codigo === "";

  return (
    <section
      className={styles.raiz}
      aria-label="Código QR para unirse a la clase"
      onPointerDown={editor ? onSeleccionar : undefined}
      data-contraste={cfg.contraste}
    >
      {cfg.textoAyuda.trim() ? <p className={styles.ayuda}>{cfg.textoAyuda}</p> : null}

      <div className={styles.zonaQr}>
        {sinCodigo ? (
          <div className={styles.vacio} role="note">
            {editor ? "Escribe el código de la clase en el panel." : "Falta el código de la clase."}
          </div>
        ) : (
          <div
            className={styles.qr}
            style={{ ["--qr-ancho"]: `${porcentaje}%`, ...(alto ? { background: BLANCO } : {}) } as CSSProperties}
            role="img"
            aria-label={`Código QR del enlace para unirse a la clase con el código ${cfg.codigo}`}
            data-url={url ?? undefined}
          >
            {url ? (
              <Suspense fallback={<div className={styles.cargando} aria-hidden />}>
                <QRCodeSVG
                  value={url}
                  level={cfg.nivel}
                  marginSize={cfg.margen}
                  fgColor={colores.fg}
                  bgColor={colores.bg}
                  className={styles.svg}
                  aria-hidden
                />
              </Suspense>
            ) : (
              <div className={styles.cargando} aria-hidden />
            )}
          </div>
        )}
      </div>

      {!sinCodigo && cfg.mostrarCodigo ? (
        <p className={styles.codigo} aria-label={`Código: ${cfg.codigo}`}>
          {cfg.codigo}
        </p>
      ) : null}
      {!sinCodigo && cfg.mostrarUrl && url ? <p className={styles.url}>{url}</p> : null}

      {!sinCodigo && cfg.botonCopiar && !isThumbnail ? (
        <div className={styles.acciones} onPointerDown={editor ? stopWidgetInnerPointer : undefined}>
          <button type="button" className={styles.boton} onClick={() => void copiar("codigo")}>
            {copiado === "codigo" ? <Check className={styles.icono} aria-hidden /> : <Copy className={styles.icono} aria-hidden />}
            Copiar código
          </button>
          <button type="button" className={styles.boton} disabled={!url} onClick={() => void copiar("enlace")}>
            {copiado === "enlace" ? <Check className={styles.icono} aria-hidden /> : <Link2 className={styles.icono} aria-hidden />}
            Copiar enlace
          </button>
        </div>
      ) : null}

      <div role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
        {copiado === "codigo" ? "Código copiado" : copiado === "enlace" ? "Enlace copiado" : copiado === "error" ? "No se pudo copiar" : ""}
      </div>
    </section>
  );
}
