export type VideoProvider = 'youtube' | 'vimeo' | 'directo' | 'desconocido';

export interface NormalizedVideoSource {
  rawUrl: string;
  provider: VideoProvider;
  normalizedUrl: string;
  embedUrl: string | null;
  videoId: string | null;
}

function safeUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    try {
      return new URL(`https://${input}`);
    } catch {
      return null;
    }
  }
}

function extractYouTubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ?? null;
  }

  if (host.endsWith('youtube.com')) {
    const v = url.searchParams.get('v');
    if (v) return v;

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'embed' && parts[1]) return parts[1];
    if (parts[0] === 'shorts' && parts[1]) return parts[1];
    if (parts[0] === 'live' && parts[1]) return parts[1];
  }

  return null;
}

function extractVimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (!host.endsWith('vimeo.com')) return null;

  const parts = url.pathname.split('/').filter(Boolean);

  if (parts[0] === 'video' && parts[1] && /^\d+$/.test(parts[1])) return parts[1];

  const numeric = parts.find((segment) => /^\d+$/.test(segment));
  return numeric ?? null;
}

export function normalizeVideoSource(urlVideo: string, plataforma?: 'youtube' | 'vimeo' | 'directo'): NormalizedVideoSource {
  const rawUrl = (urlVideo ?? '').trim();
  if (!rawUrl) {
    return {
      rawUrl,
      provider: plataforma ?? 'desconocido',
      normalizedUrl: '',
      embedUrl: null,
      videoId: null,
    };
  }

  const parsed = safeUrl(rawUrl);

  if (plataforma === 'directo') {
    return {
      rawUrl,
      provider: 'directo',
      normalizedUrl: rawUrl,
      embedUrl: null,
      videoId: null,
    };
  }

  const youtubeId = parsed ? extractYouTubeId(parsed) : null;
  if (youtubeId || plataforma === 'youtube') {
    const id = youtubeId;
    return {
      rawUrl,
      provider: 'youtube',
      normalizedUrl: id ? `https://www.youtube.com/watch?v=${id}` : rawUrl,
      embedUrl: id ? `https://www.youtube.com/embed/${id}?rel=0&enablejsapi=1&modestbranding=1` : null,
      videoId: id,
    };
  }

  const vimeoId = parsed ? extractVimeoId(parsed) : null;
  if (vimeoId || plataforma === 'vimeo') {
    const id = vimeoId;
    return {
      rawUrl,
      provider: 'vimeo',
      normalizedUrl: id ? `https://vimeo.com/${id}` : rawUrl,
      embedUrl: id ? `https://player.vimeo.com/video/${id}` : null,
      videoId: id,
    };
  }

  if (parsed && (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'blob:')) {
    return {
      rawUrl,
      provider: 'directo',
      normalizedUrl: rawUrl,
      embedUrl: null,
      videoId: null,
    };
  }

  return {
    rawUrl,
    provider: 'desconocido',
    normalizedUrl: rawUrl,
    embedUrl: null,
    videoId: null,
  };
}
