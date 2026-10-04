import { api } from './api';

export interface PubChemResolveResponse {
  name: string;
  smiles: string;
  molecularFormula: string | null;
  cached: boolean;
}

export async function resolvePubChemName(
  name: string,
): Promise<PubChemResolveResponse> {
  const { data } = await api.get<PubChemResolveResponse>(
    '/chemistry/pubchem/resolve',
    { params: { name } },
  );
  return data;
}
