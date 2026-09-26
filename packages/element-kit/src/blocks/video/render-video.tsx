'use client';

import type { VideoBlock } from '@lumina/types/slide';

export function buildEmbedUrl(url: string, autoplay?: boolean): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    const params = new URLSearchParams({ ...(autoplay ? { autoplay: '1' } : {}) });
    return `https://www.youtube.com/embed/${videoId}${params.size ? `?${params}` : ''}`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    const params = new URLSearchParams({ ...(autoplay ? { autoplay: '1' } : {}) });
    return `https://player.vimeo.com/video/${videoId}${params.size ? `?${params}` : ''}`;
  }
  return url;
}

export interface RenderVideoProps {
  block: VideoBlock;
  editorMode?: boolean;
}

export function RenderVideo({
  block,
  editorMode = false,
}: RenderVideoProps) {
  const isYoutube = block.url.includes('youtube') || block.url.includes('youtu.be');

  if (isYoutube) {
    const src = buildEmbedUrl(block.url, block.autoplay);
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <iframe
          src={src}
          title="Video YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            pointerEvents: editorMode ? 'none' : undefined,
          }}
        />
        {editorMode && (
          <div
            aria-hidden
            style={{ position: 'absolute', inset: 0, cursor: 'inherit' }}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        src={block.url}
        controls={block.controles ?? true}
        autoPlay={block.autoplay}
        loop={block.bucle}
        muted={block.silenciado}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: editorMode ? 'none' : undefined,
        }}
      />
      {editorMode && (
        <div
          aria-hidden
          style={{ position: 'absolute', inset: 0, cursor: 'inherit' }}
        />
      )}
    </div>
  );
}
