import { CropEventsController } from './crop-events.controller';
import { CropEventsService } from './crop-events.service';
import { EventType } from './entities/crop-event.entity';

const mockCropEventsService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('CropEventsController', () => {
  let controller: CropEventsController;
  let service: jest.Mocked<ReturnType<typeof mockCropEventsService>>;

  beforeEach(() => {
    service = mockCropEventsService() as any;
    controller = new CropEventsController(service as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an event', async () => {
    const dto = { eventType: EventType.IRRIGATION, eventDate: '2026-07-21' };
    service.create.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.create(1, dto as any);

    expect(service.create).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should list events of a cycle', async () => {
    const events = [{ id: 1 }];
    service.findAll.mockResolvedValue(events as any);

    const result = await controller.findAll(1);

    expect(service.findAll).toHaveBeenCalledWith(1);
    expect(result).toEqual(events);
  });

  it('should return an event by id', async () => {
    const event = { id: 1 };
    service.findOne.mockResolvedValue(event as any);

    const result = await controller.findOne(1, 1);

    expect(service.findOne).toHaveBeenCalledWith(1, 1);
    expect(result).toEqual(event);
  });

  it('should update an event', async () => {
    const dto = { description: 'updated' };
    service.update.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.update(1, 1, dto as any);

    expect(service.update).toHaveBeenCalledWith(1, 1, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should remove an event', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove(1, 1);

    expect(service.remove).toHaveBeenCalledWith(1, 1);
  });
});
