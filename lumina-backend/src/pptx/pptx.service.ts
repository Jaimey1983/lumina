import { Injectable, BadRequestException } from '@nestjs/common'
const PizZip = require('pizzip');
import { parseStringPromise } from 'xml2js'

// ── Constantes de conversión ──────────────────────────────────────────────────

// Dimensiones estándar de un slide PowerPoint en EMU
const PPT_WIDTH_EMU  = 9144000   // 10 pulgadas = 1280px en Lumina
const PPT_HEIGHT_EMU = 5143500   // 7.5 pulgadas = 720px en Lumina

// Convierte EMU a porcentaje del slide (0-100)
function emuToXPct(emu: number): number {
  return Math.round((emu / PPT_WIDTH_EMU)  * 100 * 10) / 10
}
function emuToYPct(emu: number): number {
  return Math.round((emu / PPT_HEIGHT_EMU) * 100 * 10) / 10
}

// Extrae número de una cadena EMU (puede venir como string o number)
function parseEmu(val: unknown): number {
  const n = parseInt(String(val ?? '0'), 10)
  return isNaN(n) ? 0 : n
}

// Convierte puntos (pt) a px aproximado para fontSize de Lumina
function ptToPx(pt: number): number {
  return Math.round(pt * 1.333)
}

// Extrae tamaño de fuente en pt desde el XML (viene como centésimas de punto)
function parseFontSize(val: unknown): number {
  const n = parseInt(String(val ?? '1800'), 10)
  return Math.round(n / 100)  // centésimas de punto → puntos
}

// Extrae color hex desde atributo XML (ej: "FF0000" → "#FF0000")
function parseColor(val: unknown): string {
  const s = String(val ?? '').replace('#', '')
  return s.length === 6 ? `#${s}` : '#1a1a1a'
}

// ── Tipos de salida ───────────────────────────────────────────────────────────

interface LuminaBlock {
  tipo: 'texto' | 'imagen'
  contenido?: string
  url?: string
  x: number
  y: number
  ancho: number
  alto: number
  tamanoFuente?: string
  negrita?: boolean
  cursiva?: boolean
  color?: string
  alineacion?: 'izquierda' | 'centro' | 'derecha'
  ajuste?: string
  zIndex: number
}

export interface LuminaSlideImportado {
  titulo: string
  bloques: LuminaBlock[]
  fondo: { tipo: 'color'; valor: string }
  layout: string
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class PptxService {

  async importPptx(buffer: Buffer): Promise<LuminaSlideImportado[]> {
    let zip: any
    try {
      zip = new PizZip(buffer)
    } catch {
      throw new BadRequestException('El archivo no es un .pptx válido')
    }

    // Leer el número de slides desde [Content_Types].xml
    const contentTypesXml = zip.file('[Content_Types].xml')?.asText()
    if (!contentTypesXml) throw new BadRequestException('Archivo .pptx corrupto')

    const contentTypes = await parseStringPromise(contentTypesXml)
    const overrides: any[] = contentTypes?.Types?.Override ?? []
    const slidePartNames = overrides
      .filter((o: any) => (o?.$?.ContentType ?? '').includes('slide+xml'))
      .map((o: any) => o?.$?.PartName ?? '')
      .filter(Boolean)
      .sort()  // ppt/slides/slide1.xml, slide2.xml, etc.

    if (!slidePartNames.length) {
      throw new BadRequestException('No se encontraron slides en el archivo')
    }

    const slides: LuminaSlideImportado[] = []

    for (const partName of slidePartNames) {
      // partName = "/ppt/slides/slide1.xml" → "ppt/slides/slide1.xml"
      const relativePath = partName.replace(/^\//, '')
      const slideXml = zip.file(relativePath)?.asText()
      if (!slideXml) continue

      try {
        const slide = await this.parseSlide(slideXml, zip, relativePath)
        slides.push(slide)
      } catch {
        // Si un slide falla, continuar con los demás
        slides.push({
          titulo: `Slide ${slides.length + 1}`,
          bloques: [],
          fondo: { tipo: 'color', valor: '#ffffff' },
          layout: 'en_blanco',
        })
      }
    }

    return slides
  }

  private async parseSlide(
    slideXml: string,
    zip: any,
    slidePath: string,
  ): Promise<LuminaSlideImportado> {
    const parsed = await parseStringPromise(slideXml, { explicitArray: true })
    const spTree = parsed?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0]

    const bloques: LuminaBlock[] = []
    let zIndex = 1

    // ── Extraer formas de texto (sp) ─────────────────────────────────────────
    const shapes: any[] = spTree?.['p:sp'] ?? []
    for (const sp of shapes) {
      const spPr = sp?.['p:spPr']?.[0]
      const txBody = sp?.['p:txBody']?.[0]

      if (!spPr || !txBody) continue

      // Posición y tamaño
      const xfrm = spPr?.['a:xfrm']?.[0]
      if (!xfrm) continue

      const offX = parseEmu(xfrm?.['a:off']?.[0]?.['$']?.x)
      const offY = parseEmu(xfrm?.['a:off']?.[0]?.['$']?.y)
      const extCx = parseEmu(xfrm?.['a:ext']?.[0]?.['$']?.cx)
      const extCy = parseEmu(xfrm?.['a:ext']?.[0]?.['$']?.cy)

      const x = emuToXPct(offX)
      const y = emuToYPct(offY)
      const ancho = emuToXPct(extCx)
      const alto = emuToYPct(extCy)

      // Ignorar bloques fuera del slide o de tamaño cero
      if (ancho < 1 || alto < 1) continue
      if (x > 100 || y > 100) continue

      // Extraer texto de todos los párrafos
      const parrafos: any[] = txBody?.['a:p'] ?? []
      const lineas: string[] = []
      let tamanoFuente = 18
      let negrita = false
      let cursiva = false
      let color = '#1a1a1a'
      let alineacion: 'izquierda' | 'centro' | 'derecha' = 'izquierda'

      for (const p of parrafos) {
        // Alineación del párrafo
        const pPr = p?.['a:pPr']?.[0]
        const algn = pPr?.['$']?.algn
        if (algn === 'ctr') alineacion = 'centro'
        else if (algn === 'r') alineacion = 'derecha'

        const runs: any[] = p?.['a:r'] ?? []
        const textoDePar = runs.map((r: any) => {
          const rPr = r?.['a:rPr']?.[0]
          if (rPr) {
            const sz = rPr?.['$']?.sz
            if (sz) tamanoFuente = ptToPx(parseFontSize(sz))
            if (rPr?.['$']?.b === '1') negrita = true
            if (rPr?.['$']?.i === '1') cursiva = true
            const solidFill = rPr?.['a:solidFill']?.[0]?.['a:srgbClr']?.[0]?.['$']?.val
            if (solidFill) color = parseColor(solidFill)
          }
          return r?.['a:t']?.[0] ?? ''
        }).join('')

        if (textoDePar.trim()) lineas.push(textoDePar)
      }

      const contenido = lineas.join('\n')
      if (!contenido.trim()) continue

      bloques.push({
        tipo: 'texto',
        contenido,
        x: Math.max(0, x),
        y: Math.max(0, y),
        ancho: Math.min(100, ancho),
        alto: Math.min(100, alto),
        tamanoFuente: `${tamanoFuente}px`,
        negrita,
        cursiva,
        color,
        alineacion,
        zIndex: zIndex++,
      })
    }

    // ── Extraer imágenes (pic) ────────────────────────────────────────────────
    const pics: any[] = spTree?.['p:pic'] ?? []
    for (const pic of pics) {
      const spPr = pic?.['p:spPr']?.[0]
      const blipFill = pic?.['p:blipFill']?.[0]

      if (!spPr || !blipFill) continue

      const xfrm = spPr?.['a:xfrm']?.[0]
      if (!xfrm) continue

      const offX = parseEmu(xfrm?.['a:off']?.[0]?.['$']?.x)
      const offY = parseEmu(xfrm?.['a:off']?.[0]?.['$']?.y)
      const extCx = parseEmu(xfrm?.['a:ext']?.[0]?.['$']?.cx)
      const extCy = parseEmu(xfrm?.['a:ext']?.[0]?.['$']?.cy)

      const x = emuToXPct(offX)
      const y = emuToYPct(offY)
      const ancho = emuToXPct(extCx)
      const alto = emuToYPct(extCy)

      if (ancho < 1 || alto < 1) continue

      // Obtener referencia a la imagen en el zip
      const rId = blipFill?.['a:blip']?.[0]?.['$']?.['r:embed']
      if (!rId) continue

      // Resolver la ruta de la imagen desde el archivo .rels
      const slideDir = slidePath.substring(0, slidePath.lastIndexOf('/'))
      const relsPath = `${slideDir}/_rels/${slidePath.substring(slidePath.lastIndexOf('/') + 1)}.rels`
      const relsXml = zip.file(relsPath)?.asText()
      if (!relsXml) continue

      const rels = await parseStringPromise(relsXml)
      const relationships: any[] = rels?.Relationships?.Relationship ?? []
      const rel = relationships.find((r: any) => r?.['$']?.Id === rId)
      if (!rel) continue

      const targetRel = rel?.['$']?.Target ?? ''
      // Target puede ser relativo: "../media/image1.png"
      const imagePath = targetRel.startsWith('/')
        ? targetRel.replace(/^\//, '')
        : `ppt/slides/${targetRel}`.replace(/\/[^/]+\/\.\.\//g, '/')

      const imageFile = zip.file(imagePath)
      if (!imageFile) continue

      // Convertir imagen a base64 data URL
      const imageBuffer = imageFile.asNodeBuffer()
      const ext = imagePath.split('.').pop()?.toLowerCase() ?? 'png'
      const mimeMap: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
      }
      const mime = mimeMap[ext] ?? 'image/png'
      const base64 = imageBuffer.toString('base64')
      const dataUrl = `data:${mime};base64,${base64}`

      bloques.push({
        tipo: 'imagen',
        url: dataUrl,
        x: Math.max(0, x),
        y: Math.max(0, y),
        ancho: Math.min(100, ancho),
        alto: Math.min(100, alto),
        ajuste: 'contener',
        zIndex: zIndex++,
      })
    }

    // ── Fondo ─────────────────────────────────────────────────────────────────
    const bg = parsed?.['p:sld']?.['p:cSld']?.[0]?.['p:bg']?.[0]
    let fondoColor = '#ffffff'
    const solidFillBg = bg?.['p:bgPr']?.[0]?.['a:solidFill']?.[0]?.['a:srgbClr']?.[0]?.['$']?.val
    if (solidFillBg) fondoColor = parseColor(solidFillBg)

    // ── Determinar layout ─────────────────────────────────────────────────────
    // Heurística: si hay 1 bloque de texto grande → titulo_centrado
    // Si hay texto izq + imagen der → imagen_derecha
    // Si hay 2 columnas de texto → dos_columnas
    // Por defecto → en_blanco (posicionamiento libre)
    let layout = 'en_blanco'
    const textBloques = bloques.filter(b => b.tipo === 'texto')
    const imgBloques  = bloques.filter(b => b.tipo === 'imagen')

    if (textBloques.length === 1 && imgBloques.length === 0) {
      layout = 'titulo_centrado'
    } else if (textBloques.length >= 1 && imgBloques.length >= 1) {
      const img = imgBloques[0]!
      layout = img.x > 50 ? 'imagen_derecha' : 'imagen_izquierda'
    } else if (textBloques.length === 2 && imgBloques.length === 0) {
      layout = 'dos_columnas'
    } else if (textBloques.length >= 2) {
      layout = 'titulo_y_contenido'
    }

    // Título del slide: primer bloque de texto más grande o el de y más pequeño
    const titulo = textBloques.sort((a, b) => a.y - b.y)[0]?.contenido?.split('\n')[0] ?? 'Slide importado'

    return {
      titulo: titulo.slice(0, 80),
      bloques,
      fondo: { tipo: 'color', valor: fondoColor },
      layout,
    }
  }
}
