import type { Block } from "@lumina/types/slide";
import type { EditorPersistHost } from "@lumina/editor-shared/editor-persist-host";

export type PrimitivePropertyApplyProps = {
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
  onChange?: (updated: Block) => void;
};

/** Cablea `persistHost` del panel (P3) al panel legacy de primitivos. */
export function primitivePropertyApplyProps<T extends Block>(
  persistHost: EditorPersistHost | undefined,
  onChange: (updated: T) => void,
  estado: T,
  tipo: T["tipo"],
): PrimitivePropertyApplyProps {
  if (persistHost) {
    return {
      applyNow: async (actualizar) => {
        persistHost.clearScheduled();
        await persistHost.persistNow(actualizar);
      },
      scheduleApply: (actualizar) => {
        persistHost.applyLocal(actualizar);
        persistHost.schedulePersist(actualizar);
      },
      clearDebounce: () => persistHost.clearScheduled(),
      onChange: (updated) => {
        if (updated.tipo === tipo) onChange(updated as T);
      },
    };
  }
  const emit = (actualizar: (b: Block) => Block) => {
    const siguiente = actualizar(estado);
    if (siguiente.tipo === tipo) {
      onChange(siguiente as T);
    }
  };
  return {
    applyNow: async (actualizar) => {
      emit(actualizar);
    },
    scheduleApply: (actualizar) => {
      emit(actualizar);
    },
    onChange: (updated) => {
      if (updated.tipo === tipo) onChange(updated as T);
    },
  };
}
