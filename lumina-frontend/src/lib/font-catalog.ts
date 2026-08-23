export interface FontEntry {
  nombre: string      // Nombre para mostrar en el selector
  familia: string     // Nombre exacto en Google Fonts (para CSS font-family)
  categoria: 'serif' | 'sans-serif' | 'display' | 'monospace' | 'handwriting'
}

export const FONT_CATALOG: FontEntry[] = [
  // ── Sans-serif — legibles para contenido educativo ──────────────────────
  { nombre: 'Inter',           familia: 'Inter',           categoria: 'sans-serif' },
  { nombre: 'Plus Jakarta Sans', familia: 'Plus Jakarta Sans', categoria: 'sans-serif' },
  { nombre: 'Nunito',          familia: 'Nunito',          categoria: 'sans-serif' },
  { nombre: 'Nunito Sans',     familia: 'Nunito Sans',     categoria: 'sans-serif' },
  { nombre: 'Poppins',         familia: 'Poppins',         categoria: 'sans-serif' },
  { nombre: 'Raleway',         familia: 'Raleway',         categoria: 'sans-serif' },
  { nombre: 'Lato',            familia: 'Lato',            categoria: 'sans-serif' },
  { nombre: 'Open Sans',       familia: 'Open Sans',       categoria: 'sans-serif' },
  { nombre: 'Roboto',          familia: 'Roboto',          categoria: 'sans-serif' },
  { nombre: 'Source Sans 3',   familia: 'Source Sans 3',   categoria: 'sans-serif' },
  { nombre: 'Figtree',         familia: 'Figtree',         categoria: 'sans-serif' },
  { nombre: 'DM Sans',         familia: 'DM Sans',         categoria: 'sans-serif' },
  { nombre: 'Outfit',          familia: 'Outfit',          categoria: 'sans-serif' },
  { nombre: 'Barlow',          familia: 'Barlow',          categoria: 'sans-serif' },
  { nombre: 'Mulish',          familia: 'Mulish',          categoria: 'sans-serif' },

  // ── Serif — para documentos formales ────────────────────────────────────
  { nombre: 'Merriweather',    familia: 'Merriweather',    categoria: 'serif' },
  { nombre: 'Playfair Display', familia: 'Playfair Display', categoria: 'serif' },
  { nombre: 'Lora',            familia: 'Lora',            categoria: 'serif' },
  { nombre: 'PT Serif',        familia: 'PT Serif',        categoria: 'serif' },
  { nombre: 'Libre Baskerville', familia: 'Libre Baskerville', categoria: 'serif' },
  { nombre: 'Crimson Text',    familia: 'Crimson Text',    categoria: 'serif' },
  { nombre: 'EB Garamond',     familia: 'EB Garamond',     categoria: 'serif' },

  // ── Display — para títulos y portadas ───────────────────────────────────
  { nombre: 'Montserrat',      familia: 'Montserrat',      categoria: 'display' },
  { nombre: 'Oswald',          familia: 'Oswald',          categoria: 'display' },
  { nombre: 'Bebas Neue',      familia: 'Bebas Neue',      categoria: 'display' },
  { nombre: 'Righteous',       familia: 'Righteous',       categoria: 'display' },
  { nombre: 'Exo 2',           familia: 'Exo 2',           categoria: 'display' },
  { nombre: 'Abril Fatface',   familia: 'Abril Fatface',   categoria: 'display' },
  { nombre: 'Titan One',       familia: 'Titan One',       categoria: 'display' },

  // ── Handwriting — para slides creativos y primaria ─────────────────────
  { nombre: 'Caveat',          familia: 'Caveat',          categoria: 'handwriting' },
  { nombre: 'Pacifico',        familia: 'Pacifico',        categoria: 'handwriting' },
  { nombre: 'Satisfy',         familia: 'Satisfy',         categoria: 'handwriting' },
  { nombre: 'Dancing Script',  familia: 'Dancing Script',  categoria: 'handwriting' },
  { nombre: 'Indie Flower',    familia: 'Indie Flower',    categoria: 'handwriting' },
  { nombre: 'Kalam',           familia: 'Kalam',           categoria: 'handwriting' },

  // ── Monospace — para clases de programación ─────────────────────────────
  { nombre: 'JetBrains Mono',  familia: 'JetBrains Mono',  categoria: 'monospace' },
  { nombre: 'Fira Code',       familia: 'Fira Code',       categoria: 'monospace' },
  { nombre: 'Source Code Pro', familia: 'Source Code Pro', categoria: 'monospace' },
  { nombre: 'Space Mono',      familia: 'Space Mono',      categoria: 'monospace' },
]

// Familia por defecto del sistema
export const FONT_DEFAULT = 'Plus Jakarta Sans'

/** Resuelve un valor guardado (legacy o catálogo) al nombre de familia del catálogo. */
export function resolveFontFamily(stored?: string): string {
  if (!stored?.trim()) return FONT_DEFAULT
  const trimmed = stored.trim()
  const exact = FONT_CATALOG.find((f) => f.familia === trimmed)
  if (exact) return exact.familia
  const primary = trimmed.split(',')[0]?.trim().replace(/^["']|["']$/g, '') ?? ''
  const byFamilia = FONT_CATALOG.find((f) => f.familia === primary)
  if (byFamilia) return byFamilia.familia
  const byNombre = FONT_CATALOG.find((f) => f.nombre === primary)
  if (byNombre) return byNombre.familia
  return FONT_DEFAULT
}

// Construir el parámetro `family` para el link de Google Fonts
export function buildGoogleFontsUrl(): string {
  const families = FONT_CATALOG
    .map(f => `${f.familia.replace(/ /g, '+')}:wght@400;500;700`)
    .join('&family=')
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`
}
