import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChemistryService } from './chemistry.service';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('ioredis', () => jest.fn().mockImplementation(() => mockRedis));

describe('ChemistryService', () => {
  let service: ChemistryService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    service = new ChemistryService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('rechaza name vacío', async () => {
    await expect(service.resolveCompoundByName('  ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('devuelve resultado cacheado', async () => {
    global.fetch = jest.fn() as typeof fetch;
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({
        name: 'water',
        smiles: 'O',
        molecularFormula: 'H2O',
      }),
    );
    const result = await service.resolveCompoundByName('water');
    expect(result).toEqual({
      name: 'water',
      smiles: 'O',
      molecularFormula: 'H2O',
      cached: true,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('consulta PubChem y guarda en caché', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          PropertyTable: {
            Properties: [
              {
                IsomericSMILES: 'CCO',
                MolecularFormula: 'C2H6O',
              },
            ],
          },
        }),
    }) as typeof fetch;

    const result = await service.resolveCompoundByName('ethanol');
    expect(result.smiles).toBe('CCO');
    expect(result.molecularFormula).toBe('C2H6O');
    expect(result.cached).toBe(false);
    expect(mockRedis.set).toHaveBeenCalled();
  });

  it('404 cuando PubChem no encuentra el compuesto', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as typeof fetch;

    await expect(
      service.resolveCompoundByName('xyznotreal'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
