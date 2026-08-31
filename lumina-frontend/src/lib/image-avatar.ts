'use client';

/**
 * Procesado de imágenes de perfil en el navegador.
 *
 * El backend guarda `user.avatar` como un string (columna `text`, sin límite de
 * tamaño en Prisma). Para no inflar la BD ni el payload del `PATCH /users/:id`
 * la imagen se recorta a un cuadrado, se reescala a `size` px y se comprime a
 * WebP (o JPEG si el navegador no soporta WebP) antes de convertirla en data URL.
 *
 * Mismo patrón que el editor de slides, que embebe imágenes como data URL
 * (`readFileAsDataURL`). Aquí además se reescala para que el avatar pese ~15–40 KB.
 */

export interface AvatarProcessResult {
  /** `data:image/webp;base64,…` listo para enviar como `avatar`. */
  dataUrl: string;
  /** Tamaño aproximado del data URL en bytes. */
  bytes: number;
  /** MIME real del resultado (`image/webp` o `image/jpeg`). */
  type: string;
}

export interface AvatarProcessOptions {
  /** Lado del cuadrado de salida en px. Por defecto 256. */
  size?: number;
  /** Rechaza el archivo de entrada si supera este tamaño. Por defecto 10 MB. */
  maxInputBytes?: number;
  /** Intenta mantener la salida por debajo de este tamaño bajando calidad. Por defecto 180 KB. */
  targetBytes?: number;
  /** Tope duro: si tras comprimir sigue por encima, lanza error. Por defecto 400 KB. */
  hardMaxBytes?: number;
}

export const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

let webpSupport: boolean | null = null;

function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

/** Bytes aproximados de un data URL a partir de la longitud de su base64. */
function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
}

/**
 * Decodifica el archivo respetando la orientación EXIF cuando el navegador lo
 * soporta (`createImageBitmap` + `imageOrientation: 'from-image'`); si no,
 * cae a `<img>` + object URL.
 */
async function decodeImage(
  file: File,
): Promise<{ draw: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      } as ImageBitmapOptions);
      return {
        draw: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      /* fallback abajo */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      el.src = url;
    });
    return {
      draw: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Convierte un `File` de imagen en un data URL cuadrado, reescalado y comprimido,
 * apto para persistir en `user.avatar`.
 *
 * @throws Error con mensaje legible si el archivo no es válido o no se puede procesar.
 */
export async function fileToAvatarDataUrl(
  file: File,
  opts: AvatarProcessOptions = {},
): Promise<AvatarProcessResult> {
  const size = opts.size ?? 256;
  const maxInputBytes = opts.maxInputBytes ?? 10 * 1024 * 1024;
  const targetBytes = opts.targetBytes ?? 180 * 1024;
  const hardMaxBytes = opts.hardMaxBytes ?? 400 * 1024;

  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen (PNG, JPG, WebP o GIF).');
  }
  if (file.size > maxInputBytes) {
    throw new Error(
      `La imagen supera el límite de ${Math.round(maxInputBytes / 1024 / 1024)} MB.`,
    );
  }

  const { draw, width, height, release } = await decodeImage(file);

  try {
    if (!width || !height) {
      throw new Error('La imagen está vacía o dañada.');
    }

    const crop = Math.min(width, height);
    const sx = Math.max(0, (width - crop) / 2);
    const sy = Math.max(0, (height - crop) / 2);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la imagen en este navegador.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(draw, sx, sy, crop, crop, 0, 0, size, size);

    const mime = supportsWebp() ? 'image/webp' : 'image/jpeg';
    let quality = 0.85;
    let dataUrl = canvas.toDataURL(mime, quality);

    for (
      let i = 0;
      i < 5 && dataUrlBytes(dataUrl) > targetBytes && quality > 0.4;
      i++
    ) {
      quality = Math.max(0.4, quality - 0.12);
      dataUrl = canvas.toDataURL(mime, quality);
    }

    const bytes = dataUrlBytes(dataUrl);
    if (bytes > hardMaxBytes) {
      throw new Error(
        'No se pudo comprimir la imagen lo suficiente. Prueba con una foto más pequeña.',
      );
    }

    return { dataUrl, bytes, type: mime };
  } finally {
    release();
  }
}
