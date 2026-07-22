import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InputsService } from './inputs.service';
import { InputType } from './entities/input.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
});

describe('InputsService', () => {
  let service: InputsService;
  let inputRepo: jest.Mocked<ReturnType<typeof mockRepository>>;
  let cycleRepo: jest.Mocked<ReturnType<typeof mockRepository>>;

  beforeEach(() => {
    inputRepo = mockRepository() as any;
    cycleRepo = mockRepository() as any;
    service = new InputsService(inputRepo as any, cycleRepo as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const dto = {
    name: 'Urea 46%',
    type: InputType.FERTILIZER,
    quantity: 10,
    unitCost: 15,
    unit: 'kg',
    applicationDate: '2026-07-21',
  };

  describe('create', () => {
    it('should create an input and recalculate the cycle cost', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01', field: { area: 5 } } as any);
      inputRepo.create.mockReturnValue({ ...dto, productionCycleId: 1 } as any);
      inputRepo.save.mockResolvedValue({ id: 1, ...dto, productionCycleId: 1 } as any);
      inputRepo.find.mockResolvedValue([{ quantity: 10, unitCost: 15 }] as any);

      const result = await service.create(1, dto as any);

      expect(result).toMatchObject({ id: 1, name: 'Urea 46%' });
      expect(cycleRepo.update).toHaveBeenCalledWith(1, { currentCostPerArea: (10 * 15) / 5 });
    });

    it('should throw NotFoundException when the cycle does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue(null);

      await expect(service.create(999, dto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.create(1, dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when applicationDate is before the cycle sowingDate', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-08-01', field: { area: 5 } } as any);

      await expect(
        service.create(1, { ...dto, applicationDate: '2026-07-15' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set currentCostPerArea to 0 when field area is 0', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01', field: { area: 0 } } as any);
      inputRepo.create.mockReturnValue({ ...dto, productionCycleId: 1 } as any);
      inputRepo.save.mockResolvedValue({ id: 1, ...dto, productionCycleId: 1 } as any);
      inputRepo.find.mockResolvedValue([{ quantity: 10, unitCost: 15 }] as any);

      await service.create(1, dto as any);

      expect(cycleRepo.update).toHaveBeenCalledWith(1, { currentCostPerArea: 0 });
    });
  });

  describe('findAll', () => {
    it('should return inputs of a cycle', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1 } as any);
      const inputs = [{ id: 1 }];
      inputRepo.find.mockResolvedValue(inputs as any);

      const result = await service.findAll(1);

      expect(result).toEqual(inputs);
    });

    it('should throw NotFoundException when the cycle does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue(null);

      await expect(service.findAll(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return an input by id', async () => {
      const input = { id: 1 };
      inputRepo.findOne.mockResolvedValue(input as any);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(input);
    });

    it('should throw NotFoundException when the input does not exist', async () => {
      inputRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an input and recalculate the cycle cost', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01', field: { area: 5 } } as any);
      inputRepo.findOne.mockResolvedValue({ id: 1, ...dto, applicationDate: '2026-07-21' } as any);
      inputRepo.save.mockImplementation(async (i: any) => i);
      inputRepo.find.mockResolvedValue([{ quantity: 20, unitCost: 15 }] as any);

      const result = await service.update(1, 1, { quantity: 20 } as any);

      expect(result.quantity).toBe(20);
      expect(cycleRepo.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.update(1, 1, {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when updated applicationDate is before sowingDate', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-06-01', field: { area: 5 } } as any);
      inputRepo.findOne.mockResolvedValue({ id: 1, ...dto, applicationDate: '2026-07-21' } as any);

      await expect(
        service.update(1, 1, { applicationDate: '2026-05-15' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when the input does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01', field: { area: 5 } } as any);
      inputRepo.findOne.mockResolvedValue(null);

      await expect(service.update(1, 999, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should update the inputType when type is changed', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01', field: { area: 5 } } as any);
      inputRepo.findOne.mockResolvedValue({ id: 1, ...dto, inputType: InputType.FERTILIZER, applicationDate: '2026-07-21' } as any);
      inputRepo.save.mockImplementation(async (i: any) => i);
      inputRepo.find.mockResolvedValue([{ quantity: 10, unitCost: 15 }] as any);

      const result = await service.update(1, 1, { type: InputType.PESTICIDE } as any);

      expect(result.inputType).toBe(InputType.PESTICIDE);
    });
  });

  describe('remove', () => {
    it('should remove an input and recalculate the cycle cost', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', field: { area: 5 } } as any);
      const input = { id: 1 };
      inputRepo.findOne.mockResolvedValue(input as any);
      inputRepo.find.mockResolvedValue([]);

      await service.remove(1, 1);

      expect(inputRepo.remove).toHaveBeenCalledWith(input);
      expect(cycleRepo.update).toHaveBeenCalledWith(1, { currentCostPerArea: 0 });
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.remove(1, 1)).rejects.toThrow(BadRequestException);
    });
  });
});
