'use client';

import { useMemo, type ReactNode } from 'react';
import {
  RichTextAiProvider,
  type RichTextAiBridge,
} from '@lumina/editor-shared/rich-text';
import { useTextAssist } from '@/hooks/api/use-ai';
import { useAuth } from '@/hooks/use-auth';

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
  const { user } = useAuth();
  const { mutateAsync } = useTextAssist();
  const isStudent = user?.role === 'STUDENT';

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

  if (isStudent) {
    return <>{children}</>;
  }

  return <RichTextAiProvider value={value}>{children}</RichTextAiProvider>;
}
