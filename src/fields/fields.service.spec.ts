import { ConflictException, NotFoundException } from '@nestjs/common';
import { FieldsService } from './fields.service';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softRemove: jest.fn(),
  count: jest.fn(),
});

const mockFarmsService = () => ({
  findActiveOrThrow: jest.fn(),
});

describe('FieldsService', () => {
  let service: FieldsService;
  let fieldRepository: jest.Mocked<ReturnType<typeof mockRepository>>;
  let cycleRepository: jest.Mocked<ReturnType<typeof mockRepository>>;
  let farmsService: jest.Mocked<ReturnType<typeof mockFarmsService>>;

  beforeEach(() => {
    fieldRepository = mockRepository() as any;
    cycleRepository = mockRepository() as any;
    farmsService = mockFarmsService() as any;
    service = new FieldsService(fieldRepository as any, cycleRepository as any, farmsService as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a field when the farm is active', async () => {
      const dto = { farmId: 1, name: 'Lote 1', area: 5.5 };
      farmsService.findActiveOrThrow.mockResolvedValue({ id: 1 } as any);
      fieldRepository.findOne.mockResolvedValue(null);
      fieldRepository.create.mockReturnValue(dto as any);
      fieldRepository.save.mockResolvedValue({ id: 1, ...dto } as any);

      const result = await service.create(dto as any);

      expect(farmsService.findActiveOrThrow).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, ...dto });
    });

    it('should propagate the error when the farm is not active', async () => {
      farmsService.findActiveOrThrow.mockRejectedValue(new NotFoundException());

      await expect(service.create({ farmId: 999 } as any)).rejects.toThrow(NotFoundException);
      expect(fieldRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAllByFarm', () => {
    it('should return the fields of a farm', async () => {
      const fields = [{ id: 1 }, { id: 2 }];
      fieldRepository.find.mockResolvedValue(fields as any);

      const result = await service.findAllByFarm(1);

      expect(fieldRepository.find).toHaveBeenCalledWith({
        where: { farmId: 1 },
        order: { id: 'ASC' },
      });
      expect(result).toEqual(fields);
    });
  });

  describe('findOneOrThrow', () => {
    it('should return a field including deleted ones', async () => {
      const field = { id: 1, name: 'Lote 1' };
      fieldRepository.findOne.mockResolvedValue(field as any);

      const result = await service.findOneOrThrow(1);

      expect(result).toEqual(field);
    });

    it('should throw NotFoundException when the field does not exist', async () => {
      fieldRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneOrThrow(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a field without checking cycles when area is unchanged', async () => {
      const field = { id: 1, name: 'Lote 1', area: 5.5 };
      fieldRepository.findOne.mockImplementation(async (opts: any) => {
        if (opts.where.id === 1) return field;
        return null;
      });
      fieldRepository.save.mockResolvedValue({ ...field, name: 'Lote Norte' } as any);

      const result = await service.update(1, { name: 'Lote Norte' } as any);

      expect(cycleRepository.count).not.toHaveBeenCalled();
      expect(result.name).toBe('Lote Norte');
    });

    it('should update the area when there are no open cycles', async () => {
      const field = { id: 1, name: 'Lote 1', area: 5.5 };
      fieldRepository.findOne.mockResolvedValue(field as any);
      cycleRepository.count.mockResolvedValue(0);
      fieldRepository.save.mockResolvedValue({ ...field, area: 8 } as any);

      const result = await service.update(1, { area: 8 } as any);

      expect(cycleRepository.count).toHaveBeenCalledWith({
        where: { fieldId: 1, status: 'OPEN' },
      });
      expect(result.area).toBe(8);
    });

    it('should throw ConflictException when changing the area with open cycles', async () => {
      const field = { id: 1, name: 'Lote 1', area: 5.5 };
      fieldRepository.findOne.mockResolvedValue(field as any);
      cycleRepository.count.mockResolvedValue(1);

      await expect(service.update(1, { area: 8 } as any)).rejects.toThrow(ConflictException);
      expect(fieldRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the field to update does not exist', async () => {
      fieldRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft remove an existing field', async () => {
      const field = { id: 1, name: 'Lote 1' };
      fieldRepository.findOne.mockResolvedValue(field as any);
      fieldRepository.softRemove.mockResolvedValue(field as any);

      const result = await service.remove(1);

      expect(fieldRepository.softRemove).toHaveBeenCalledWith(field);
      expect(result).toEqual(field);
    });

    it('should throw NotFoundException when the field to remove does not exist', async () => {
      fieldRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
