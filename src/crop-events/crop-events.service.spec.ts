import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CropEventsService } from './crop-events.service';
import { EventType } from './entities/crop-event.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('CropEventsService', () => {
  let service: CropEventsService;
  let eventRepo: jest.Mocked<ReturnType<typeof mockRepository>>;
  let cycleRepo: jest.Mocked<ReturnType<typeof mockRepository>>;

  beforeEach(() => {
    eventRepo = mockRepository() as any;
    cycleRepo = mockRepository() as any;
    service = new CropEventsService(eventRepo as any, cycleRepo as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const dto = { eventType: EventType.IRRIGATION, eventDate: '2026-07-21' };

  describe('create', () => {
    it('should create an event when the cycle is open', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN' } as any);
      eventRepo.create.mockReturnValue({ ...dto, productionCycleId: 1 } as any);
      eventRepo.save.mockResolvedValue({ id: 1, ...dto, productionCycleId: 1 } as any);

      const result = await service.create(1, dto as any);

      expect(result).toMatchObject({ id: 1, eventType: EventType.IRRIGATION });
    });

    it('should throw NotFoundException when the cycle does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue(null);

      await expect(service.create(999, dto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.create(1, dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return the events of a cycle', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1 } as any);
      const events = [{ id: 1 }];
      eventRepo.find.mockResolvedValue(events as any);

      const result = await service.findAll(1);

      expect(result).toEqual(events);
    });

    it('should throw NotFoundException when the cycle does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue(null);

      await expect(service.findAll(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      const event = { id: 1 };
      eventRepo.findOne.mockResolvedValue(event as any);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(event);
    });

    it('should throw NotFoundException when the event does not exist', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an event when the cycle is open', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN' } as any);
      const event = { id: 1, description: 'old' };
      eventRepo.findOne.mockResolvedValue(event as any);
      eventRepo.save.mockImplementation(async (e: any) => e);

      const result = await service.update(1, 1, { description: 'new' } as any);

      expect(result.description).toBe('new');
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.update(1, 1, {} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove an event when the cycle is open', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN' } as any);
      const event = { id: 1 };
      eventRepo.findOne.mockResolvedValue(event as any);

      await service.remove(1, 1);

      expect(eventRepo.remove).toHaveBeenCalledWith(event);
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.remove(1, 1)).rejects.toThrow(BadRequestException);
    });
  });
});
