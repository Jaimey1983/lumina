function parseHexColors(background: string): Array<{ r: number; g: number; b: number }> {
  const colors: Array<{ r: number; g: number; b: number }> = [];
  const hexMatches = background.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g);
  for (const match of hexMatches) {
    let hex = match[1];
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    colors.push({
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    });
  }
  if (colors.length > 0) return colors;

  const rgbMatches = background.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g);
  for (const match of rgbMatches) {
    colors.push({
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
    });
  }
  return colors;
}

function relativeLuminance(r: number, g: number, b: number): number {
  const normalize = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
}

export function getSlideVariant(background: string | undefined): 'dark' | 'light' {
  if (background === undefined || background.trim() === '') {
    return 'light';
  }

  const lower = background.toLowerCase();
  if (lower.includes('dark')) {
    return 'dark';
  }

  const colors = parseHexColors(background);
  if (colors.length === 0) {
    return 'light';
  }

  const avgL =
    colors.reduce((sum, c) => sum + relativeLuminance(c.r, c.g, c.b), 0) / colors.length;
  return avgL < 0.35 ? 'dark' : 'light';
}
