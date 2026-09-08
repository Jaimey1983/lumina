export type FontCategory =
  | 'sans-serif'
  | 'serif'
  | 'display'
  | 'handwriting'
  | 'monospace'
  | 'system'

export interface FontEntry {
  nombre: string
  familia: string
  categoria: FontCategory
}

export const FONT_CATEGORY_ORDER: FontCategory[] = [
  'sans-serif',
  'serif',
  'display',
  'handwriting',
  'monospace',
  'system',
]

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  'sans-serif': 'Sans-serif',
  serif: 'Serif',
  display: 'Display',
  handwriting: 'Manuscrita',
  monospace: 'Monoespaciada',
  system: 'Sistema',
}

export const FONT_CATALOG: FontEntry[] = [
  // ── Sans-serif — legibles para contenido educativo ──────────────────────
  { nombre: 'Inter', familia: 'Inter', categoria: 'sans-serif' },
  { nombre: 'Plus Jakarta Sans', familia: 'Plus Jakarta Sans', categoria: 'sans-serif' },
  { nombre: 'Nunito', familia: 'Nunito', categoria: 'sans-serif' },
  { nombre: 'Nunito Sans', familia: 'Nunito Sans', categoria: 'sans-serif' },
  { nombre: 'Poppins', familia: 'Poppins', categoria: 'sans-serif' },
  { nombre: 'Raleway', familia: 'Raleway', categoria: 'sans-serif' },
  { nombre: 'Lato', familia: 'Lato', categoria: 'sans-serif' },
  { nombre: 'Open Sans', familia: 'Open Sans', categoria: 'sans-serif' },
  { nombre: 'Roboto', familia: 'Roboto', categoria: 'sans-serif' },
  { nombre: 'Source Sans 3', familia: 'Source Sans 3', categoria: 'sans-serif' },
  { nombre: 'Figtree', familia: 'Figtree', categoria: 'sans-serif' },
  { nombre: 'DM Sans', familia: 'DM Sans', categoria: 'sans-serif' },
  { nombre: 'Outfit', familia: 'Outfit', categoria: 'sans-serif' },
  { nombre: 'Barlow', familia: 'Barlow', categoria: 'sans-serif' },
  { nombre: 'Mulish', familia: 'Mulish', categoria: 'sans-serif' },

  // ── Serif — para documentos formales ────────────────────────────────────
  { nombre: 'Merriweather', familia: 'Merriweather', categoria: 'serif' },
  { nombre: 'Playfair Display', familia: 'Playfair Display', categoria: 'serif' },
  { nombre: 'Lora', familia: 'Lora', categoria: 'serif' },
  { nombre: 'PT Serif', familia: 'PT Serif', categoria: 'serif' },
  { nombre: 'Libre Baskerville', familia: 'Libre Baskerville', categoria: 'serif' },
  { nombre: 'Crimson Text', familia: 'Crimson Text', categoria: 'serif' },
  { nombre: 'EB Garamond', familia: 'EB Garamond', categoria: 'serif' },

  // ── Display — para títulos y portadas ───────────────────────────────────
  { nombre: 'Montserrat', familia: 'Montserrat', categoria: 'display' },
  { nombre: 'Oswald', familia: 'Oswald', categoria: 'display' },
  { nombre: 'Bebas Neue', familia: 'Bebas Neue', categoria: 'display' },
  { nombre: 'Righteous', familia: 'Righteous', categoria: 'display' },
  { nombre: 'Exo 2', familia: 'Exo 2', categoria: 'display' },
  { nombre: 'Abril Fatface', familia: 'Abril Fatface', categoria: 'display' },
  { nombre: 'Titan One', familia: 'Titan One', categoria: 'display' },

  // ── Handwriting — para slides creativos y primaria ─────────────────────
  { nombre: 'Caveat', familia: 'Caveat', categoria: 'handwriting' },
  { nombre: 'Pacifico', familia: 'Pacifico', categoria: 'handwriting' },
  { nombre: 'Satisfy', familia: 'Satisfy', categoria: 'handwriting' },
  { nombre: 'Dancing Script', familia: 'Dancing Script', categoria: 'handwriting' },
  { nombre: 'Indie Flower', familia: 'Indie Flower', categoria: 'handwriting' },
  { nombre: 'Kalam', familia: 'Kalam', categoria: 'handwriting' },

  // ── Monospace — para clases de programación ─────────────────────────────
  { nombre: 'JetBrains Mono', familia: 'JetBrains Mono', categoria: 'monospace' },
  { nombre: 'Fira Code', familia: 'Fira Code', categoria: 'monospace' },
  { nombre: 'Source Code Pro', familia: 'Source Code Pro', categoria: 'monospace' },
  { nombre: 'Space Mono', familia: 'Space Mono', categoria: 'monospace' },

  // ── Sistema — slides y temas anteriores al catálogo de Google ───────────
  { nombre: 'Georgia', familia: 'Georgia', categoria: 'system' },
  { nombre: 'Arial', familia: 'Arial', categoria: 'system' },
  { nombre: 'Courier New', familia: 'Courier New', categoria: 'system' },
]

export const FONT_DEFAULT = 'Plus Jakarta Sans'

/** Familias que el editor/viewer precarga. Plus Jakarta ya viene de next/font. */
export const FONT_CORE_FAMILIES = [
  'Inter',
  'Nunito',
  'Poppins',
  'Merriweather',
  'Playfair Display',
  'Montserrat',
] as const

const LIMITED_WEIGHT_FAMILIES = new Set([
  'Bebas Neue',
  'Abril Fatface',
  'Titan One',
  'Righteous',
  'Pacifico',
  'Satisfy',
  'Indie Flower',
])

/** Stacks CSS guardados por el selector viejo de 5 fuentes. */
const FONT_ALIASES: Record<string, string> = {
  'inter, system-ui, sans-serif': 'Inter',
  'georgia, serif': 'Georgia',
  '"playfair display", georgia, serif': 'Playfair Display',
  'playfair display, georgia, serif': 'Playfair Display',
  'arial, helvetica, sans-serif': 'Arial',
  '"courier new", monospace': 'Courier New',
  'courier new, monospace': 'Courier New',
}

export function fontsGroupedByCategory(): { categoria: FontCategory; label: string; fonts: FontEntry[] }[] {
  return FONT_CATEGORY_ORDER.map((categoria) => ({
    categoria,
    label: FONT_CATEGORY_LABELS[categoria],
    fonts: FONT_CATALOG.filter((f) => f.categoria === categoria),
  })).filter((group) => group.fonts.length > 0)
}

/** Resuelve un valor guardado (legacy o catálogo) al nombre de familia del catálogo. */
export function resolveFontFamily(stored?: string): string {
  if (!stored?.trim()) return FONT_DEFAULT
  const trimmed = stored.trim()
  const exact = FONT_CATALOG.find((f) => f.familia === trimmed)
  if (exact) return exact.familia

  const alias = FONT_ALIASES[trimmed.toLowerCase()]
  if (alias) return alias

  const primary = trimmed.split(',')[0]?.trim().replace(/^["']|["']$/g, '') ?? ''
  const byFamilia = FONT_CATALOG.find(
    (f) => f.familia.toLowerCase() === primary.toLowerCase(),
  )
  if (byFamilia) return byFamilia.familia
  const byNombre = FONT_CATALOG.find(
    (f) => f.nombre.toLowerCase() === primary.toLowerCase(),
  )
  if (byNombre) return byNombre.familia
  return FONT_DEFAULT
}

export function isSystemFont(familia: string): boolean {
  const entry = FONT_CATALOG.find((f) => f.familia === familia)
  return entry?.categoria === 'system' || familia === FONT_DEFAULT
}

export function allGoogleFontFamilies(): string[] {
  return FONT_CATALOG.filter((f) => f.categoria !== 'system' && f.familia !== FONT_DEFAULT).map(
    (f) => f.familia,
  )
}

export function weightsForFamily(familia: string): number[] {
  const entry = FONT_CATALOG.find((f) => f.familia === familia)
  if (!entry || entry.categoria === 'system' || familia === FONT_DEFAULT) return []
  if (LIMITED_WEIGHT_FAMILIES.has(familia)) return [400]
  return [400, 500, 700]
}

function googleFontFamilyParam(familia: string): string | null {
  const resolved = resolveFontFamily(familia)
  const weights = weightsForFamily(resolved)
  if (weights.length === 0) return null
  return `${resolved.replace(/ /g, '+')}:wght@${weights.join(';')}`
}

/** URL de Google Fonts. Sin argumentos = catálogo completo (sin sistema ni Plus Jakarta). */
export function buildGoogleFontsUrl(families?: string[]): string | null {
  const list = families?.length ? families : allGoogleFontFamilies()
  const params = [
    ...new Set(list.map(googleFontFamilyParam).filter((p): p is string => !!p)),
  ]
  if (params.length === 0) return null
  return `https://fonts.googleapis.com/css2?family=${params.join('&family=')}&display=swap`
}

export function collectFontFamiliesFromValue(value: unknown): string[] {
  const into = new Set<string>()
  walkFontFields(value, into)
  return [...into]
}

function walkFontFields(value: unknown, into: Set<string>): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    for (const item of value) walkFontFields(item, into)
    return
  }
  const rec = value as Record<string, unknown>
  if (typeof rec.fuente === 'string') into.add(resolveFontFamily(rec.fuente))
  if (typeof rec.fontFamily === 'string') into.add(resolveFontFamily(rec.fontFamily))
  for (const nested of Object.values(rec)) walkFontFields(nested, into)
}
