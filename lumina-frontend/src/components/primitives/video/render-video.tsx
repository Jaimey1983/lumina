'use client';

import type { VideoBlock } from '@/types/slide.types';

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
  isThumbnail?: boolean;
  editorMode?: boolean;
}

export function RenderVideo({
  block,
  isThumbnail = false,
  editorMode = false,
}: RenderVideoProps) {
  const isYoutube = block.url.includes('youtube') || block.url.includes('youtu.be');

  if (isThumbnail) {
    if (isYoutube) {
      const ytMatch = block.url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      );
      const videoId = ytMatch?.[1];
      if (videoId) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://img.youtube.com/vi/${videoId}/0.jpg`}
            alt=""
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        );
      }
    }
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          width="28%"
          height="28%"
          fill="white"
          opacity={0.85}
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    );
  }

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
