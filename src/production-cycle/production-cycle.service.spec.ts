import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductionCycleService } from './production-cycle.service';

const mockRepository = () => {
  const repo: any = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
  };
  repo.manager = {
    transaction: jest.fn(async (cb) => cb(repo)),
  };
  return repo;
};

describe('ProductionCycleService', () => {
  let service: ProductionCycleService;
  let cycleRepo: jest.Mocked<ReturnType<typeof mockRepository>>;
  let harvestRepo: jest.Mocked<ReturnType<typeof mockRepository>>;
  let inputRepo: jest.Mocked<ReturnType<typeof mockRepository>>;
  let fieldRepo: jest.Mocked<ReturnType<typeof mockRepository>>;
  let cropRepo: jest.Mocked<ReturnType<typeof mockRepository>>;

  beforeEach(() => {
    cycleRepo = mockRepository() as any;
    harvestRepo = mockRepository() as any;
    inputRepo = mockRepository() as any;
    fieldRepo = mockRepository() as any;
    cropRepo = mockRepository() as any;
    service = new ProductionCycleService(
      cycleRepo as any,
      harvestRepo as any,
      inputRepo as any,
      fieldRepo as any,
      cropRepo as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      fieldId: 1,
      cropId: 1,
      sowingDate: '2026-01-15',
      expectedHarvestDate: '2026-06-15',
      estimatedYield: 30,
    };

    it('should create a cycle when the field and crop exist and have no open cycle', async () => {
      fieldRepo.findOne.mockResolvedValue({ id: 1, farm: { id: 1 } } as any);
      cropRepo.findOneBy.mockResolvedValue({ id: 1 } as any);
      cycleRepo.findOne.mockResolvedValue(null);
      cycleRepo.create.mockReturnValue(dto as any);
      cycleRepo.save.mockResolvedValue({ id: 1, ...dto, status: 'OPEN' } as any);

      const result = await service.create(dto as any);

      expect(result.status).toBe('OPEN');
      expect(cycleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ fieldId: 1, cropId: 1, currentCostPerArea: 0, status: 'OPEN' }),
      );
    });

    it('should throw NotFoundException when the field does not exist', async () => {
      fieldRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when the parent farm is deactivated', async () => {
      fieldRepo.findOne.mockResolvedValue({ id: 1 } as any); // no farm

      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when the crop does not exist', async () => {
      fieldRepo.findOne.mockResolvedValue({ id: 1, farm: { id: 1 } } as any);
      cropRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when the field already has an open cycle', async () => {
      fieldRepo.findOne.mockResolvedValue({ id: 1, farm: { id: 1 } } as any);
      cropRepo.findOneBy.mockResolvedValue({ id: 1 } as any);
      cycleRepo.findOne.mockResolvedValue({ id: 5, status: 'OPEN' } as any);

      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all cycles with their financial summary', async () => {
      const cycles = [{ id: 1 }];
      cycleRepo.find.mockResolvedValue(cycles as any);

      const result = await service.findAll();

      expect(result).toEqual([{ id: 1, totalRevenue: 0, totalCost: 0, grossMargin: 0 }]);
    });

    it('should compute revenue and cost from harvests and inputs', async () => {
      const cycles = [{
        id: 1,
        harvests: [{ quantitySold: 10, unitSalePrice: 50 }],
        inputs: [{ quantity: 5, unitCost: 20 }],
      }];
      cycleRepo.find.mockResolvedValue(cycles as any);

      const result = await service.findAll();

      expect(result[0].totalRevenue).toBe(500);
      expect(result[0].totalCost).toBe(100);
      expect(result[0].grossMargin).toBe(400);
    });
  });

  describe('findOne', () => {
    it('should return a cycle by id with financial summary', async () => {
      const cycle = { id: 1, harvests: [], inputs: [] };
      cycleRepo.findOne.mockResolvedValue(cycle as any);

      const result = await service.findOne(1);

      expect(result).toEqual({ id: 1, harvests: [], inputs: [], totalRevenue: 0, totalCost: 0, grossMargin: 0 });
    });

    it('should throw NotFoundException when the cycle does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should compute financial summary from loaded relations', async () => {
      const cycle = {
        id: 1,
        harvests: [{ quantitySold: 20, unitSalePrice: 100 }],
        inputs: [{ quantity: 3, unitCost: 50 }],
      };
      cycleRepo.findOne.mockResolvedValue(cycle as any);

      const result = await service.findOne(1);

      expect(result.totalRevenue).toBe(2000);
      expect(result.totalCost).toBe(150);
      expect(result.grossMargin).toBe(1850);
    });
  });

  describe('update', () => {
    it('should update estimatedYield of an open cycle', async () => {
      const cycle = { id: 1, status: 'OPEN', estimatedYield: 30, sowingDate: '2026-01-15', expectedHarvestDate: '2026-06-15' };
      cycleRepo.findOne.mockResolvedValue(cycle as any);
      cycleRepo.save.mockResolvedValue({ ...cycle, estimatedYield: 40 } as any);

      const result = await service.update(1, { estimatedYield: 40 } as any);

      expect(result.estimatedYield).toBe(40);
    });

    it('should update sowingDate', async () => {
      const cycle = { id: 1, status: 'OPEN', sowingDate: '2026-01-15', expectedHarvestDate: '2026-06-15', estimatedYield: 30 };
      cycleRepo.findOne.mockResolvedValue(cycle as any);
      cycleRepo.save.mockResolvedValue({ ...cycle, sowingDate: '2026-02-01' } as any);

      const result = await service.update(1, { sowingDate: '2026-02-01' } as any);

      expect(result.sowingDate).toBe('2026-02-01');
    });

    it('should update expectedHarvestDate', async () => {
      const cycle = { id: 1, status: 'OPEN', sowingDate: '2026-01-15', expectedHarvestDate: '2026-06-15', estimatedYield: 30 };
      cycleRepo.findOne.mockResolvedValue(cycle as any);
      cycleRepo.save.mockResolvedValue({ ...cycle, expectedHarvestDate: '2026-07-01' } as any);

      const result = await service.update(1, { expectedHarvestDate: '2026-07-01' } as any);

      expect(result.expectedHarvestDate).toBe('2026-07-01');
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.update(1, {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when the cycle does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft remove an open cycle by default', async () => {
      const cycle = { id: 1, status: 'OPEN' };
      cycleRepo.findOne.mockResolvedValue(cycle as any);

      await service.remove(1);

      expect(cycleRepo.softRemove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, status: 'OPEN' }),
      );
      expect(cycleRepo.remove).not.toHaveBeenCalled();
    });

    it('should hard remove an open cycle when hard=true', async () => {
      const cycle = { id: 1, status: 'OPEN' };
      cycleRepo.findOne.mockResolvedValue(cycle as any);

      await service.remove(1, true);

      expect(cycleRepo.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, status: 'OPEN' }),
      );
      expect(cycleRepo.softRemove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to delete a closed cycle', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      expect(cycleRepo.softRemove).not.toHaveBeenCalled();
      expect(cycleRepo.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the cycle does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('close', () => {
    const baseCycle = {
      id: 1,
      status: 'OPEN',
      estimatedYield: 30,
      field: { id: 10, name: 'Lote 1' },
      crop: { id: 1 },
      harvests: [
        { quantityObtained: 20, quantitySold: 18, unitSalePrice: 100 },
        { quantityObtained: 10, quantitySold: 10, unitSalePrice: 100 },
      ],
      inputs: [{ quantity: 5, unitCost: 20 }],
    };

    it('should throw NotFoundException when the cycle does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue(null);

      await expect(service.close(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when the cycle is already closed', async () => {
      cycleRepo.findOne.mockResolvedValue({ ...baseCycle, status: 'CLOSED' } as any);

      await expect(service.close(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when there are no harvests', async () => {
      cycleRepo.findOne
        .mockResolvedValueOnce({ ...baseCycle } as any)       // lock query
        .mockResolvedValueOnce({ ...baseCycle, harvests: [] } as any); // relations query

      await expect(service.close(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when harvests array is null', async () => {
      cycleRepo.findOne
        .mockResolvedValueOnce({ ...baseCycle } as any)
        .mockResolvedValueOnce({ ...baseCycle, harvests: null } as any);

      await expect(service.close(1)).rejects.toThrow(BadRequestException);
    });

    it('should close a cycle and compute financials without historical data', async () => {
      cycleRepo.findOne
        .mockResolvedValueOnce({ ...baseCycle } as any)  // lock query
        .mockResolvedValueOnce({ ...baseCycle } as any); // relations query
      cycleRepo.find.mockResolvedValue([]); // no closed historical cycles
      cycleRepo.save.mockImplementation(async (c: any) => c);

      const result = await service.close(1);

      expect(result.realYield).toBe(30);
      expect(result.historicalAvgYield).toBeNull();
      expect(result.yieldAlert).toBe(false);
      expect(result.cycle.status).toBe('CLOSED');
      expect(result.cycle.totalRevenueAtClose).toBe(18 * 100 + 10 * 100);
      expect(result.cycle.totalCostAtClose).toBe(5 * 20);
      expect(result.cycle.grossMarginAtClose).toBe(2800 - 100);
    });

    it('should raise a yield alert when the drop exceeds 20% of the historical average', async () => {
      const lowYieldCycle = { ...baseCycle, harvests: [{ quantityObtained: 5, quantitySold: 5, unitSalePrice: 100 }] };
      cycleRepo.findOne
        .mockResolvedValueOnce(lowYieldCycle as any)  // lock query
        .mockResolvedValueOnce(lowYieldCycle as any); // relations query
      cycleRepo.find.mockResolvedValue([
        { id: 2, harvests: [{ quantityObtained: 50 }] },
      ] as any);
      cycleRepo.save.mockImplementation(async (c: any) => c);

      const result = await service.close(1);

      expect(result.yieldAlert).toBe(true);
      expect(result.alertMessage).toContain('Lote 1');
      expect(result.historicalAvgYield).toBe(50);
    });

    it('should NOT raise a yield alert when the drop is within 20% threshold', async () => {
      // Yield of 42 vs historical average of 50 => 16% drop, within threshold
      const okCycle = { ...baseCycle, harvests: [{ quantityObtained: 42, quantitySold: 40, unitSalePrice: 100 }] };
      cycleRepo.findOne
        .mockResolvedValueOnce(okCycle as any)
        .mockResolvedValueOnce(okCycle as any);
      cycleRepo.find.mockResolvedValue([
        { id: 2, harvests: [{ quantityObtained: 50 }] },
      ] as any);
      cycleRepo.save.mockImplementation(async (c: any) => c);

      const result = await service.close(1);

      expect(result.yieldAlert).toBe(false);
      expect(result.alertMessage).toBeNull();
    });

    it('should exclude the current cycle from the historical average', async () => {
      cycleRepo.findOne
        .mockResolvedValueOnce({ ...baseCycle } as any)  // lock query
        .mockResolvedValueOnce({ ...baseCycle } as any); // relations query
      cycleRepo.find.mockResolvedValue([
        { id: 1, harvests: [{ quantityObtained: 999 }] }, // same cycle, must be excluded
        { id: 2, harvests: [{ quantityObtained: 40 }] },
      ] as any);
      cycleRepo.save.mockImplementation(async (c: any) => c);

      const result = await service.close(1);

      expect(result.historicalAvgYield).toBe(40);
    });

    it('should handle a cycle with no inputs (zero cost)', async () => {
      const noInputsCycle = { ...baseCycle, inputs: [] };
      cycleRepo.findOne
        .mockResolvedValueOnce(noInputsCycle as any)
        .mockResolvedValueOnce(noInputsCycle as any);
      cycleRepo.find.mockResolvedValue([]);
      cycleRepo.save.mockImplementation(async (c: any) => c);

      const result = await service.close(1);

      expect(result.cycle.totalCostAtClose).toBe(0);
      expect(result.cycle.grossMarginAtClose).toBe(result.cycle.totalRevenueAtClose);
    });

    it('should compute realYield as sum of all harvest quantityObtained', async () => {
      const multiHarvestCycle = {
        ...baseCycle,
        harvests: [
          { quantityObtained: 15, quantitySold: 10, unitSalePrice: 100 },
          { quantityObtained: 25, quantitySold: 20, unitSalePrice: 100 },
          { quantityObtained: 10, quantitySold: 8, unitSalePrice: 100 },
        ],
      };
      cycleRepo.findOne
        .mockResolvedValueOnce(multiHarvestCycle as any)
        .mockResolvedValueOnce(multiHarvestCycle as any);
      cycleRepo.find.mockResolvedValue([]);
      cycleRepo.save.mockImplementation(async (c: any) => c);

      const result = await service.close(1);

      expect(result.realYield).toBe(50); // 15 + 25 + 10
      expect(result.cycle.realYieldAtClose).toBe(50);
    });

    it('should return estimatedYield from the original cycle', async () => {
      cycleRepo.findOne
        .mockResolvedValueOnce({ ...baseCycle } as any)
        .mockResolvedValueOnce({ ...baseCycle } as any);
      cycleRepo.find.mockResolvedValue([]);
      cycleRepo.save.mockImplementation(async (c: any) => c);

      const result = await service.close(1);

      expect(result.estimatedYield).toBe(30);
    });
  });
});
