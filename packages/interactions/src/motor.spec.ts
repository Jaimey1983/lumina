import { describe, expect, it } from 'vitest';
import type { Accion } from '@lumina/types/interaction';
import { crearEstadoInicial } from './estado.js';
import { procesarEvento } from './motor.js';
import {
  bool,
  cmp,
  deBloque,
  deSlide,
  lit,
  num,
  regla,
  txt,
  variable,
} from './prueba-utils.js';
import type { EstadoMotor, EventoMotor, ReglaAplicable } from './tipos.js';

const clic = (bloqueId: string, slideId = 's1'): EventoMotor => ({
  tipo: 'clic',
  bloqueId,
  slideId,
});

describe('contador de intentos y pista tras N fallos', () => {
  const variables = [num('intentos')];
  const reglas: ReglaAplicable[] = [
    // Si falla y lleva menos de 3: suma 1 y abre la pista.
    deBloque(
      regla(
        'pista',
        'respuesta_incorrecta',
        [
          { tipo: 'sumar_variable', variableId: 'intentos', cantidad: 1 },
          { tipo: 'abrir_capa', capaId: 'capa-pista' },
        ],
        [cmp(variable('intentos'), '<', lit(3))],
      ),
      'quiz',
    ),
    // Al tercer fallo: refuerzo.
    deBloque(
      regla(
        'refuerzo',
        'respuesta_incorrecta',
        [{ tipo: 'ir_a_slide', slideId: 's-refuerzo' }],
        [cmp(variable('intentos'), '>=', lit(3))],
      ),
      'quiz',
    ),
  ];
  const fallo: EventoMotor = {
    tipo: 'respuesta_incorrecta',
    bloqueId: 'quiz',
    slideId: 's1',
  };

  it('los dos primeros fallos solo suman y muestran la pista; el tercero ya manda a refuerzo', () => {
    // Cada regla ve los cambios de la anterior EN EL MISMO evento: en el tercer
    // fallo `pista` sube intentos de 2 a 3 y `refuerzo` (intentos >= 3) dispara
    // enseguida. Es el comportamiento secuencial documentado en `procesarEvento`.
    let estado: EstadoMotor = crearEstadoInicial(variables);
    const efectos: unknown[][] = [];
    for (let i = 0; i < 4; i++) {
      const r = procesarEvento(reglas, estado, fallo, { variables });
      estado = r.estado;
      efectos.push(r.efectos);
    }
    const navegar = [
      { tipo: 'navegar', destino: { tipo: 'slide', slideId: 's-refuerzo' } },
    ];
    expect(efectos).toEqual([[], [], navegar, navegar]);
    // Desde el 4.º fallo `pista` ya no suma (intentos < 3 es falso): se queda en 3.
    expect(estado.variables.intentos).toBe(3);
    expect(estado.capasAbiertas).toEqual(['capa-pista']);
  });

  it('con el orden inverso de reglas el refuerzo llega un fallo después', () => {
    // El orden del arreglo ES la semántica: refuerzo primero ve intentos sin sumar.
    const invertidas = [reglas[1] as ReglaAplicable, reglas[0] as ReglaAplicable];
    let estado: EstadoMotor = crearEstadoInicial(variables);
    const navegaciones: number[] = [];
    for (let i = 0; i < 4; i++) {
      const r = procesarEvento(invertidas, estado, fallo, { variables });
      estado = r.estado;
      navegaciones.push(r.efectos.length);
    }
    expect(navegaciones).toEqual([0, 0, 0, 1]);
  });

  it('registra la respuesta del bloque', () => {
    const r = procesarEvento(
      reglas,
      crearEstadoInicial(variables),
      fallo,
      { variables },
    );
    expect(r.estado.respuestas.quiz).toBe(false);
  });
});

describe('«visitar todo para avanzar»', () => {
  const variables = [num('vistos')];
  const mostrarSiguiente = (id: string) =>
    deBloque(
      regla(`v-${id}`, 'visitado', [
        { tipo: 'sumar_variable', variableId: 'vistos', cantidad: 1 },
      ]),
      id,
    );
  const reglas: ReglaAplicable[] = [
    mostrarSiguiente('h1'),
    mostrarSiguiente('h2'),
    // Regla de slide: reacciona a los eventos `visitado` de cualquier bloque del slide.
    deSlide(
      regla(
        'habilitar',
        'visitado',
        [{ tipo: 'cambiar_estado', bloqueId: 'btn', estado: 'normal' }, { tipo: 'mostrar', bloqueId: 'btn' }],
        [cmp(variable('vistos'), '>=', lit(2))],
      ),
    ),
  ];

  it('el botón se muestra solo cuando ambos hotspots fueron visitados', () => {
    let estado = crearEstadoInicial(variables);
    estado = procesarEvento(
      reglas,
      estado,
      { tipo: 'visitado', bloqueId: 'h1', slideId: 's1' },
      { variables },
    ).estado;
    expect(estado.visibles.btn).toBeUndefined();
    estado = procesarEvento(
      reglas,
      estado,
      { tipo: 'visitado', bloqueId: 'h2', slideId: 's1' },
      { variables },
    ).estado;
    expect(estado.variables.vistos).toBe(2);
    expect(estado.visibles.btn).toBe(true);
    expect(estado.estados.h1).toBe('visitado');
    expect(estado.estados.h2).toBe('visitado');
  });
});

describe('reglas de slide', () => {
  it('una regla de slide NO reacciona a eventos de otro slide', () => {
    const variables = [num('n')];
    const reglas = [
      deSlide(
        regla('r', 'al_entrar_slide', [
          { tipo: 'sumar_variable', variableId: 'n', cantidad: 1 },
        ]),
        's1',
      ),
    ];
    const base = crearEstadoInicial(variables);
    const otro = procesarEvento(
      reglas,
      base,
      { tipo: 'al_entrar_slide', slideId: 's2' },
      { variables },
    );
    expect(otro.estado.variables.n).toBe(0);
    const propio = procesarEvento(
      reglas,
      base,
      { tipo: 'al_entrar_slide', slideId: 's1' },
      { variables },
    );
    expect(propio.estado.variables.n).toBe(1);
  });

  it('una regla de bloque NO reacciona a otro bloque', () => {
    const variables = [num('n')];
    const reglas = [
      deBloque(
        regla('r', 'clic', [{ tipo: 'sumar_variable', variableId: 'n', cantidad: 1 }]),
        'a',
      ),
    ];
    const r = procesarEvento(
      reglas,
      crearEstadoInicial(variables),
      clic('b'),
      { variables },
    );
    expect(r.estado.variables.n).toBe(0);
  });
});

describe('bucles y límites', () => {
  it('ciclo A→B→A (visitado↔seleccionado) se corta y deja aviso', () => {
    const reglas = [
      deBloque(
        regla('r1', 'visitado', [
          { tipo: 'cambiar_estado', bloqueId: 'x', estado: 'seleccionado' },
        ]),
        'x',
      ),
      deBloque(
        regla('r2', 'seleccionado', [
          { tipo: 'cambiar_estado', bloqueId: 'x', estado: 'visitado' },
        ]),
        'x',
      ),
    ];
    const r = procesarEvento(
      reglas,
      crearEstadoInicial([]),
      { tipo: 'visitado', bloqueId: 'x', slideId: 's1' },
      { variables: [] },
    );
    expect(r.avisos.map((a) => a.codigo)).toContain('ciclo_cortado');
    // Terminó (no se colgó) y el estado es uno de los dos del ciclo.
    expect(['visitado', 'seleccionado']).toContain(r.estado.estados.x);
  });

  it('una cadena más larga que el tope se detiene con aviso', () => {
    // Cada bloque k, al visitarse, "selecciona" k+1… y k+1 al seleccionarse
    // "visita" k+2: una cadena lineal larga, sin ciclo.
    const reglas: ReglaAplicable[] = [];
    for (let k = 0; k < 20; k++) {
      reglas.push(
        deBloque(
          regla(`v${k}`, 'visitado', [
            { tipo: 'cambiar_estado', bloqueId: `b${k + 1}`, estado: 'visitado' },
          ]),
          `b${k}`,
        ),
      );
    }
    const r = procesarEvento(
      reglas,
      crearEstadoInicial([]),
      { tipo: 'visitado', bloqueId: 'b0', slideId: 's1' },
      { variables: [] },
      { profundidadEventos: 3 },
    );
    expect(r.avisos.map((a) => a.codigo)).toContain('profundidad_excedida');
    expect(r.estado.estados.b3).toBe('visitado');
    expect(r.estado.estados.b10).toBeUndefined();
  });

  it('el tope de acciones detiene el procesamiento', () => {
    const acciones: Accion[] = Array.from({ length: 50 }, () => ({
      tipo: 'sumar_variable',
      variableId: 'n',
      cantidad: 1,
    }));
    const variables = [num('n')];
    const r = procesarEvento(
      [deBloque(regla('r', 'clic', acciones), 'a')],
      crearEstadoInicial(variables),
      clic('a'),
      { variables },
      { maxAcciones: 10 },
    );
    expect(r.estado.variables.n).toBe(10);
    expect(r.avisos.map((a) => a.codigo)).toContain('limite_acciones');
  });

  it('solo se conserva la PRIMERA navegación de un evento', () => {
    const r = procesarEvento(
      [
        deBloque(
          regla('r', 'clic', [{ tipo: 'siguiente' }, { tipo: 'anterior' }]),
          'a',
        ),
      ],
      crearEstadoInicial([]),
      clic('a'),
      { variables: [] },
    );
    expect(r.efectos).toEqual([{ tipo: 'navegar', destino: { tipo: 'siguiente' } }]);
    expect(r.avisos.map((a) => a.codigo)).toContain('navegacion_ignorada');
  });
});

describe('robustez: una regla rota nunca lanza', () => {
  it('asignar un valor de tipo equivocado no cambia la variable y avisa', () => {
    const variables = [num('n', 7)];
    const r = procesarEvento(
      [
        deBloque(
          regla('r', 'clic', [
            { tipo: 'asignar_variable', variableId: 'n', valor: lit('texto') },
          ]),
          'a',
        ),
      ],
      crearEstadoInicial(variables),
      clic('a'),
      { variables },
    );
    expect(r.estado.variables.n).toBe(7);
    expect(r.avisos.map((a) => a.codigo)).toEqual(['tipo_incompatible']);
  });

  it('sumar a una variable de texto o con cantidad no finita no cambia nada', () => {
    const variables = [txt('t', 'a'), num('n', 1)];
    const r = procesarEvento(
      [
        deBloque(
          regla('r', 'clic', [
            { tipo: 'sumar_variable', variableId: 't', cantidad: 1 },
            { tipo: 'sumar_variable', variableId: 'n', cantidad: Number.NaN },
            { tipo: 'sumar_variable', variableId: 'n', cantidad: Infinity },
          ]),
          'a',
        ),
      ],
      crearEstadoInicial(variables),
      clic('a'),
      { variables },
    );
    expect(r.estado.variables).toEqual({ t: 'a', n: 1 });
    expect(r.avisos).toHaveLength(3);
  });

  it('variable inexistente en una acción: aviso, sin excepción', () => {
    const r = procesarEvento(
      [
        deBloque(
          regla('r', 'clic', [
            { tipo: 'sumar_variable', variableId: 'borrada', cantidad: 1 },
            { tipo: 'asignar_variable', variableId: 'borrada', valor: lit(1) },
          ]),
          'a',
        ),
      ],
      crearEstadoInicial([]),
      clic('a'),
      { variables: [] },
    );
    expect(r.avisos.map((a) => a.codigo)).toEqual([
      'variable_inexistente',
      'variable_inexistente',
    ]);
  });

  it('asignar copiando otra variable respeta el tipo', () => {
    const variables = [bool('a', true), bool('b', false), num('n', 3)];
    const ok = procesarEvento(
      [
        deBloque(
          regla('r', 'clic', [
            { tipo: 'asignar_variable', variableId: 'b', valor: variable('a') },
          ]),
          'x',
        ),
      ],
      crearEstadoInicial(variables),
      clic('x'),
      { variables },
    );
    expect(ok.estado.variables.b).toBe(true);
    const mal = procesarEvento(
      [
        deBloque(
          regla('r', 'clic', [
            { tipo: 'asignar_variable', variableId: 'b', valor: variable('n') },
          ]),
          'x',
        ),
      ],
      crearEstadoInicial(variables),
      clic('x'),
      { variables },
    );
    expect(mal.estado.variables.b).toBe(false);
    expect(mal.avisos[0]?.codigo).toBe('tipo_incompatible');
  });

  it('una regla inactiva no se evalúa', () => {
    const variables = [num('n')];
    const r = procesarEvento(
      [
        deBloque(
          regla(
            'r',
            'clic',
            [{ tipo: 'sumar_variable', variableId: 'n', cantidad: 1 }],
            [],
            false,
          ),
          'a',
        ),
      ],
      crearEstadoInicial(variables),
      clic('a'),
      { variables },
    );
    expect(r.estado.variables.n).toBe(0);
  });
});

describe('estado de objeto y capas', () => {
  it('visitado no degrada a seleccionado ni toca a un bloque deshabilitado', () => {
    const base: EstadoMotor = {
      ...crearEstadoInicial([]),
      estados: { sel: 'seleccionado', off: 'deshabilitado' },
    };
    const r1 = procesarEvento([], base, { tipo: 'visitado', bloqueId: 'sel', slideId: 's' }, { variables: [] });
    expect(r1.estado.estados.sel).toBe('seleccionado');
    const r2 = procesarEvento([], base, { tipo: 'seleccionado', bloqueId: 'off', slideId: 's' }, { variables: [] });
    expect(r2.estado.estados.off).toBe('deshabilitado');
  });

  it('abrir dos veces una capa no la duplica; cerrar la quita', () => {
    const r = procesarEvento(
      [
        deBloque(
          regla('r', 'clic', [
            { tipo: 'abrir_capa', capaId: 'c' },
            { tipo: 'abrir_capa', capaId: 'c' },
            { tipo: 'abrir_capa', capaId: 'd' },
            { tipo: 'cerrar_capa', capaId: 'c' },
          ]),
          'a',
        ),
      ],
      crearEstadoInicial([]),
      clic('a'),
      { variables: [] },
    );
    expect(r.estado.capasAbiertas).toEqual(['d']);
  });
});

describe('pureza y determinismo', () => {
  const variables = [num('n')];
  const reglas = [
    deBloque(
      regla('r', 'clic', [
        { tipo: 'sumar_variable', variableId: 'n', cantidad: 1 },
        { tipo: 'abrir_capa', capaId: 'c' },
        { tipo: 'cambiar_estado', bloqueId: 'a', estado: 'visitado' },
      ]),
      'a',
    ),
  ];

  it('no muta el estado de entrada', () => {
    const base = crearEstadoInicial(variables);
    const copia = JSON.stringify(base);
    procesarEvento(reglas, base, clic('a'), { variables });
    expect(JSON.stringify(base)).toBe(copia);
  });

  it('mismo estado + reglas + evento → mismo resultado', () => {
    const a = procesarEvento(reglas, crearEstadoInicial(variables), clic('a'), { variables });
    const b = procesarEvento(reglas, crearEstadoInicial(variables), clic('a'), { variables });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('el estado devuelto es JSON puro (K5 lo persiste) y sobrevive a un viaje por JSON', () => {
    const r = procesarEvento(reglas, crearEstadoInicial(variables), clic('a'), { variables });
    const restaurado = JSON.parse(JSON.stringify(r.estado)) as EstadoMotor;
    const sig = procesarEvento(reglas, restaurado, clic('a'), { variables });
    expect(sig.estado.variables.n).toBe(2);
  });

  it('las reglas se evalúan en el orden del arreglo', () => {
    const vs = [txt('t', '')];
    const orden = (a: string, b: string) =>
      procesarEvento(
        [
          deBloque(regla('1', 'clic', [{ tipo: 'asignar_variable', variableId: 't', valor: lit(a) }]), 'x'),
          deBloque(regla('2', 'clic', [{ tipo: 'asignar_variable', variableId: 't', valor: lit(b) }]), 'x'),
        ],
        crearEstadoInicial(vs),
        clic('x'),
        { variables: vs },
      ).estado.variables.t;
    expect(orden('uno', 'dos')).toBe('dos');
    expect(orden('dos', 'uno')).toBe('uno');
  });

  it('ids de bloque peligrosos (__proto__, constructor) no contaminan ni rompen', () => {
    const r = procesarEvento(
      [
        deBloque(
          regla('r', 'clic', [
            { tipo: 'cambiar_estado', bloqueId: '__proto__', estado: 'visitado' },
            { tipo: 'mostrar', bloqueId: 'constructor' },
          ]),
          'a',
        ),
      ],
      crearEstadoInicial([]),
      clic('a'),
      { variables: [] },
    );
    expect(Object.hasOwn(r.estado.estados, '__proto__')).toBe(true);
    expect(({} as Record<string, unknown>).visitado).toBeUndefined();
    expect(r.estado.visibles.constructor).toBe(true);
  });
});

describe('regla con condición rota (integración)', () => {
  it('una regla con no(variable borrada) NO se dispara y deja aviso', () => {
    const variables = [num('n')];
    const r = procesarEvento(
      [
        deBloque(
          regla(
            'r',
            'clic',
            [{ tipo: 'sumar_variable', variableId: 'n', cantidad: 1 }],
            [{ tipo: 'no', condicion: cmp(variable('borrada'), '==', lit(1)) }],
          ),
          'a',
        ),
      ],
      crearEstadoInicial(variables),
      clic('a'),
      { variables },
    );
    expect(r.estado.variables.n).toBe(0);
    expect(r.avisos.map((a) => a.codigo)).toContain('variable_inexistente');
  });
});
