import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import Redis from 'ioredis';

const PUBCHEM_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_SEC = 7 * 24 * 60 * 60;

export interface PubChemResolveResult {
  name: string;
  smiles: string;
  molecularFormula: string | null;
  cached: boolean;
}

interface PubChemPropertyResponse {
  PropertyTable?: {
    Properties?: Array<{
      IsomericSMILES?: string;
      CanonicalSMILES?: string;
      MolecularFormula?: string;
    }>;
  };
}

function normalizeQueryName(name: string): string {
  return name.trim().toLowerCase();
}

@Injectable()
export class ChemistryService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async resolveCompoundByName(rawName: string): Promise<PubChemResolveResult> {
    const name = rawName?.trim();
    if (!name) {
      throw new BadRequestException('El parámetro name es obligatorio');
    }

    const cacheKey = `pubchem:resolve:${normalizeQueryName(name)}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Omit<PubChemResolveResult, 'cached'>;
        return { ...parsed, cached: true };
      }
    } catch {
      /* Redis opcional en dev: seguir sin caché */
    }

    const url = `${PUBCHEM_BASE}/compound/name/${encodeURIComponent(name)}/property/IsomericSMILES,CanonicalSMILES,MolecularFormula/JSON`;

    let response: Response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: 'application/json' },
      });
    } catch {
      throw new ServiceUnavailableException(
        'No se pudo contactar PubChem. Intenta de nuevo más tarde.',
      );
    }

    if (response.status === 404) {
      throw new NotFoundException(`No se encontró un compuesto para "${name}"`);
    }
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `PubChem respondió con estado ${response.status}`,
      );
    }

    const body = (await response.json()) as PubChemPropertyResponse;
    const row = body.PropertyTable?.Properties?.[0];
    const smiles =
      row?.IsomericSMILES?.trim() || row?.CanonicalSMILES?.trim() || '';
    if (!smiles) {
      throw new NotFoundException(
        `PubChem no devolvió SMILES para "${name}"`,
      );
    }

    const result: Omit<PubChemResolveResult, 'cached'> = {
      name,
      smiles,
      molecularFormula: row?.MolecularFormula?.trim() ?? null,
    };

    try {
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_SEC);
    } catch {
      /* ignorar fallo de caché */
    }

    return { ...result, cached: false };
  }
}
