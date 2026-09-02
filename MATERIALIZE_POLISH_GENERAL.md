# Extracción Materialize → Polish general de Lumina

> Generado: 01/09/2026
> Complementa a `MATERIALIZE_POLISH_EXTRACTION.md` (que cubre solo las 5
> actividades de Fase 4). Este documento amplía el análisis a **toda la app**.
>
> **Alcance de esta sesión: solo revisión.** No se modificó ningún archivo de
> `lumina-frontend` / `lumina-backend`, no se instaló ninguna dependencia, no se
> ejecutó git. El resultado es este documento.
>
> Carpeta revisada: `nextjs-version/typescript-version/full-version`
> (plantilla **Materialize MUI Next.js Admin** de Pixinvent).

---

## 0. Qué significa "reutilizar Materialize en Lumina"

| | Materialize (plantilla) | Lumina (`lumina-frontend`) |
|---|---|---|
| UI kit | **MUI 7** + Emotion + `styled()` + `theme.components` overrides | **shadcn/Radix** + Tailwind 4 + CVA, sobre base **Metronic Layout-11** |
| Estilo | `sx` / `styleOverrides` / CSS vars `--mui-palette-*` | utilidades Tailwind + `cn()` + CSS vars `--lumina-*` en `globals.css` |
| Tipografía | Inter | Plus Jakarta Sans |
| Primario | `#666CFF` (índigo) | `#2563EB` (azul) |
| Iconos | Remix Icon (`<i className="ri-*">`) | lucide-react |
| Toasts | react-toastify | Sonner |
| Tablas | TanStack Table + estilos MUI | TanStack Table + `data-grid*` (shadcn) |
| DnD | `@formkit/drag-and-drop` | `@dnd-kit` + `sortable`/`kanban` (shadcn) |

**No hay reutilización de código.** "Reutilizar Materialize" aquí = extraer su
**lenguaje visual**: tokens (radios, sombras, superficies, escala de opacidad
semántica), y sus **patrones de componente** (chip tonal, avatar `skin='light'`,
card con `shadow-md` + hover-lift, alert con icono en cuadrito, timeline con dots
tonales, tabla con header `#F5F5F7`, etc.) y aplicarlos con Tailwind/shadcn.

**Lo que NO se toca:** el layout Metronic (sidebar/header/toolbar), MUI como
dependencia (no se añade), Sonner (ya cubre react-toastify), la tipografía Plus
Jakarta Sans.

---

## 1. Lo que Lumina YA tomó de Materialize

`lumina-frontend/src/styles/globals.css` ya define una capa `--lumina-*` que es
Materialize casi literal:

| Token Lumina (`globals.css`) | Valor | Origen en la plantilla |
|---|---|---|
| `--lumina-radius-xs…2xl` | `2 / 4 / 6 / 10 / 12 / 16 px` | `theme/index.ts` → `shape.customBorderRadius` (`xs2 sm4 md6 lg8 xl10`) — Lumina subió `lg`/`xl` |
| `--lumina-shadow-xs…lg` | `0px 2px 6px … / 0px 6px 20px …` (negro neutro) | `theme/customShadows.ts` (misma geometría; Materialize tiñe de azul, Lumina no) |
| `--lumina-font-size-base` | `15px` (`sm .8125rem` / `md .9375rem` / `lg 1.125rem`) | `theme/typography.ts` (`fontSize: 13.125`, `body1 .9375rem`, `h5 1.125rem`) |
| `--lumina-table-header-bg` | `#F5F5F7` | `colorSchemes.ts` → `customColors.tableHeaderBg` (idéntico) |
| `--lumina-grey-light` | `#FAFAFA` | `customColors.greyLightBg` (idéntico) |
| `--lumina-divider` / `-strong` | `rgba(0,0,0,.07)` / `.12` | `colorSchemes.ts` → `divider` (`… / 0.12`) |
| comentario "escala Materialize" | — | explícito en el archivo |

**Conclusión:** la fundación ya existe. El "polish general" es (a) **terminar de
aplicar** esa capa donde todavía se usan valores crudos de shadcn/zinc/Tailwind,
(b) **añadir los patrones de componente** que faltan, y (c) **decidir dos
divergencias** (abajo).

---

## 2. Divergencias a decidir antes de tocar nada

### 2.1 — Color primario
Materialize: `#666CFF` índigo. Lumina: `#2563EB` azul (`--lumina-purple`,
`tailwind.config.ts` `lumina.purple`, topbar del editor `bg-[#2563EB]`).
→ **Recomendación: mantener `#2563EB`.** Es identidad de marca ya consolidada
(V41 §1). No migrar a `#666CFF`. Todos los patrones de abajo que citan
`primary.main` se traducen a `#2563EB`.

### 2.2 — Paleta semántica (success / warning / error / info)
Materialize (vibrante): `success #72E128 · warning #FDB528 · error #FF4D49 · info #26C6F9`.
Lumina hoy (`globals.css`): `success #34d399 · warning #fbbf24 · danger #f87171`
(Tailwind emerald/amber/red-400) y en las actividades usa `#16a34a` / `#dc2626`.
→ **Recomendación: mantener la familia Tailwind de Lumina**, pero **congelar un
solo valor por rol** (hoy conviven `#34d399`, `#16a34a`, `green-50`, `green-800`…).
Propuesta de par único, alineado a lo que ya usan `quiz-multiple`/`true-false`:

| Rol | Texto/borde | Fondo tonal (16%) | Uso |
|---|---|---|---|
| success | `#16a34a` | `#dcfce7` | acierto, publicado, "al día" |
| warning | `#d97706` (`--lumina-amber`) | `#fef3c7` | pendiente, básico |
| error | `#dc2626` | `#fee2e2` | error, en riesgo, vencido |
| info | `#2563eb` (= primario) | `#dbeafe` | informativo, "enviado" |

### 2.3 — Tipografía
Inter → **no migrar**. Plus Jakarta Sans se queda. Solo se copia la **escala**
(tamaños/pesos/line-height) de `typography.ts`, ya reflejada en `--lumina-font-size-*`.

---

## 3. Sistema de tokens — mapa completo Materialize → Lumina

### 3.1 Radios (`theme/index.ts`)
`customBorderRadius { xs:2, sm:4, md:6, lg:8, xl:10 }`, `shape.borderRadius:10`.
→ Lumina: `--lumina-radius-*` / `rounded-lumina-*` (`xs2 sm4 md6 lg10 xl12 2xl16`).
**Regla:** inputs y chips pequeños → `md` (6). Botones → `lg`. Cards y cajas de
feedback → `lg`/`xl`. Nunca `rounded-md`/`rounded-lg` de Tailwind sueltos.
Uso por componente en la plantilla:
- Button `lg` (small→`md`, large→`xl`) — `overrides/button.ts`
- TextField small → `md` — `overrides/input.ts`
- Tooltip → `md` — `overrides/tooltip.ts`
- Avatar `variant='rounded'`, Alert, Snackbar/Toast → `lg` — `overrides/{avatar,alerts,snackbar}.ts`
- Badge → `11px` (píldora) — `overrides/badges.ts`

### 3.2 Sombras (`theme/customShadows.ts`)
`xs 0 2 6 /.14 · sm 0 2 10 /.16 · md 0 4 14 /.16 · lg 0 6 20 /.18 · xl 0 8 26 /.18`
(sobre canal de color `mainColorChannels` ≈ `38 43 67`, azulado).
→ Lumina: `--lumina-shadow-xs…lg` (mismos offsets, `rgba(0,0,0, …)` neutro, un
punto menos de alpha). **Mantener neutro.** Falta el `xl` en Lumina (para el
hover-lift de cards) — se puede añadir `--lumina-shadow-xl: 0px 8px 26px rgba(0,0,0,.12)`.
Uso: Card default → `md`; Button contained → `xs`; Menu/Dialog/Drawer → `lg`;
Toast → `md`; card-statistics hover → `xl`.

### 3.3 Espaciado (`theme/spacing.ts`)
`spacing(f) = 0.25f rem` → idéntico a la escala `1 unidad = 0.25rem` de Tailwind.
Card padding = `spacing(5)` = **20px** (`p-5`). `layoutPadding: 24` (`p-6`).
CardHeader/CardContent/Dialog* todos a `spacing(5)`.
**Regla Lumina:** contenido de card/dialog → `p-5`; gutter de layout → `p-6`;
`CardHeader + CardContent` sin doble padding arriba (`pt-0` en el segundo).

### 3.4 Escala de opacidad semántica (`colorSchemes.ts`)
Cada color expone: `lighterOpacity 0.08 · lightOpacity 0.16 · mainOpacity 0.24 ·
darkOpacity 0.32 · darkerOpacity 0.38` sobre su `mainChannel`.
Es la **fórmula** de todos los fondos tenues de Materialize (chips tonales,
avatares `light`, list item seleccionado, timeline dot ring, LinearProgress
track, Alert standard bg).
→ Lumina: escribir como `bg-[color]/8`, `/16`, `/24` con el hex del rol, o
predefinir `--lumina-primary-8/16/24` etc. Hoy Lumina usa hex fijos (`#dbeafe`,
`green-50`) — **unificar a la escala** para que todo el sistema respire igual.

### 3.5 Superficies (`colorSchemes.ts` → `customColors`)
`bodyBg #F7F7F9 · tableHeaderBg #F5F5F7 · greyLightBg #FAFAFA · trackBg #F5F5F8 ·
inputBorder rgb(38 43 67 / 0.22) · chatBg #F7F6FA`.
→ Lumina ya tiene `--lumina-table-header-bg`, `--lumina-grey-light`. Falta
formalizar `inputBorder` (hoy `#e5e7eb`) y `trackBg`. `bodyBg` de Lumina es
`#f9fafb`/`#eff6ff` (Metronic) — no cambiar.

### 3.6 Tipografía (`theme/typography.ts`)
`base 13.125px` · `h1 2.875/500` · `h2 2.375/500` · `h3 1.75/500` · `h4 1.5/500` ·
`h5 1.125/500` · `h6 .9375/500` · `body1 .9375` · `body2 .8125` · `button .9375 none`
· `caption .8125 +0.4px` · `overline .75 +0.8px`.
Colores por variante (`overrides/typography.ts`): headings → `text.primary`;
`body1/2` → `text.secondary`; `subtitle*` → `text.primary / 0.55`; `caption` →
`text.disabled`. **`textTransform: none` en botones** (Lumina ya lo hace).
→ Lumina: `--lumina-font-size-*` cubre `sm/md/lg`. Añadir `h4/h5` a la escala si
se van a usar los stat cards y steppers (`text-2xl/500`, `text-lg/500`).

---

## 4. Catálogo de componentes reutilizables

Para cada patrón: **ruta en la plantilla · equivalente en `lumina-frontend/src/components/ui/` · cómo alinearlo**.
Lumina ya tiene el componente en casi todos los casos; el trabajo es de *props/estilo*, no de crear.

### 4.1 Card
- **Plantilla:** `@core/theme/overrides/card.ts` — `MuiCard` no-outlined lleva
  `boxShadow: customShadows.md`; `CardHeader`/`CardContent`/`CardActions` padding
  `spacing(5)`; el 2º bloque sin `padding-top`. `CardActions.dense` → `spacing(2.5)`.
- **Lumina:** `components/ui/card.tsx`.
- **Alinear:** sombra por defecto `shadow-[var(--lumina-shadow-md)]` (hoy varias
  cards usan `shadow-lumina-xs` o `shadow-sm`), `rounded-lumina-xl`, `p-5` en
  header y content, `border-[color:var(--lumina-divider-strong)]`. Variante
  `bordered` (sin sombra, `border`) para skin alterno.

### 4.2 Card con hover-lift (stat cards)
- **Plantilla:** `components/card-statistics/HorizontalWithBorder.tsx` —
  `transition: border .3s, box-shadow .3s, margin .3s`; borde inferior `2px`
  `darkerOpacity` → en `:hover` `3px` `main` + `boxShadow: customShadows.xl` +
  `margin-block-end: -1px`.
- **Lumina:** no existe como variante — añadir a `card.tsx` un `variant="stat"`.
- **Uso:** dashboard docente/alumno, tarjetas de curso/clase en `/classes`, `/courses`.

### 4.3 Avatar con `skin` y `variant='rounded'`
- **Plantilla:** `@core/components/mui/Avatar.tsx` — `skin='light'` →
  `bg: color-lightOpacity` + `color: color-main`; `skin='filled'` →
  `bg: color-main` + `contrastText`; `skin='light-static'` → `lighten(main, .84)`.
  `variant='rounded'` → `rounded-lumina-lg`.
- **Lumina:** `components/ui/avatar.tsx` + `avatar-group.tsx`.
- **Alinear:** añadir prop `tone: 'light' | 'filled'` y `color` semántico; el
  patrón "ícono en avatar `light` cuadrado" es la base de **todos** los stat
  cards, list items con ícono, timeline, empty states.

### 4.4 Chip tonal (badge de estado)
- **Plantilla:** `@core/theme/overrides/chip.ts` + uso en
  `views/apps/kanban/TaskCard.tsx`, `card-statistics/Vertical.tsx` —
  `<Chip variant='tonal' color size='small'>`: `bg: color-lightOpacity`,
  `text: color-main`, `fontWeight: medium`, `body2`; `:hover` (si clickable) →
  `bg: color-main` + blanco.
- **Lumina:** `components/ui/badge.tsx`.
- **Alinear:** añadir `variant="tonal"` + `color` semántico. Sustituye los
  `bg-blue-100 text-blue-700` / `bg-green-100 text-green-700` sueltos que hoy
  aparecen en `quiz-multiple.tsx`, headers de editor, chips de nivel del gradebook.

### 4.5 Alert / caja de feedback
- **Plantilla:** `@core/theme/overrides/alerts.tsx` — `radius: lg`, `padding 3 4`,
  `gap 4`; **ícono dentro de un cuadrito `30×30`, `radius: lg`**, con fondo del
  color (`standard` → `main` + contrastText; `outlined` → `lightOpacity` + `main`).
  `AlertTitle` = `h5`, `mb: 1`.
- **Lumina:** `components/ui/alert.tsx`.
- **Alinear:** el "ícono en cuadrito redondeado" es el remate visual que falta en
  toda la app (hoy se usa `<span>✓</span>` o el ícono suelto). Aplicar en:
  feedback de actividades, banners de página, estados de error de datos,
  confirmaciones de guardado.

### 4.6 Button
- **Plantilla:** `@core/theme/overrides/button.ts` — `radius: lg` (`sm→md`,
  `lg→xl`); `contained` → `boxShadow: customShadows.xs` (se mantiene en hover, se
  quita en `:active`); `text`/`outlined` hover → `bg: color-lighterOpacity`
  (8%); padding por tamaño y variante; `disabled` → `opacity: .45`;
  `textTransform: none`.
- **Lumina:** `components/ui/button.tsx` (variantes `primary/mono/destructive/
  secondary/outline/dashed/ghost/dim/foreground/inverse`).
- **Alinear:** `rounded-lumina-lg`, sombra `xs` solo en `primary`, hover de
  `ghost`/`outline` a `bg-[#2563EB]/8`. Ya coincide bastante.

### 4.7 Input / TextField / Textarea
- **Plantilla:** `@core/theme/overrides/input.ts` — outlined small → `radius: md`,
  `padding: spacing(2,4)`; borde `customColors.inputBorder` → `:hover`
  `action.active` → `:focus` `primary.main`; `helperText` `lineHeight:1`,
  `margin-block-start: spacing(1)`, `margin-inline: spacing(4)`; adornos con
  `IconButton` (ojo de password).
- **Lumina:** `input.tsx`, `textarea.tsx`, `form.tsx`, `label.tsx`, `input-otp.tsx`.
- **Alinear:** `rounded-lumina-md`, `border-[color:var(--lumina-input-border)]`,
  `focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/16` (hoy varias usan
  `#93c5fd`), `helperText` como `text-[11px] text-[#6b7280] mt-1` con virado a
  error. Patrón de "mostrar/ocultar contraseña" para `/login` y `/profile`.

### 4.8 Tabs
- **Plantilla:** `@core/theme/overrides/tabs.ts` — `min-height: 38`;
  `borderBottom: 1px divider`; `:hover` del tab → `color: primary.main` +
  `borderBottom: 2px primary.lightOpacity`; `TabPanel` sin padding, gap arriba
  `spacing(5)`.
- **Lumina:** `tabs.tsx`.
- **Alinear:** subrayado activo `#2563EB`, hover con `border-b-2 border-[#2563EB]/16`.
  Aplica a `/profile`, `/analytics`, detalle de clase, editor (paneles).

### 4.9 Tooltip
- **Plantilla:** `@core/theme/overrides/tooltip.ts` + `colorSchemes` →
  `Tooltip.bg #282A42`, texto blanco, `radius: md`, `padding-inline: spacing(3)`,
  offset `6px`.
- **Lumina:** `tooltip.tsx`.
- **Alinear:** fondo `#282A42` (hoy shadcn usa `bg-primary`), `rounded-lumina-md`.

### 4.10 Switch
- **Plantilla:** `@core/theme/overrides/switch.ts` — `track` con
  `box-shadow: 0 0 4px rgb(0 0 0/.16) inset` + `borderRadius: 10`; `thumb`
  `14×14` con `customShadows.xs`; checked → track `opacity:1`.
- **Lumina:** `switch.tsx`.
- **Alinear:** sombra interior del track + sombra del thumb (da el "relieve"
  Materialize). Detalle pequeño, alto impacto de "acabado".

### 4.11 LinearProgress / Progress
- **Plantilla:** `@core/theme/overrides/progress.ts` — `height: 6`,
  `radius: borderRadius` (10); track = `color-lightOpacity` (`colorSchemes` →
  `LinearProgress.primaryBg` etc.).
- **Lumina:** `progress.tsx`.
- **Alinear:** alto `6px`, `rounded-full`, track `bg-[#2563EB]/16`. Aplica a
  barras del gradebook (nota), engagement de analytics, barra de actividad del viewer.

### 4.12 Timeline
- **Plantilla:** `@core/theme/overrides/timeline.ts` + uso en
  `views/apps/user/view/.../UserActivityTimeline.tsx`,
  `views/dashboards/analytics/ActivityTimeline.tsx` — `TimelineDot`
  `variant='filled' color` → `boxShadow: 0 0 0 3px color-lightOpacity` (halo);
  `variant='tonal'` → `bg: color-lightOpacity` + `color-main`; `variant='outlined'`
  → conector `1px dashed divider`. Contenido: título `font-medium text.primary` +
  `caption` a la derecha con la hora; adjunto en cajita `bg-actionHover rounded-lg`.
- **Lumina:** no hay `timeline.tsx` en `ui/` — construir con el patrón (div +
  `border-l` + dot). Ya existe `stepper.tsx` (relacionado).
- **Uso:** `/analytics` (actividad del curso, `SessionLog`), dashboard docente,
  historial de sesión, detalle de estudiante.

### 4.13 Menu / MenuItem / List (item seleccionado)
- **Plantilla:** `@core/theme/overrides/{menu,list}.ts` — item `Mui-selected` →
  `bg: primary.lightOpacity`, `text: primary.main`, ícono `primary.main`; hover
  del seleccionado → `primary.mainOpacity`. `MenuItem` padding `spacing(2,5)`,
  gap `spacing(2)`, ícono `1.375rem`.
- **Lumina:** `dropdown-menu.tsx`, `menubar.tsx`, `context-menu.tsx`,
  `navigation-menu.tsx`, `command.tsx`, `accordion-menu.tsx`.
- **Alinear:** estado activo = `bg-[#2563EB]/16 text-[#2563EB]` en todos los
  menús (hoy shadcn usa `bg-accent`). Coherencia con el sidebar Metronic.

### 4.14 Dialog / Drawer
- **Plantilla:** `@core/theme/overrides/dialog.ts` — paper `customShadows.lg`;
  title `h5` + padding `spacing(5)`; `DialogActions` padding `spacing(5)`, botones
  separados `spacing(4)`; variante `.dialog-actions-dense` → `spacing(2.5)`.
  `AddUserDrawer.tsx` = patrón de Drawer-formulario (header con título + X,
  `padding`, form, acciones abajo).
- **Lumina:** `dialog.tsx`, `drawer.tsx`, `sheet.tsx`, `alert-dialog.tsx`.
- **Alinear:** `p-5`, sombra `lg`, `rounded-lumina-xl`, acciones con gap
  consistente. Drawer de creación (usuarios, clases) siguiendo `AddUserDrawer`.

### 4.15 Snackbar / Toast
- **Plantilla:** `@core/theme/overrides/snackbar.ts` + `libs/styles/AppReactToastify.tsx`
  — toast `radius: lg`, `padding: spacing(3,4)`, `bg: background.paper`,
  `boxShadow: customShadows.md`, `min-height: 46`; ícono `20×20` con `fill` del
  color semántico; texto `body1`.
- **Lumina:** `sonner.tsx` (`<Toaster />`).
- **Alinear:** configurar el `<Toaster />` de Sonner con `toastOptions` →
  `rounded-lumina-lg`, `shadow-[var(--lumina-shadow-md)]`, `bg-white`,
  íconos por tipo con color semántico. Posición `top-right` (coincide con
  `themeConfig.toastPosition`).

### 4.16 OptionMenu (acción "⋮" de card header)
- **Plantilla:** `@core/components/option-menu/index.tsx` — botón `IconButton`
  con `ri-more-2-line` + `Popper`/`MenuList`/`ClickAwayListener` + `Fade`;
  soporta items string u objeto (`{text, href, icon, menuItemProps}`), divisores.
  Usado en **casi todos** los `CardHeader` de dashboards (`action={<OptionMenu …>}`).
- **Lumina:** `dropdown-menu.tsx` + `button.tsx` `size="icon"`.
- **Uso:** estandarizar el header de card de dashboards/analytics con
  `title` + `action` (⋮ o selector de rango "Últimos 28 días").

### 4.17 card-statistics (7 variantes) → dashboard y analytics
- **Plantilla:** `components/card-statistics/` — `Vertical`, `Horizontal`,
  `HorizontalWithAvatar`, `HorizontalWithBorder`, `HorizontalWithSubtitle`,
  `Character`, `CustomerStats`. Estructura: avatar `light`/`rounded` con ícono +
  cifra `h4/h5` + título `body1 text.secondary` + delta `+X% ↑` en `success.main`
  / `error.main` con flecha + (opcional) chip tonal.
- **Lumina:** `counting-number.tsx`, `sliding-number.tsx` (animación de cifra) +
  `card.tsx`. No hay stat-card como tal.
- **Uso:** `/dashboard` (los 3 roles), cabecera de `/analytics`
  (`CourseSummary`), cabecera de `/users` (`UserListCards` = 4 stat cards con
  total/activos/pendientes/inactivos).

### 4.18 AvatarGroup `pull-up`
- **Plantilla:** `@core/theme/overrides/avatar.ts` — `.pull-up .MuiAvatar:hover`
  → `translateY(-5px)` + `customShadows.md`, transición `shorter` `ease`.
- **Lumina:** `avatar-group.tsx`.
- **Uso:** listas de estudiantes en tarjetas de clase/curso, equipos de escape room.

### 4.19 Empty state / Misc
- **Plantilla:** `views/pages/misc/` (404/500/under-maintenance) + patrón repetido:
  ilustración centrada + `h4` + `body` + `Button contained`.
- **Lumina:** `page-banner.tsx` existe. Falta empty-state canónico.
- **Uso:** gradebook sin período, analytics sin datos, biblioteca de clases vacía
  (roadmap Fase 4 "Empty states con call-to-action claro").

---

## 5. Polish por superficie de Lumina

### 5.1 Shell / Layout (Metronic) — mínimo
No migrar. Solo alinear tokens de las **cards y contenedores** dentro del
contenido (`p-6` gutter, cards `shadow-md` + `rounded-lumina-xl`). Sidebar/header
Metronic: alinear el estado activo del menú a `bg-[#2563EB]/16 text-[#2563EB]`
(patrón `list.ts` / `menu.ts`).

### 5.2 `/dashboard` (Admin / Teacher / Student)
- Reemplazar las tarjetas de resumen por **card-statistics** (§4.17): avatar
  `light` + ícono lucide + `counting-number` + delta + chip tonal.
- Banner de bienvenida por rol → patrón `CongratulationsJohn.tsx` (§ `views/dashboards/analytics/`):
  card `relative`, texto a la izquierda (`h4` + `body` + `Button`), ilustración
  SVG absoluta abajo-derecha. Encaja con "banner de página" de Lumina 2.1.
- Listas (cursos recientes, próximas clases) → list item con avatar `light` +
  `ListItemButton` selected pattern.

### 5.3 `/analytics`
- Cabecera: 4 stat cards (`CourseSummary`).
- Cada card de gráfico → `CardHeader title + action={OptionMenu}` (selector de
  rango). Charts (Recharts, ya en uso) → tematizar ejes/grid/leyenda con
  `var(--lumina-*)` igual que `Performance.tsx` hace con `var(--mui-palette-*)`
  (colores de serie = primario + secundarios; grid = `--lumina-divider`; labels =
  `--lumina-text-secondary`).
- "Estudiantes en riesgo" → lista con chip tonal `error` + barra `LinearProgress`
  de completitud.
- "Actividad del curso" (`SessionLog`) → **Timeline** (§4.12) con dots tonales por
  tipo de evento.
- Distribución de notas → mismo patrón de barras, colores por nivel (§2.2).

### 5.4 `/gradebook`
- Tabla: header `bg-[var(--lumina-table-header-bg)]` (#F5F5F7), alto de fila
  `var(--lumina-table-row-height)` (50), bordes de celda `--lumina-divider`,
  header `subtitle2` (`overrides/table` está vacío en la plantilla pero
  `customColors.tableHeaderBg` + `TableCell.border` definen la intención; ver
  `views/react-table/` y `data-grid-table.tsx` de Lumina).
- Celda de nota → chip tonal por **nivel colombiano** (V41 §6):
  `Bajo` → error · `Básico` → warning · `Alto` → info/primary · `Superior` → success.
- Modal "ingresar nota" (RHF + Zod, ya existe) → layout `DialogTitle h5` +
  `DialogContent p-5` + `DialogActions` con gap; `TextField` con `helperText`.
- Panel de notas finales → stat card + `LinearProgress`.

### 5.5 `/classes` y detalle de clase
- Tarjetas de clase → `card variant="stat"` (hover-lift §4.2), chip tonal de
  `status` (borrador/publicada), `AvatarGroup pull-up` de estudiantes.
- Detalle: tabs alineadas (§4.8); lista de slides con `ListItemButton` selected.
- Botón "Preview completo" / "Presentar" → `Button` contained con sombra `xs`.

### 5.6 Editor
Ya pulido (V41 §4.1–4.2). Es la **referencia**. Este documento solo lo cita para
extender su lenguaje al resto.

### 5.7 Viewer (alumno)
Feedback de actividades → ver `MATERIALIZE_POLISH_EXTRACTION.md`. Añadir a nivel
global: caja de resultado con **ícono en cuadrito** (§4.5), barra de progreso de
actividad (§4.11), toasts de Sonner alineados (§4.15).

### 5.8 `/login` (`(auth)`)
- Patrón `LoginV2.tsx`: split screen — ilustración a la izquierda (`hidden md:flex`,
  `bg` con `customColors`), formulario centrado a la derecha (logo + `h4` +
  `body` + `TextField` email/password con adorno de ojo + `Button` full-width +
  links). `rounded-lumina-*`, `helperText` de error.
- `ForgotPasswordV2` / `ResetPasswordV2` / `VerifyEmailV2` como variantes del
  mismo layout (si Lumina los añade).

### 5.9 `/profile`
- Patrón `views/pages/account-settings/`:
  - `AccountDetails.tsx` → card con avatar + botones "Subir/Reset" + grid de
    `TextField` (nombre, email, institución, etc.) + `Button` guardar/descartar.
  - `ChangePasswordCard.tsx` → card aparte, 2 columnas, adornos de ojo, lista de
    requisitos de contraseña.
  - Tabs "Cuenta / Seguridad / Notificaciones" (§4.8).
  - "Estadísticas del docente" → stat cards (§4.17).

### 5.10 `/users` (Admin)
- `UserListCards.tsx` → fila de 4 stat cards (total / activos / pendientes /
  inactivos) con avatar `light` e ícono.
- `UserListTable.tsx` → tabla con header `#F5F5F7`, avatar + nombre/email en la
  1ª celda, chip tonal de rol y de estado, `OptionMenu` por fila.
- `TableFilters.tsx` → fila de `Select` (rol / estado / plan) sobre la tabla.
- `AddUserDrawer.tsx` → Drawer lateral con form (patrón §4.14) en vez de modal.

### 5.11 Roles / permisos (si Lumina expone UI)
- `RoleCards.tsx` → grid de cards con `AvatarGroup` de usuarios + "Editar rol"
  (abre dialog con checkboxes de permisos).
- `RolesTable.tsx` / `permissions/index.tsx` → tabla con chips tonales por módulo.

---

## 6. Notas de integración

### Nada de MUI ni dependencias nuevas
- No instalar `@mui/*`, `@emotion/*`, `react-toastify`, `@formkit/drag-and-drop`,
  `classnames`, Remix Icon. Todo se implementa con Tailwind + `cn()` + shadcn ya
  presentes.
- Sonner cubre react-toastify; `@dnd-kit` + `sortable.tsx`/`kanban.tsx` cubren
  `@formkit/drag-and-drop`; `data-grid*` cubre las tablas MUI.

### Traducción de tokens MUI → CSS vars de Lumina
| Materialize | Lumina |
|---|---|
| `var(--mui-palette-primary-main)` | `#2563EB` / `var(--lumina-purple)` |
| `…-primary-lightOpacity` (16%) | `bg-[#2563EB]/16` |
| `…-primary-lighterOpacity` (8%) | `bg-[#2563EB]/8` |
| `var(--mui-shape-customBorderRadius-lg)` | `rounded-lumina-lg` / `var(--lumina-radius-lg)` |
| `var(--mui-customShadows-md)` | `var(--lumina-shadow-md)` |
| `theme.spacing(5)` | `p-5` / `1.25rem` |
| `var(--mui-palette-text-secondary)` | `var(--lumina-text-muted)` (#6b7280) |
| `var(--mui-palette-divider)` | `var(--lumina-divider-strong)` |
| `customColors.tableHeaderBg` | `var(--lumina-table-header-bg)` (#F5F5F7) |

### Iconos
Remix → lucide: `ri-more-2-line`→`MoreVertical` · `ri-arrow-up-s-line`→`ChevronUp`
/`TrendingUp` · `ri-checkbox-circle-line`→`CheckCircle2` · `ri-error-warning-line`
→`AlertCircle` · `ri-eye-line`/`ri-eye-off-line`→`Eye`/`EyeOff` · `ri-check-line`
→`Check` · `ri-information-line`→`Info` · `ri-alert-line`→`AlertTriangle`.

### Tipografía
Plus Jakarta Sans se queda. Copiar solo tamaños/pesos/line-height de
`typography.ts` (ya en `--lumina-font-size-*`; añadir `h4`/`h5` si se usan stat
cards y steppers).

### Dark mode
Materialize define `colorSchemes.dark` completo. Lumina tiene `.dark` en
`globals.css` (roadmap Fase 4: "Modo oscuro editor y vista del estudiante"). Al
adoptar los patrones, definir cada color **como token** y su variante dark en el
mismo sitio — no hardcodear el claro. Las actividades ya lo hacen con
`variant='dark'`.

### Metronic se queda
El layout (sidebar, header, toolbar, `config.metronic.css`) **no** se sustituye
por el `@layouts`/`@menu` de Materialize. Solo se alinea el *contenido*.

### Scoring / lógica
Ningún cambio de este documento toca evaluación, contratos del editor de canvas
(`.cursorrules`), ni el scoring unificado. Es 100% capa visual.

---

## 7. Plan por fases (sugerido)

| Fase | Entregable | Archivos Lumina (orientativo) | Riesgo |
|---|---|---|---|
| **G0 — Tokens** | Completar `globals.css`: `--lumina-shadow-xl`, `--lumina-input-border`, `--lumina-track-bg`, `h4/h5` en la escala, escala `/8 /16 /24` por rol semántico. Congelar 1 valor por color (§2.2). | `src/styles/globals.css`, `tailwind.config.ts` | bajo |
| **G1 — Primitivas compartidas** | Variantes en shadcn: `badge` `variant="tonal"`, `avatar` `tone`, `card` `variant="stat"`, `alert` con ícono-chip, `tooltip` bg `#282A42`, `switch` relieve, `progress` 6px, `<Toaster>` de Sonner con `toastOptions`. | `src/components/ui/{badge,avatar,card,alert,tooltip,switch,progress,sonner}.tsx` | bajo-medio |
| **G2 — Stat cards + Timeline + OptionMenu** | Componentes nuevos: `stat-card.tsx` (7 layouts), `timeline.tsx`, header de card `title + action`. | `src/components/ui/` + `src/components/` | medio |
| **G3 — Dashboard** | 3 dashboards por rol con stat cards + banner + listas. | `src/app/(app)/dashboard/*` | medio |
| **G4 — Analytics** | Stat cards, headers con OptionMenu, charts tematizados, timeline de actividad, riesgo con chip tonal. | `src/app/(app)/analytics/*` | medio |
| **G5 — Gradebook** | Header `#F5F5F7`, filas 50px, chips de nivel, modal alineado, panel de finales. | `src/app/(app)/gradebook/*`, `data-grid*` | medio-alto |
| **G6 — Users + Roles** | `UserListCards`, tabla con chips + OptionMenu, `TableFilters`, Drawer de alta. | `src/app/(app)/users/*` | medio |
| **G7 — Auth + Profile** | Login split-layout, profile con tabs + AccountDetails + ChangePassword. | `src/app/(auth)/login/*`, `src/app/(app)/profile/*` | bajo-medio |
| **G8 — Classes** | Tarjetas hover-lift, chips de status, AvatarGroup pull-up, tabs de detalle. | `src/app/(app)/classes/*` | medio |
| **G9 — Empty states** | Empty-state canónico (ilustración + h4 + CTA) en gradebook/analytics/biblioteca. | `src/components/ui/` + superficies | bajo |

Cada fase = un prompt `[FRONTEND]` independiente que empieza con
"Lee LUMINA_CONTEXT_V41.md + LUMINA_ROADMAP_DETALLADO.md Fase 4 +
MATERIALIZE_POLISH_GENERAL.md". Empezar por **G0 y G1** (son la base de todo lo
demás y de bajo riesgo).

---

## 8. Resumen — qué se extrae y a dónde va

| Elemento Materialize | Ruta plantilla | Destino en Lumina |
|---|---|---|
| `customBorderRadius`, `customShadows`, `spacing`, `typography`, `customColors` | `@core/theme/{index,customShadows,spacing,typography}.ts`, `colorSchemes.ts` | `globals.css` `--lumina-*` (ya iniciado — completar) |
| Escala opacidad `0.08/0.16/0.24` | `colorSchemes.ts` | fondos tonales de toda la app |
| Card `shadow-md` + header/content `p-5` + hover-lift | `overrides/card.ts`, `card-statistics/HorizontalWithBorder.tsx` | `card.tsx` (+ `variant="stat"`) |
| Avatar `skin='light'` cuadrado con ícono | `@core/components/mui/Avatar.tsx` | `avatar.tsx` (+ `tone`) |
| Chip `variant='tonal'` | `overrides/chip.ts`, `kanban/TaskCard.tsx` | `badge.tsx` (+ `variant="tonal"`) |
| Alert con ícono en cuadrito `30×30` | `overrides/alerts.tsx` | `alert.tsx` |
| Button radius/sombra/hover 8% | `overrides/button.ts` | `button.tsx` (ajuste fino) |
| Input borde→hover→focus + helperText + ojo password | `overrides/input.ts`, `security/ChangePasswordCard.tsx` | `input.tsx`, `textarea.tsx`, `form.tsx` |
| Tabs subrayado + hover lightOpacity | `overrides/tabs.ts` | `tabs.tsx` |
| Tooltip `#282A42` radius md | `overrides/tooltip.ts` | `tooltip.tsx` |
| Switch relieve (track inset + thumb shadow) | `overrides/switch.ts` | `switch.tsx` |
| LinearProgress 6px + track tonal | `overrides/progress.ts` | `progress.tsx` |
| Timeline dots tonales + halo + conector dashed | `overrides/timeline.ts`, `user/.../UserActivityTimeline.tsx`, `dashboards/analytics/ActivityTimeline.tsx` | nuevo `timeline.tsx` |
| Menu/List item seleccionado = primary tonal | `overrides/{menu,list}.ts` | `dropdown-menu.tsx`, menús, sidebar activo |
| Dialog `p-5` + actions gap + Drawer-form | `overrides/dialog.ts`, `user/list/AddUserDrawer.tsx` | `dialog.tsx`, `drawer.tsx`, `sheet.tsx` |
| Toast radius lg + shadow md + ícono semántico | `overrides/snackbar.ts`, `libs/styles/AppReactToastify.tsx` | `sonner.tsx` (`toastOptions`) |
| OptionMenu "⋮" de card header | `@core/components/option-menu/` | `dropdown-menu.tsx` + `button size="icon"` |
| 7 stat cards | `components/card-statistics/*` | nuevo `stat-card.tsx` → dashboard, analytics, users |
| AvatarGroup `pull-up` hover | `overrides/avatar.ts` | `avatar-group.tsx` |
| Banner "Congratulations" | `dashboards/analytics/CongratulationsJohn.tsx` | dashboard por rol |
| Login split-screen | `views/pages/auth/LoginV2.tsx` | `/login` |
| Account settings (details + password + tabs) | `views/pages/account-settings/*` | `/profile` |
| User list (stat cards + tabla + filtros + drawer) | `views/apps/user/list/*` | `/users` |
| Role cards + tabla | `views/apps/roles/*` | roles (si aplica) |
| Empty / misc | `views/pages/misc/*` | empty states (roadmap Fase 4) |

**Siguiente paso sugerido:** revisar juntos §2 (las dos divergencias) y el plan
§7, y luego generar el prompt de **G0 + G1**.
