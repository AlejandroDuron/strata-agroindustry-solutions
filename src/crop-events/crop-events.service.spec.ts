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
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01' } as any);
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

    it('should throw BadRequestException when eventDate is before the cycle sowingDate', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-08-01' } as any);

      await expect(
        service.create(1, { ...dto, eventDate: '2026-07-15' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when resolvedAt is before eventDate', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01' } as any);

      await expect(
        service.create(1, { ...dto, resolvedAt: '2026-07-20' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow creation when resolvedAt is after eventDate', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01' } as any);
      const dtoWithResolved = { ...dto, resolvedAt: '2026-07-25' };
      eventRepo.create.mockReturnValue({ ...dtoWithResolved, productionCycleId: 1 } as any);
      eventRepo.save.mockResolvedValue({ id: 1, ...dtoWithResolved, productionCycleId: 1 } as any);

      const result = await service.create(1, dtoWithResolved as any);

      expect(result).toMatchObject({ id: 1 });
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
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01' } as any);
      const event = { id: 1, description: 'old', eventDate: '2026-07-21', resolvedAt: null };
      eventRepo.findOne.mockResolvedValue(event as any);
      eventRepo.save.mockImplementation(async (e: any) => e);

      const result = await service.update(1, 1, { description: 'new' } as any);

      expect(result.description).toBe('new');
    });

    it('should throw BadRequestException when the cycle is closed', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' } as any);

      await expect(service.update(1, 1, {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when updated eventDate is before sowingDate', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-06-01' } as any);
      const event = { id: 1, eventDate: '2026-07-21', resolvedAt: null };
      eventRepo.findOne.mockResolvedValue(event as any);

      await expect(
        service.update(1, 1, { eventDate: '2026-05-15' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when updated resolvedAt is before eventDate', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01' } as any);
      const event = { id: 1, eventDate: '2026-07-21', resolvedAt: null };
      eventRepo.findOne.mockResolvedValue(event as any);

      await expect(
        service.update(1, 1, { resolvedAt: '2026-07-20' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow updating resolvedAt to a date after eventDate', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01' } as any);
      const event = { id: 1, eventDate: '2026-07-21', resolvedAt: null };
      eventRepo.findOne.mockResolvedValue(event as any);
      eventRepo.save.mockImplementation(async (e: any) => e);

      const result = await service.update(1, 1, { resolvedAt: '2026-07-25' } as any);

      expect(result.resolvedAt).toBe('2026-07-25');
    });

    it('should throw NotFoundException when the event does not exist', async () => {
      cycleRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN', sowingDate: '2026-01-01' } as any);
      eventRepo.findOne.mockResolvedValue(null);

      await expect(service.update(1, 999, {} as any)).rejects.toThrow(NotFoundException);
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
