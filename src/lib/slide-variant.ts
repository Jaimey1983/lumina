export function getSlideVariant(background: string | undefined): 'dark' | 'light' {
  if (background === undefined || background.trim() === '') {
    return 'light';
  }

  const lower = background.toLowerCase();
  if (lower.includes('dark')) {
    return 'dark';
  }

  const hexMatch = background.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
  let r: number | undefined;
  let g: number | undefined;
  let b: number | undefined;

  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    const rgbMatch = background.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      r = Number(rgbMatch[1]);
      g = Number(rgbMatch[2]);
      b = Number(rgbMatch[3]);
    }
  }

  if (r === undefined || g === undefined || b === undefined) {
    return 'light';
  }

  const normalize = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const L = 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
  return L < 0.35 ? 'dark' : 'light';
}
