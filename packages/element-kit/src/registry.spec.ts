import { describe, expect, it, expectTypeOf } from "vitest";
import { ElementRegistry, type ElementDefinition, type ElementEditorProps, type ElementPropsPanelProps } from "./index.js";

const definicion = {
  tipo: "prueba" as const,
  crearPorDefecto: () => ({ texto: "Hola" }),
  Editor: () => null,
  Viewer: () => null,
  Propiedades: () => null,
  apariencia: { color: true, tipografia: true, animacion: false },
} satisfies ElementDefinition<{ texto: string }, { color: string }>;

const numero = {
  ...definicion, tipo: "numero" as const, crearPorDefecto: () => 0,
} satisfies ElementDefinition<number, { color: string }>;

type Catalogo = { prueba: typeof definicion; numero: typeof numero; inexistente: never };

describe("ElementRegistry", () => {
  it("registra y obtiene una definición sin copiarla", () => {
    const registry = new ElementRegistry<Catalogo>();
    registry.registrar(definicion);
    expect(registry.obtener("prueba")).toBe(definicion);
    expect(registry.obtener("inexistente")).toBeUndefined();
    expectTypeOf(registry.obtener("prueba")).toEqualTypeOf<typeof definicion | undefined>();
  });

  it("rechaza duplicados y conserva el original", () => {
    const registry = new ElementRegistry<Catalogo>();
    registry.registrar(definicion);
    expect(() => registry.registrar({ ...definicion })).toThrow("Elemento duplicado: prueba");
    expect(registry.obtener("prueba")).toBe(definicion);
  });

  it("admite estados heterogéneos y devuelve una lista independiente", () => {
    const registry = new ElementRegistry<Catalogo>();
    registry.registrar(definicion);
    const anterior = registry.listar();
    registry.registrar(numero);
    expect(anterior).toHaveLength(1);
    expect(registry.listar().map(({ tipo }) => tipo)).toEqual(["prueba", "numero"]);
  });
});

it("fija el estado, las props y el delegado de puntuación", () => {
  expectTypeOf(definicion.crearPorDefecto).returns.toEqualTypeOf<{ texto: string }>();
  expectTypeOf<NonNullable<ElementDefinition<number, object>["puntuacion"]>>().toEqualTypeOf<(estado: number) => number>();
  expectTypeOf<ElementEditorProps<number, string>["onChange"]>().toEqualTypeOf<(estado: number) => void>();
  expectTypeOf<ElementPropsPanelProps<number, string>["onConfigChange"]>().toEqualTypeOf<(config: string) => void>();
  // @ts-expect-error El contrato exige todos los componentes y la apariencia.
  const incompleta: ElementDefinition<number, object> = { tipo: "incompleta" };
  expect(incompleta.tipo).toBe("incompleta");
});
