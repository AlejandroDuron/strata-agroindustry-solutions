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
    it('should return all cycles with their relations', async () => {
      const cycles = [{ id: 1 }];
      cycleRepo.find.mockResolvedValue(cycles as any);

      const result = await service.findAll();

      expect(result).toEqual([{ id: 1, totalRevenue: 0, totalCost: 0, grossMargin: 0 }]);
    });
  });

  describe('findOne', () => {
    it('should return a cycle by id', async () => {
      const cycle = { id: 1 };
      cycleRepo.findOne.mockResolvedValue(cycle as any);

      const result = await service.findOne(1);

      expect(result).toEqual({ id: 1, totalRevenue: 0, totalCost: 0, grossMargin: 0 });
    });

    it('should throw NotFoundException when the cycle does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update simple fields of an open cycle', async () => {
      const cycle = { id: 1, status: 'OPEN', estimatedYield: 30 };
      cycleRepo.findOne.mockResolvedValue(cycle as any);
      cycleRepo.save.mockResolvedValue({ ...cycle, estimatedYield: 40 } as any);

      const result = await service.update(1, { estimatedYield: 40 } as any);

      expect(result.estimatedYield).toBe(40);
    });



    it('should throw BadRequestException when the cycle is closed', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.update(1, {} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove an existing cycle', async () => {
      const cycle = { id: 1, status: 'OPEN' };
      cycleRepo.findOne.mockResolvedValue(cycle as any);

      await service.remove(1);

      expect(cycleRepo.softRemove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, status: 'OPEN' }),
      );
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
  });
});
