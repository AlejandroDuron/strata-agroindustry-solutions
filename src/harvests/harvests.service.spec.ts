import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HarvestsService } from './harvests.service';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
});

describe('HarvestsService', () => {
  let service: HarvestsService;
  let harvestRepo: jest.Mocked<ReturnType<typeof mockRepository>>;
  let cycleRepo: jest.Mocked<ReturnType<typeof mockRepository>>;

  beforeEach(() => {
    harvestRepo = mockRepository() as any;
    cycleRepo = mockRepository() as any;
    service = new HarvestsService(harvestRepo as any, cycleRepo as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { cycleId: 1, quantityObtained: 25.5, quality: 'A', unitSalePrice: 120, quantitySold: 22 };

    it('should create a harvest when the cycle is open', async () => {
      cycleRepo.findOneBy.mockResolvedValue({ id: 1, status: 'OPEN' } as any);
      harvestRepo.create.mockReturnValue(dto as any);
      harvestRepo.save.mockResolvedValue({ id: 1, ...dto } as any);

      const result = await service.create(dto as any);

      expect(result).toEqual({ id: 1, ...dto });
    });

    it('should throw NotFoundException when the cycle does not exist', async () => {
      cycleRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      cycleRepo.findOneBy.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByCycle', () => {
    it('should return harvests of a cycle', async () => {
      const harvests = [{ id: 1 }];
      harvestRepo.find.mockResolvedValue(harvests as any);

      const result = await service.findAllByCycle(1);

      expect(harvestRepo.find).toHaveBeenCalledWith({
        where: { productionCycleId: 1 },
        order: { id: 'ASC' },
      });
      expect(result).toEqual(harvests);
    });
  });

  describe('findAll', () => {
    it('should return all harvests with their cycle', async () => {
      const harvests = [{ id: 1 }, { id: 2 }];
      harvestRepo.find.mockResolvedValue(harvests as any);

      const result = await service.findAll();

      expect(result).toEqual(harvests);
    });
  });

  describe('findOne', () => {
    it('should return a harvest by id', async () => {
      const harvest = { id: 1, productionCycle: { status: 'OPEN' } };
      harvestRepo.findOne.mockResolvedValue(harvest as any);

      const result = await service.findOne(1);

      expect(result).toEqual(harvest);
    });

    it('should throw NotFoundException when the harvest does not exist', async () => {
      harvestRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a harvest when the cycle is open', async () => {
      const harvest = { id: 1, quantityObtained: 20, productionCycle: { status: 'OPEN' } };
      harvestRepo.findOne.mockResolvedValue(harvest as any);
      harvestRepo.save.mockResolvedValue({ ...harvest, quantityObtained: 30 } as any);

      const result = await service.update(1, { quantityObtained: 30 } as any);

      expect(result.quantityObtained).toBe(30);
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      const harvest = { id: 1, productionCycle: { status: 'CLOSED' } };
      harvestRepo.findOne.mockResolvedValue(harvest as any);

      await expect(service.update(1, {} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a harvest when the cycle is open', async () => {
      const harvest = { id: 1, productionCycle: { status: 'OPEN' } };
      harvestRepo.findOne.mockResolvedValue(harvest as any);

      await service.remove(1);

      expect(harvestRepo.remove).toHaveBeenCalledWith(harvest);
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      const harvest = { id: 1, productionCycle: { status: 'CLOSED' } };
      harvestRepo.findOne.mockResolvedValue(harvest as any);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      expect(harvestRepo.remove).not.toHaveBeenCalled();
    });
  });
});
