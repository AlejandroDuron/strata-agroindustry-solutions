import { ConflictException, NotFoundException } from '@nestjs/common';
import { CropsService } from './crops.service';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
});

describe('CropsService', () => {
  let service: CropsService;
  let cropRepository: jest.Mocked<ReturnType<typeof mockRepository>>;

  beforeEach(() => {
    cropRepository = mockRepository() as any;
    service = new CropsService(cropRepository as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a crop when type+variety is unique', async () => {
      const dto = { type: 'Coffee', variety: 'Arabica' };
      cropRepository.findOne.mockResolvedValue(null);
      cropRepository.create.mockReturnValue(dto as any);
      cropRepository.save.mockResolvedValue({ id: 1, ...dto } as any);

      const result = await service.create(dto as any);

      expect(result).toEqual({ id: 1, ...dto });
    });

    it('should throw ConflictException when type+variety already exists', async () => {
      cropRepository.findOne.mockResolvedValue({ id: 1, type: 'Coffee', variety: 'Arabica' } as any);

      await expect(
        service.create({ type: 'Coffee', variety: 'Arabica' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all crops', async () => {
      const crops = [{ id: 1 }, { id: 2 }];
      cropRepository.find.mockResolvedValue(crops as any);

      const result = await service.findAll();

      expect(result).toEqual(crops);
    });
  });

  describe('findOne', () => {
    it('should return a crop by id', async () => {
      const crop = { id: 1, type: 'Coffee', variety: 'Arabica' };
      cropRepository.findOne.mockResolvedValue(crop as any);

      const result = await service.findOne(1);

      expect(result).toEqual(crop);
    });

    it('should throw NotFoundException when the crop does not exist', async () => {
      cropRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a crop when the new combination is free', async () => {
      const crop = { id: 1, type: 'Coffee', variety: 'Arabica' };
      cropRepository.findOne
        .mockResolvedValueOnce(crop as any) // findOne (inside update)
        .mockResolvedValueOnce(null); // duplicate check
      cropRepository.save.mockResolvedValue({ ...crop, variety: 'Bourbon' } as any);

      const result = await service.update(1, { variety: 'Bourbon' } as any);

      expect(result.variety).toBe('Bourbon');
    });

    it('should allow updating a crop to its own unchanged combination', async () => {
      const crop = { id: 1, type: 'Coffee', variety: 'Arabica' };
      cropRepository.findOne
        .mockResolvedValueOnce(crop as any)
        .mockResolvedValueOnce(crop as any); // duplicate is itself
      cropRepository.save.mockResolvedValue(crop as any);

      const result = await service.update(1, {} as any);

      expect(result).toEqual(crop);
    });

    it('should throw ConflictException when the new combination belongs to another crop', async () => {
      const crop = { id: 1, type: 'Coffee', variety: 'Arabica' };
      cropRepository.findOne
        .mockResolvedValueOnce(crop as any)
        .mockResolvedValueOnce({ id: 2, type: 'Coffee', variety: 'Bourbon' } as any);

      await expect(service.update(1, { variety: 'Bourbon' } as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when the crop to update does not exist', async () => {
      cropRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft remove an existing crop by default', async () => {
      const crop = { id: 1, type: 'Coffee', variety: 'Arabica' };
      cropRepository.findOne.mockResolvedValue(crop as any);

      await service.remove(1);

      expect(cropRepository.softRemove).toHaveBeenCalledWith(crop);
      expect(cropRepository.remove).not.toHaveBeenCalled();
    });

    it('should hard remove an existing crop when hard=true', async () => {
      const crop = { id: 1, type: 'Coffee', variety: 'Arabica' };
      cropRepository.findOne.mockResolvedValue(crop as any);

      await service.remove(1, true);

      expect(cropRepository.remove).toHaveBeenCalledWith(crop);
      expect(cropRepository.softRemove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the crop to remove does not exist', async () => {
      cropRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
