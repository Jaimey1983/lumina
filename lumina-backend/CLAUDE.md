Ver `AGENTS.md` en la raíz del repositorio — es la fuente única de convenciones mientras dure la migración a la Estructura Única. Este archivo no la repite ni la reemplaza.

# lumina-backend

Backend de Lumina — NestJS + Prisma + PostgreSQL + Redis + Socket.IO. Expone la API REST que consume `lumina-frontend` y los gateways de tiempo real para clases en vivo, torneos, gamificación y escape room.

## Stack técnico

- NestJS (auth vía `@nestjs/jwt` + Passport, `ThrottlerModule` para rate limiting)
- Prisma + PostgreSQL
- Redis (`ioredis`) para estado efímero de sesiones en vivo
- Socket.IO (gateways `classes.gateway.ts` y `live-sessions.gateway.ts`)
- bcryptjs para hashing de contraseñas

## Antes de tocar código de calificación o autorización

Este es el código más sensible del backend — cualquier cambio ahí sigue las Reglas 5 y 7 de `AGENTS.md` sin excepción (verificación de propiedad de curso, `@Roles()` explícito, prueba de paridad antes de tocar el motor de puntuación `@lumina/scoring` — el espejo local `activity-scoring.ts` se retiró en E6.3 — o `grade-calculation.service.ts`).
