import type { WidgetSlideContent } from '@lumina/types/widget';
import { resolveSlideVisibilidad } from '@/components/widgets/shared/widget-slide-utils';

export {
  isOverlayLayout,
  isSplitLayout,
} from '@/components/widgets/shared/widget-layouts';
export {
  resolveTextPos as resolveTabTextPos,
  slideSelectionId as tabSelectionSlideId,
} from '@/components/widgets/shared/widget-slide-utils';
export type { WidgetSlideTextField as TabTextField } from '@lumina/types/widget';

import type { TabsConfiguracionCompleta, TabsSlideVisibilidad } from './tabs-config';

export function resolveTabSlideVisibilidad(
  configuracion: TabsConfiguracionCompleta,
  slide: WidgetSlideContent,
): TabsSlideVisibilidad {
  return resolveSlideVisibilidad(configuracion.defaultsSlide, slide);
}
