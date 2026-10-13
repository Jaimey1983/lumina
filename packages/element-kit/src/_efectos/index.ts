/**
 * `src/_efectos/` — movimiento, confeti y audio compartidos por widgets y actividades
 * (promovido desde `widgets/_motion`, `_efectos` y `_audio` en U5, DU5). Ningún widget ni
 * actividad importa `motion` directamente: pasa por acá.
 */
export * from './motion/index.js';
export { Confeti } from './confeti.js';
export { obtenerAudioContextCtor } from './audio/audio-context.js';
