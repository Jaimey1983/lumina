'use client';

/**
 * Re-export de compatibilidad: `widgets/_motion/use-conteo.ts` se promovió a `src/_efectos/` en U5 (etapa U / DU5)
 * para que lo compartan widgets y actividades. Los widgets siguen importando desde acá.
 * TODO(U9d, 2026-10-11): borrar este archivo y apuntar los widgets a `src/_efectos/`
 * cuando nadie lo importe desde el lugar viejo (ficha U5, Cierre).
 */
export * from '../../_efectos/motion/use-conteo.js';
