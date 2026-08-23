import type { WidgetSlideContent } from '@/types/widget.types';
import { resolveSlideVisibilidad } from '@/components/widgets/shared/widget-slide-utils';

export {
  isOverlayLayout,
  isSplitLayout,
} from '@/components/widgets/shared/widget-layouts';
export {
  resolveTextPos as resolveTabTextPos,
  slideSelectionId as tabSelectionSlideId,
} from '@/components/widgets/shared/widget-slide-utils';
export type { WidgetSlideTextField as TabTextField } from '@/types/widget.types';

import type { TabsConfiguracionCompleta, TabsSlideVisibilidad } from './tabs-config';

export function resolveTabSlideVisibilidad(
  configuracion: TabsConfiguracionCompleta,
  slide: WidgetSlideContent,
): TabsSlideVisibilidad {
  return resolveSlideVisibilidad(configuracion.defaultsSlide, slide);
}
