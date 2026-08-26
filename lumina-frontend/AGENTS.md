<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Contratos del editor de canvas (obligatorio)

Antes de modificar el editor de clases, canvas, bloques o historial undo, lee **`.cursorrules`** en esta carpeta (sección «Contratos del editor»).

Regla de oro: **leer (`getBlockPos`) → transformar → clamp → persistir → historial**.

En el monorepo raíz también aplica `.cursor/rules/lumina-canvas-editor-contracts.mdc` al editar archivos bajo `lumina-frontend/`.
