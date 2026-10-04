export interface ElementRecord {
  Z: number;
  symbol: string;
  nombre: string;
  periodo: number;
  grupo: number | null;
  masaAtomica: number;
  categoria?: string;
}

export interface ElementsDataset {
  sourceVersion: string;
  license: string;
  elements: ElementRecord[];
}
