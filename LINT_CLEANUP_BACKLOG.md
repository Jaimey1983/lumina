# Backlog de limpieza de lint (Regla 9 de AGENTS.md)

Listas exactas para el reparto de trabajo entre Claude Code, Cursor y Antigravity. Ver `AGENTS.md` → "Reparto activo — limpieza de lint" para el protocolo y el estado de cada cluster.

**Antes de tocar un archivo de esta lista:** marcar la fila correspondiente en `AGENTS.md` como `[en curso: <herramienta>]` y commitear ese cambio primero.

## Backend — cola larga (asignado a Antigravity, ~34 casos)

```
lumina-backend/src/ai-features/ai-crypto.ts
lumina-backend/src/ai-features/ai-providers.spec.ts
lumina-backend/src/ai-features/ai-providers.ts
lumina-backend/src/auth/auth.service.spec.ts
lumina-backend/src/classes/classes.gateway.ts
lumina-backend/src/classes/classes.service.transaction.spec.ts
lumina-backend/src/classes/dto/update-class.dto.ts
lumina-backend/src/common/sanitize-json-for-storage.ts
lumina-backend/src/courses/dto/enroll-student.dto.ts
lumina-backend/src/live-sessions/live-sessions.gateway.ts
lumina-backend/src/progress-map/progress-map.logic.ts
lumina-backend/src/progress-map/progress-map.service.ts
lumina-backend/src/superadmin/dto/create-invitation-code.dto.ts
lumina-backend/src/superadmin/dto/create-trusted-domain.dto.ts
lumina-backend/src/superadmin/dto/list-audit-logs-query.dto.ts
lumina-backend/src/superadmin/dto/list-users-query.dto.ts
lumina-backend/src/superadmin/dto/reject-verification.dto.ts
```

## Frontend — cola larga (asignado a Antigravity, ~53 archivos)

```
lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/quiz/quiz-multiple-editor.tsx
lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/quiz/quiz-multiple-viewer.tsx
lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/quiz/quiz-synced-panel.tsx
lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/true-false.tsx
lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/use-video-interactive-runtime.ts
lumina-frontend/src/app/(app)/classes/[id]/editor/components/panels/images-element-panel.tsx
lumina-frontend/src/app/(app)/classes/[id]/editor/components/panels/properties-panel.tsx
lumina-frontend/src/app/(app)/classes/[id]/editor/components/slides-panel.tsx
lumina-frontend/src/app/(app)/classes/[id]/editor/editor-client.tsx
lumina-frontend/src/app/(app)/classes/[id]/editor/lib/canvas-history.spec.ts
lumina-frontend/src/app/(app)/classes/[id]/escape-room/escape-room-designer-client.tsx
lumina-frontend/src/app/(app)/classes/classes-client.tsx
lumina-frontend/src/app/(app)/courses/[id]/course-detail-client.tsx
lumina-frontend/src/app/(app)/courses/courses-client.tsx
lumina-frontend/src/app/(app)/dashboard/dashboard-client.tsx
lumina-frontend/src/app/(app)/join/[codigo]/join-client.tsx
lumina-frontend/src/app/(app)/profile/profile-client.tsx
lumina-frontend/src/app/(auth)/layout.tsx
lumina-frontend/src/components/activities/abrir-caja/abrir-caja-viewer.tsx
lumina-frontend/src/components/activities/ahorcado/ahorcado-editor.tsx
lumina-frontend/src/components/activities/ahorcado/ahorcado-properties.tsx
lumina-frontend/src/components/activities/ahorcado/ahorcado-viewer.tsx
lumina-frontend/src/components/activities/anagrama/anagrama-editor.tsx
lumina-frontend/src/components/activities/anagrama/anagrama-viewer.tsx
lumina-frontend/src/components/activities/emparejar/emparejar-properties.tsx
lumina-frontend/src/components/activities/emparejar/emparejar-shared.tsx
lumina-frontend/src/components/activities/globos/globos-editor.tsx
lumina-frontend/src/components/activities/globos/globos-properties.tsx
lumina-frontend/src/components/activities/globos/globos-viewer.tsx
lumina-frontend/src/components/activities/historia-ramificada/historia-ramificada-properties.tsx
lumina-frontend/src/components/activities/historia-ramificada/historia-ramificada-viewer.tsx
lumina-frontend/src/components/activities/puzzle-imagen/puzzle-imagen-properties.tsx
lumina-frontend/src/components/activities/puzzle-imagen/puzzle-imagen-viewer.tsx
lumina-frontend/src/components/activities/puzzle-palabras/puzzle-palabras-editor.tsx
lumina-frontend/src/components/activities/puzzle-palabras/puzzle-palabras-viewer.tsx
lumina-frontend/src/components/activities/shared/activity-timer.tsx
lumina-frontend/src/components/activities/topo/topo-editor.tsx
lumina-frontend/src/components/activities/topo/topo-viewer.tsx
lumina-frontend/src/components/diagramas/diagrama-editor.tsx
lumina-frontend/src/components/editor/activities/escape-room-editor.tsx
lumina-frontend/src/components/editor/import-pptx-modal.tsx
lumina-frontend/src/components/editor/panels/torneo-panel.tsx
lumina-frontend/src/components/graficos/grafico-properties.tsx
lumina-frontend/src/components/layout/sidebar.tsx
lumina-frontend/src/components/widgets/click-reveal/click-reveal-config.ts
lumina-frontend/src/components/widgets/hotspot/hotspot-config.ts
lumina-frontend/src/components/widgets/hotspot/hotspot-viewer.tsx
lumina-frontend/src/components/widgets/popup/popup-parts.tsx
lumina-frontend/src/components/widgets/shared/widget-identity.ts
lumina-frontend/src/components/widgets/timeline/timeline-variant-meta.ts
lumina-frontend/src/components/widgets/tooltip/tooltip-parts.tsx
lumina-frontend/src/hooks/use-block-drag.spec.ts
lumina-frontend/src/lib/slide-themes.ts
```

Nota: dos de estos (`popup-parts.tsx`, `tooltip-parts.tsx`) traen además un warning `react-hooks/static-components` — no tocar esa parte puntual, es del mismo cluster reservado de abajo aunque el archivo tenga también un `no-unused-vars` suelto que sí se puede arreglar.

## Reservado para la Etapa 5 — NO tocar todavía

Motor del canvas, unificación de estado. Corregir esto ahora es más riesgo que beneficio (ver `AGENTS.md`):

```
lumina-frontend/src/app/(app)/classes/[id]/editor/components/canvas-area.tsx
lumina-frontend/src/app/(app)/classes/[id]/editor/components/panels/flyout-left-panels.tsx
lumina-frontend/src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx
lumina-frontend/src/components/diagramas/diagrama-properties.tsx
lumina-frontend/src/components/widgets/timeline/timeline-editor.tsx
lumina-frontend/src/components/widgets/timeline/timeline-node-layouts.tsx
lumina-frontend/src/components/widgets/timeline/timeline-node-primitives.tsx
```

## Asignado a Cursor (68 casos, código sensible de notas)

```
lumina-backend/src/classes/activity-scoring.ts
lumina-backend/src/autonomous-sessions/autonomous-sessions.controller.ts
lumina-backend/src/autonomous-sessions/autonomous-sessions.service.ts
```

## Asignado a Claude Code (en curso, 117 casos)

```
lumina-backend/src/pptx/pptx.service.ts
```
