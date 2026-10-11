import type { ReactElement } from "react";
import { PresetGallery, aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { WidgetSectionTitle } from "@lumina/editor-shared/widget-properties-panel";
import { Button } from "@lumina/ui/button";
import { Checkbox } from "@lumina/ui/checkbox";
import { Input } from "@lumina/ui/input";
import { Label } from "@lumina/ui/label";
import { Slider, SliderThumb } from "@lumina/ui/slider";
import { presetsDelWidget } from "../widget-presets.js";
import {
  QR_CODIGO_MAX,
  QR_MARGEN_MAX,
  QR_NIVELES,
  QR_TAMANOS,
  limpiarCodigo,
  normalizarOrigen,
  normalizeQrSesionWidget,
  urlDeUnion,
} from "./qr-sesion-defaults.js";
import type { QrSesionConfiguracion, QrSesionEstado } from "./qr-sesion-types.js";

export interface QrSesionPropertiesProps {
  estado: QrSesionEstado;
  onChange: (estado: QrSesionEstado) => void;
}

export function QrSesionProperties({ estado: crudo, onChange }: QrSesionPropertiesProps): ReactElement {
  const estado = normalizeQrSesionWidget(crudo);
  const cfg = estado.configuracion;
  const actualizar = (parche: Partial<QrSesionConfiguracion>) => onChange({ ...estado, configuracion: { ...cfg, ...parche } });
  const origenInvalido = cfg.origen === "personalizado" && cfg.origenPersonalizado === "";
  const ejemplo = urlDeUnion(cfg.origen === "personalizado" && cfg.origenPersonalizado ? cfg.origenPersonalizado : "https://tu-dominio", cfg.codigo || "CODIGO");

  return (
    <div className="flex flex-col gap-5">
      <PresetGallery
        presets={presetsDelWidget("qr-sesion")}
        estado={estado}
        storageKey="widget.qr-sesion.estilos"
        onSelect={(preset) => onChange(aplicarPreset(estado, preset))}
      />

      <div className="space-y-2">
        <WidgetSectionTitle>Código de la clase</WidgetSectionTitle>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="qr-codigo">Código</Label>
          <Input
            id="qr-codigo"
            className="h-8 font-mono text-xs"
            maxLength={QR_CODIGO_MAX}
            value={cfg.codigo}
            placeholder="Código de unión de la clase"
            onChange={(e) => actualizar({ codigo: limpiarCodigo(e.target.value) })}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Escríbelo a mano: el reproductor todavía no entrega el código de la sesión a los widgets.
          Solo se admiten letras, números, guion y guion bajo. Quien vea este slide podrá unirse con él.
        </p>
        <p className="break-all text-[11px] text-muted-foreground" data-testid="qr-ejemplo">
          Enlace: {ejemplo}
        </p>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Dirección</WidgetSectionTitle>
        <div className="flex gap-1">
          {(["automatico", "personalizado"] as const).map((o) => (
            <Button key={o} type="button" size="sm" variant={cfg.origen === o ? "primary" : "outline"} className="h-8 flex-1 text-xs" aria-pressed={cfg.origen === o} onClick={() => actualizar({ origen: o })}>
              {o === "automatico" ? "La de esta página" : "Otra dirección"}
            </Button>
          ))}
        </div>
        {cfg.origen === "personalizado" ? (
          <div className="space-y-1.5">
            <Input
              className="h-8 text-xs"
              aria-label="Dirección del sitio"
              aria-invalid={origenInvalido || undefined}
              placeholder="https://tu-dominio.edu"
              defaultValue={cfg.origenPersonalizado}
              onChange={(e) => actualizar({ origenPersonalizado: normalizarOrigen(e.target.value) ?? "" })}
            />
            {origenInvalido ? <p className="text-[11px] font-medium text-amber-800">Escribe una dirección http(s) válida; mientras tanto se usa la de esta página.</p> : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Código QR</WidgetSectionTitle>
        <div className="space-y-1.5">
          <Label className="text-xs">Tamaño</Label>
          <div className="flex gap-1">
            {QR_TAMANOS.map((t) => (
              <Button key={t.id} type="button" size="sm" variant={cfg.tamano === t.id ? "primary" : "outline"} className="h-8 flex-1 text-xs" aria-pressed={cfg.tamano === t.id} onClick={() => actualizar({ tamano: t.id })}>
                {t.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Corrección de errores</Label>
          <div className="flex gap-1">
            {QR_NIVELES.map((n) => (
              <Button key={n.id} type="button" size="sm" variant={cfg.nivel === n.id ? "primary" : "outline"} className="h-8 flex-1 text-xs" aria-pressed={cfg.nivel === n.id} title={n.ayuda} aria-label={`Nivel ${n.id}: ${n.ayuda}`} onClick={() => actualizar({ nivel: n.id })}>
                {n.label}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">{QR_NIVELES.find((n) => n.id === cfg.nivel)?.ayuda}</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Margen: {cfg.margen} módulos</Label>
          <Slider min={0} max={QR_MARGEN_MAX} step={1} value={[cfg.margen]} onValueChange={([v]) => actualizar({ margen: v })}>
            <SliderThumb />
          </Slider>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Colores</Label>
          <div className="flex gap-1">
            {(["alto", "tema"] as const).map((c) => (
              <Button key={c} type="button" size="sm" variant={cfg.contraste === c ? "primary" : "outline"} className="h-8 flex-1 text-xs" aria-pressed={cfg.contraste === c} onClick={() => actualizar({ contraste: c })}>
                {c === "alto" ? "Negro sobre blanco" : "Colores del tema"}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Con los colores del tema, comprueba que el QR se lea: un texto claro sobre fondo oscuro
            se invierte y algunas cámaras no lo reconocen.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Textos y botones</WidgetSectionTitle>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="qr-ayuda">Texto sobre el QR</Label>
          <Input id="qr-ayuda" className="h-8 text-xs" maxLength={80} value={cfg.textoAyuda} onChange={(e) => actualizar({ textoAyuda: e.target.value })} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.mostrarCodigo} onCheckedChange={(v) => actualizar({ mostrarCodigo: v === true })} />
          Mostrar el código en letra grande
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.mostrarUrl} onCheckedChange={(v) => actualizar({ mostrarUrl: v === true })} />
          Mostrar el enlace
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.botonCopiar} onCheckedChange={(v) => actualizar({ botonCopiar: v === true })} />
          Botones «Copiar código» y «Copiar enlace»
        </label>
      </div>
    </div>
  );
}
