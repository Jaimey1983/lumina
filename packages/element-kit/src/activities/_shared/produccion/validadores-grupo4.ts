/**
 * U12.1b — validadores del Grupo 4, de torneo y de escape room. Funciones puras
 * `actividad → problemas`; reutilizan los chequeos y límites que ya viven en la config de cada
 * actividad (`detectarConflictosInterseccion`, `nodosAlcanzables`, `MIN/MAX_*`) en vez de duplicarlos.
 */
import type {
  AbrirCajaActivity,
  AhorcadoActivity,
  AnagramaActivity,
  ClasificarActivity,
  CrucigramaActivity,
  EscapeRoomActivity,
  GlobosActivity,
  HistoriaRamificadaActivity,
  MemoriaActivity,
  PuzzleImagenActivity,
  PuzzlePalabrasActivity,
  RuletaActivity,
  SopaLetrasActivity,
  TopoActivity,
  TorneoActivity,
} from '@lumina/types/slide';

import { ABRIR_CAJA_MAX_CAJAS, ABRIR_CAJA_MIN_CAJAS } from '../../abrir-caja/abrir-caja-config.js';
import { AHORCADO_MAX_INTENTOS, AHORCADO_MIN_INTENTOS, esPalabraAhorcadoValida, normalizarPalabraAhorcado } from '../../ahorcado/ahorcado-config.js';
import { CLASIFICAR_MIN_CATEGORIAS, CLASIFICAR_MIN_ITEMS } from '../../clasificar/clasificar-config.js';
import { CRUCIGRAMA_MIN_PALABRAS, detectarConflictosInterseccion } from '../../crucigrama/crucigrama-config.js';
import { GLOBOS_MAX_OPCIONES, GLOBOS_MIN_OPCIONES } from '../../globos/globos-config.js';
import { esNodoFinal, nodosAlcanzables } from '../../historia-ramificada/historia-ramificada-config.js';
import { MEMORIA_MAX_PARES, MEMORIA_MIN_PARES } from '../../memoria/memoria-config.js';
import {
  SOPA_LETRAS_MAX_COLUMNAS,
  SOPA_LETRAS_MAX_FILAS,
  SOPA_LETRAS_MIN_COLUMNAS,
  SOPA_LETRAS_MIN_FILAS,
  SOPA_LETRAS_MIN_PALABRAS,
} from '../../sopa-letras/sopa-letras-config.js';
import { TOPO_MAX_OPCIONES, TOPO_MIN_OPCIONES } from '../../topo/topo-config.js';
import { ESCAPE_ROOM_INTENTOS_ILIMITADOS } from '../../escape-room/escape-room-logic.js';
import { normalizarPalabra } from '../palabras.js';
import { aviso, duplicados, error, hayTexto, type ProblemaActividad as P } from './problemas.js';

const ladoVacio = (l: { texto?: string; imagen?: string } | undefined) => !hayTexto(l?.texto) && !hayTexto(l?.imagen);

export const validarClasificar = (a: ClasificarActivity): P[] => {
  const out: P[] = [];
  const cats = a.categorias ?? [];
  const items = a.items ?? [];
  if (cats.length < CLASIFICAR_MIN_CATEGORIAS) out.push(error(`Necesita al menos ${CLASIFICAR_MIN_CATEGORIAS} categorías.`));
  cats.forEach((c, i) => {
    if (!hayTexto(c.nombre)) out.push(error('La categoría no tiene nombre.', `Categoría ${i + 1}`));
  });
  if (items.length === 0) out.push(error('No tiene elementos para clasificar.'));
  else if (items.length < CLASIFICAR_MIN_ITEMS) out.push(aviso(`Con menos de ${CLASIFICAR_MIN_ITEMS} elementos la actividad queda muy corta.`));
  const ids = new Set(cats.map((c) => c.id));
  items.forEach((it, i) => {
    const campo = `Elemento ${i + 1}`;
    if (!hayTexto(it.texto) && !hayTexto(it.imagen)) out.push(error('No tiene texto ni imagen.', campo));
    if (!ids.has(it.categoriaId)) out.push(error('Su categoría correcta no existe.', campo));
  });
  for (const c of cats) {
    if (!items.some((it) => it.categoriaId === c.id)) out.push(aviso(`La categoría «${c.nombre || c.id}» no tiene ningún elemento.`));
  }
  return out;
};

export const validarMemoria = (a: MemoriaActivity): P[] => {
  const out: P[] = [];
  const pares = a.pares ?? [];
  if (pares.length < MEMORIA_MIN_PARES) out.push(error(`Necesita al menos ${MEMORIA_MIN_PARES} pares.`));
  if (pares.length > MEMORIA_MAX_PARES) out.push(aviso(`Tiene más de ${MEMORIA_MAX_PARES} pares: el tablero queda demasiado grande.`));
  pares.forEach((p, i) => {
    const campo = `Par ${i + 1}`;
    if (ladoVacio(p.lado1) || ladoVacio(p.lado2)) out.push(error('Tiene una carta vacía.', campo));
    else if (hayTexto(p.lado1?.texto) && p.lado1.texto?.trim().toLowerCase() === p.lado2?.texto?.trim().toLowerCase()) {
      out.push(aviso('Las dos cartas dicen lo mismo.', campo));
    }
  });
  return out;
};

export const validarPuzzleImagen = (a: PuzzleImagenActivity): P[] =>
  hayTexto(a.imagen) ? [] : [error('Falta la imagen del puzzle.')];

export const validarSopaLetras = (a: SopaLetrasActivity): P[] => {
  const out: P[] = [];
  const cfg = a.configuracion;
  const palabras = (a.palabras ?? []).map((p) => normalizarPalabra(p.texto ?? '').replace(/\s/g, ''));
  if ((a.palabras ?? []).length === 0) out.push(error('No tiene palabras.'));
  else if (a.palabras.length < SOPA_LETRAS_MIN_PALABRAS) out.push(aviso(`Con menos de ${SOPA_LETRAS_MIN_PALABRAS} palabras queda muy corta.`));
  if (!cfg?.direcciones?.length) out.push(error('No hay ninguna dirección permitida para las palabras.'));
  const { filas, columnas } = cfg ?? { filas: 0, columnas: 0 };
  if (!(filas >= SOPA_LETRAS_MIN_FILAS && filas <= SOPA_LETRAS_MAX_FILAS && columnas >= SOPA_LETRAS_MIN_COLUMNAS && columnas <= SOPA_LETRAS_MAX_COLUMNAS)) {
    out.push(aviso(`La grilla debe medir entre ${SOPA_LETRAS_MIN_FILAS} y ${SOPA_LETRAS_MAX_FILAS} por lado.`));
  }
  const mayor = Math.max(filas, columnas);
  palabras.forEach((p, i) => {
    const campo = `Palabra ${i + 1}`;
    if (!p) out.push(error('No tiene letras jugables.', campo));
    else {
      if (p.length > mayor) out.push(error(`«${p}» no cabe en la grilla (tiene ${p.length} letras).`, campo));
      if (p.length === 1) out.push(aviso('Una sola letra es muy fácil de encontrar.', campo));
    }
  });
  const letras = palabras.reduce((n, p) => n + p.length, 0);
  if (letras > filas * columnas) out.push(error('Las palabras suman más letras que celdas tiene la grilla.'));
  else if (letras > filas * columnas * 0.6) out.push(aviso('La grilla queda muy llena: puede que alguna palabra no se pueda colocar.'));
  const dup = duplicados(palabras);
  if (dup.length) out.push(aviso(`Palabras repetidas: ${dup.join(', ')}.`));
  return out;
};

export const validarCrucigrama = (a: CrucigramaActivity): P[] => {
  const out: P[] = [];
  const pal = a.palabras ?? [];
  if (pal.length === 0) out.push(error('No tiene palabras.'));
  else if (pal.length < CRUCIGRAMA_MIN_PALABRAS) out.push(aviso(`Con menos de ${CRUCIGRAMA_MIN_PALABRAS} palabras no hay cruces.`));
  pal.forEach((p, i) => {
    const campo = `Palabra ${i + 1}`;
    if (!hayTexto(p.texto)) out.push(error('No tiene texto.', campo));
    if (!hayTexto(p.pista)) out.push(aviso('Sin pista.', campo));
    if (!(p.fila >= 0 && p.columna >= 0)) out.push(error('Está fuera del tablero (fila o columna negativa).', campo));
  });
  if (new Set(pal.map((p) => p.id)).size !== pal.length) out.push(error('Hay palabras con el mismo identificador.'));
  const validas = pal.filter((p) => hayTexto(p.texto) && p.fila >= 0 && p.columna >= 0);
  for (const c of detectarConflictosInterseccion(validas)) {
    out.push(error(`Dos palabras exigen letras distintas (${c.letras.join(' / ')}) en la fila ${c.fila + 1}, columna ${c.columna + 1}.`));
  }
  if (validas.length > 1) {
    const dueno = new Map<string, number>();
    let cruces = 0;
    validas.forEach((p, idx) => {
      for (let i = 0; i < p.texto.length; i++) {
        const k = p.direccion === 'vertical' ? `${p.fila + i}-${p.columna}` : `${p.fila}-${p.columna + i}`;
        if (dueno.has(k) && dueno.get(k) !== idx) cruces += 1;
        dueno.set(k, idx);
      }
    });
    if (cruces === 0) out.push(aviso('Las palabras no se cruzan en ningún punto.'));
  }
  return out;
};

export const validarAnagrama = (a: AnagramaActivity): P[] => {
  const out: P[] = [];
  const pal = a.palabras ?? [];
  if (pal.length === 0) out.push(error('No tiene palabras.'));
  pal.forEach((p, i) => {
    const campo = `Palabra ${i + 1}`;
    const t = normalizarPalabra(p.texto ?? '').replace(/\s/g, '');
    if (!t) out.push(error('No tiene letras jugables.', campo));
    else if (t.length === 1 || new Set(t).size === 1) out.push(aviso('No hay otro orden posible para sus letras.', campo));
    if (a.configuracion?.mostrarPista && !hayTexto(p.pista)) out.push(aviso('Se muestran pistas pero esta palabra no tiene.', campo));
  });
  return out;
};

export const validarAhorcado = (a: AhorcadoActivity): P[] => {
  const out: P[] = [];
  const cfg = a.configuracion;
  const palabra = cfg?.palabra ?? '';
  if (!esPalabraAhorcadoValida(palabra)) out.push(error('La palabra no tiene letras jugables.'));
  else if (normalizarPalabraAhorcado(palabra).replace(/\s/g, '') !== palabra.toUpperCase().replace(/\s/g, '')) {
    out.push(aviso('Se quitarán tildes, números o signos al jugar.'));
  }
  const n = cfg?.maxIntentos;
  if (!(typeof n === 'number' && n >= AHORCADO_MIN_INTENTOS && n <= AHORCADO_MAX_INTENTOS)) {
    out.push(aviso(`Los intentos deben estar entre ${AHORCADO_MIN_INTENTOS} y ${AHORCADO_MAX_INTENTOS}.`));
  }
  return out;
};

export const validarPuzzlePalabras = (a: PuzzlePalabrasActivity): P[] => {
  const out: P[] = [];
  const ors = a.oraciones ?? [];
  if (ors.length === 0) out.push(error('No tiene oraciones.'));
  ors.forEach((o, i) => {
    const campo = `Oración ${i + 1}`;
    const n = (o.texto ?? '').trim().split(/\s+/).filter(Boolean).length;
    if (n < 2) out.push(error('Necesita al menos 2 palabras para tener algo que ordenar.', campo));
    if (a.configuracion?.mostrarPista && !hayTexto(o.pista)) out.push(aviso('Se muestran pistas pero esta oración no tiene.', campo));
  });
  return out;
};

export const validarAbrirCaja = (a: AbrirCajaActivity): P[] => {
  const out: P[] = [];
  const cajas = a.cajas ?? [];
  if (cajas.length < ABRIR_CAJA_MIN_CAJAS) out.push(error(`Necesita al menos ${ABRIR_CAJA_MIN_CAJAS} cajas.`));
  if (cajas.length > ABRIR_CAJA_MAX_CAJAS) out.push(aviso(`Tiene más de ${ABRIR_CAJA_MAX_CAJAS} cajas.`));
  const cfg = a.configuracion;
  if (cfg && cajas.length > cfg.filas * cfg.columnas) {
    out.push(error(`Hay ${cajas.length} cajas pero la cuadrícula solo tiene ${cfg.filas * cfg.columnas} lugares.`));
  }
  cajas.forEach((c, i) => {
    if (!hayTexto(c.contenido?.texto) && !hayTexto(c.contenido?.imagen)) out.push(error('La caja está vacía por dentro.', `Caja ${i + 1}`));
  });
  const evaluables = cajas.filter((c) => c.contenido?.esCorrecta !== undefined);
  if (evaluables.length > 0 && !evaluables.some((c) => c.contenido.esCorrecta)) {
    out.push(aviso('Ninguna caja está marcada como correcta.'));
  }
  return out;
};

type PreguntaArcade = { enunciado: string; opciones: { texto: string; correcta: boolean }[] };

function validarPreguntasArcade(
  preguntas: readonly PreguntaArcade[] | undefined,
  min: number,
  max: number,
  maxVisibles: number | null,
): P[] {
  const out: P[] = [];
  if (!preguntas?.length) return [error('No tiene preguntas.')];
  preguntas.forEach((p, i) => {
    const campo = `Pregunta ${i + 1}`;
    const ops = p.opciones ?? [];
    if (!hayTexto(p.enunciado)) out.push(error('Falta el enunciado.', campo));
    if (ops.length < min) out.push(error(`Necesita al menos ${min} opciones.`, campo));
    if (ops.length > max) out.push(aviso(`Tiene más de ${max} opciones.`, campo));
    if (maxVisibles !== null && ops.length > maxVisibles) {
      out.push(error(`Tiene ${ops.length} opciones pero la cuadrícula solo tiene ${maxVisibles} huecos.`, campo));
    }
    if (ops.some((o) => !hayTexto(o.texto))) out.push(aviso('Hay opciones sin texto.', campo));
    if (!ops.some((o) => o.correcta)) out.push(error('Ninguna opción está marcada como correcta.', campo));
  });
  return out;
}

export const validarGlobos = (a: GlobosActivity): P[] => {
  const out = validarPreguntasArcade(a.preguntas, GLOBOS_MIN_OPCIONES, GLOBOS_MAX_OPCIONES, null);
  if (!(a.configuracion?.vidas >= 1)) out.push(error('Debe haber al menos 1 vida.'));
  return out;
};

export const validarTopo = (a: TopoActivity): P[] => {
  const huecos = (a.configuracion?.filas ?? 0) * (a.configuracion?.columnas ?? 0);
  const out = validarPreguntasArcade(a.preguntas, TOPO_MIN_OPCIONES, TOPO_MAX_OPCIONES, huecos > 0 ? huecos : null);
  if (!(a.configuracion?.vidas >= 1)) out.push(error('Debe haber al menos 1 vida.'));
  return out;
};

export const validarHistoriaRamificada = (a: HistoriaRamificadaActivity): P[] => {
  const out: P[] = [];
  const nodos = a.nodos ?? [];
  const conex = a.conexiones ?? [];
  if (nodos.length === 0) return [error('No tiene nodos.')];
  const ids = new Set(nodos.map((n) => n.id));
  if (ids.size !== nodos.length) out.push(error('Hay nodos con el mismo identificador.'));
  if (!ids.has(a.nodoInicial)) out.push(error('El nodo inicial no existe.'));
  const nombre = (id: string) => nodos.find((n) => n.id === id)?.titulo || id;
  for (const c of conex) {
    if (!ids.has(c.desdeNodoId) || !ids.has(c.haciaNodoId)) {
      out.push(error('Hay una conexión que apunta a un nodo que no existe.'));
      continue;
    }
    const desde = nodos.find((n) => n.id === c.desdeNodoId)!;
    if ((desde.opciones ?? []).length > 0 && !desde.opciones!.some((o) => o.id === c.opcionId)) {
      out.push(error(`Una conexión sale de una opción que ya no existe.`, `Nodo «${nombre(desde.id)}»`));
    }
  }
  for (const n of nodos) {
    const campo = `Nodo «${nombre(n.id)}»`;
    const salidas = conex.filter((c) => c.desdeNodoId === n.id);
    if (esNodoFinal(n.tipo)) {
      if (salidas.length > 0) out.push(aviso('Es un final pero tiene salidas.', campo));
      continue;
    }
    if (n.tipo === 'decision' || n.tipo === 'pregunta') {
      const ops = n.opciones ?? [];
      if (ops.length < 2) out.push(error('Necesita al menos 2 opciones.', campo));
      for (const o of ops) {
        if (!salidas.some((c) => c.opcionId === o.id)) out.push(error(`La opción «${o.texto || o.id}» no lleva a ningún nodo.`, campo));
      }
    } else if (salidas.length === 0) {
      out.push(aviso('No tiene salida: la historia se detiene aquí.', campo));
    }
  }
  if (ids.has(a.nodoInicial)) {
    const alcanzables = nodosAlcanzables(a.nodoInicial, nodos, conex);
    for (const n of nodos) {
      if (!alcanzables.has(n.id)) out.push(aviso('Nunca se llega a este nodo desde el inicio.', `Nodo «${nombre(n.id)}»`));
    }
    if (![...alcanzables].some((id) => esNodoFinal(nodos.find((n) => n.id === id)?.tipo ?? ''))) {
      out.push(aviso('Desde el inicio no se puede llegar a ningún final.'));
    }
  }
  return out;
};

export const validarRuleta = (a: RuletaActivity): P[] => {
  const out: P[] = [];
  const items = a.items ?? [];
  if (items.length < 2) out.push(error('Necesita al menos 2 opciones.'));
  if (items.some((i) => !hayTexto(i.texto))) out.push(aviso('Hay opciones sin texto.'));
  const dup = duplicados(items.map((i) => i.texto ?? ''));
  if (dup.length) out.push(aviso(`Opciones repetidas: ${dup.map((d) => `«${d}»`).join(', ')}.`));
  return out;
};

export const validarTorneo = (a: TorneoActivity): P[] => {
  const out: P[] = [];
  const pregs = a.preguntas ?? [];
  if (pregs.length === 0) return [error('No tiene preguntas.')];
  if (!(a.puntosBase >= 0)) out.push(error('Los puntos base no pueden ser negativos.'));
  pregs.forEach((p, i) => {
    const campo = `Pregunta ${i + 1}`;
    const ops = (p.opciones ?? []).filter((o) => hayTexto(o));
    if (!hayTexto(p.enunciado)) out.push(error('Falta el enunciado.', campo));
    if (ops.length < 2) out.push(error('Necesita al menos 2 opciones con texto.', campo));
    if (!ops.some((o) => o.trim() === (p.correcta ?? '').trim())) out.push(error('La respuesta correcta no es una de las opciones.', campo));
    if (!(p.tiempoSegundos >= 5)) out.push(aviso('El tiempo es muy corto (menos de 5 segundos).', campo));
  });
  return out;
};

export const validarEscapeRoom = (a: EscapeRoomActivity): P[] => {
  const out: P[] = [];
  const salas = a.salas ?? [];
  if (salas.length === 0) return [error('No tiene salas.')];
  salas.forEach((s, i) => {
    const campo = `Sala ${i + 1}`;
    if (!hayTexto(s.nombre)) out.push(aviso('La sala no tiene nombre.', campo));
    if (!hayTexto(s.desafio)) out.push(error('Falta el desafío.', campo));
    if (!hayTexto(s.respuestaCorrecta)) out.push(error('Falta la respuesta correcta.', campo));
    if (s.tipoRespuesta === 'opcion_multiple') {
      const ops = (s.opciones ?? []).filter((o) => hayTexto(o));
      if (ops.length < 2) out.push(error('Necesita al menos 2 opciones con texto.', campo));
      if (hayTexto(s.respuestaCorrecta) && !ops.includes(s.respuestaCorrecta)) out.push(error('La respuesta correcta no es una de las opciones.', campo));
    } else if (s.tipoRespuesta === 'codigo' && hayTexto(s.respuestaCorrecta) && !Number.isFinite(Number(s.respuestaCorrecta))) {
      out.push(error('El código debe ser numérico.', campo));
    }
    if (s.intentosMaximos !== ESCAPE_ROOM_INTENTOS_ILIMITADOS && !(s.intentosMaximos >= 1)) {
      out.push(aviso('Los intentos máximos no son válidos (se usarán 3).', campo));
    }
  });
  return out;
};
