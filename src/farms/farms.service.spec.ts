import { ConflictException, NotFoundException } from '@nestjs/common';
import { FarmsService } from './farms.service';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softRemove: jest.fn(),
});

describe('FarmsService', () => {
  let service: FarmsService;
  let farmRepository: jest.Mocked<ReturnType<typeof mockRepository>>;

  beforeEach(() => {
    farmRepository = mockRepository() as any;
    service = new FarmsService(farmRepository as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a farm when the name is not taken', async () => {
      const dto = { name: 'Finca El Roble', location: 'Santa Ana' };
      farmRepository.findOne.mockResolvedValue(null);
      farmRepository.create.mockReturnValue(dto as any);
      farmRepository.save.mockResolvedValue({ id: 1, ...dto } as any);

      const result = await service.create(dto as any);

      expect(farmRepository.findOne).toHaveBeenCalledWith({
        where: { name: dto.name },
        withDeleted: true,
      });
      expect(result).toEqual({ id: 1, ...dto });
    });

    it('should throw ConflictException when the name is already taken', async () => {
      farmRepository.findOne.mockResolvedValue({ id: 1, name: 'Finca El Roble' } as any);

      await expect(
        service.create({ name: 'Finca El Roble', location: 'Santa Ana' } as any),
      ).rejects.toThrow(ConflictException);
      expect(farmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all farms ordered by id', async () => {
      const farms = [{ id: 1 }, { id: 2 }];
      farmRepository.find.mockResolvedValue(farms as any);

      const result = await service.findAll();

      expect(farmRepository.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
      expect(result).toEqual(farms);
    });
  });

  describe('findOneOrThrow', () => {
    it('should return a farm including deleted ones', async () => {
      const farm = { id: 1, name: 'Finca El Roble' };
      farmRepository.findOne.mockResolvedValue(farm as any);

      const result = await service.findOneOrThrow(1);

      expect(farmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        withDeleted: true,
      });
      expect(result).toEqual(farm);
    });

    it('should throw NotFoundException when the farm does not exist', async () => {
      farmRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneOrThrow(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a farm when the new name is free', async () => {
      const farm = { id: 1, name: 'Old Name', location: 'Old Location' };
      farmRepository.findOne
        .mockResolvedValueOnce(farm as any) // findNonDeletedOrThrow
        .mockResolvedValueOnce(null); // throwIfNameTaken
      farmRepository.save.mockResolvedValue({ ...farm, name: 'New Name' } as any);

      const result = await service.update(1, { name: 'New Name' } as any);

      expect(result.name).toBe('New Name');
    });

    it('should not re-check uniqueness when the name is unchanged', async () => {
      const farm = { id: 1, name: 'Same Name', location: 'Loc' };
      farmRepository.findOne.mockResolvedValueOnce(farm as any);
      farmRepository.save.mockResolvedValue(farm as any);

      await service.update(1, { name: 'Same Name' } as any);

      expect(farmRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when the farm to update does not exist', async () => {
      farmRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when renaming to a taken name', async () => {
      const farm = { id: 1, name: 'Old Name', location: 'Loc' };
      farmRepository.findOne
        .mockResolvedValueOnce(farm as any)
        .mockResolvedValueOnce({ id: 2, name: 'Taken Name' } as any);

      await expect(service.update(1, { name: 'Taken Name' } as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should soft remove an existing farm', async () => {
      const farm = { id: 1, name: 'Finca El Roble' };
      farmRepository.findOne.mockResolvedValue(farm as any);
      farmRepository.softRemove.mockResolvedValue(farm as any);

      const result = await service.remove(1);

      expect(farmRepository.softRemove).toHaveBeenCalledWith(farm);
      expect(result).toEqual(farm);
    });

    it('should throw NotFoundException when the farm to remove does not exist', async () => {
      farmRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActiveOrThrow', () => {
    it('should return an active farm', async () => {
      const farm = { id: 1, name: 'Finca El Roble' };
      farmRepository.findOne.mockResolvedValue(farm as any);

      const result = await service.findActiveOrThrow(1);

      expect(farmRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(farm);
    });

    it('should throw NotFoundException when there is no active farm', async () => {
      farmRepository.findOne.mockResolvedValue(null);

      await expect(service.findActiveOrThrow(999)).rejects.toThrow(NotFoundException);
    });
  });
});
