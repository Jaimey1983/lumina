'use client';

import { useMemo, type ReactNode } from 'react';
import {
  RichTextAiProvider,
  type RichTextAiBridge,
} from '@lumina/editor-shared/rich-text';
import { useTextAssist } from '@/hooks/api/use-ai';

interface Props {
  slideTitle?: string;
  courseName?: string;
  nivelEducativo?: string;
  children: ReactNode;
}

/**
 * Conecta el `<RichTextEditor>` del canvas con `POST /ai/text-assist`. Sin este
 * proveedor el botón ✦ del bubble menu no aparece.
 */
export function RichTextAiBridgeProvider({
  slideTitle,
  courseName,
  nivelEducativo,
  children,
}: Props) {
  const { mutateAsync } = useTextAssist();

  const value = useMemo<RichTextAiBridge>(
    () => ({
      settingsHref: '/profile',
      assist: async (text, action, opts) => {
        const res = await mutateAsync({
          text,
          action,
          targetLang: opts?.targetLang,
          context:
            slideTitle || courseName || nivelEducativo
              ? { slideTitle, courseName, nivelEducativo }
              : undefined,
        });
        return res.result;
      },
    }),
    [mutateAsync, slideTitle, courseName, nivelEducativo],
  );

  return <RichTextAiProvider value={value}>{children}</RichTextAiProvider>;
}
