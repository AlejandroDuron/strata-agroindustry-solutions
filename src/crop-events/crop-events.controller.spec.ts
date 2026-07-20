import { Test, TestingModule } from '@nestjs/testing';
import { CropEventsController } from './crop-events.controller';
import { CropEventsService } from './crop-events.service';

describe('CropEventsController', () => {
  let controller: CropEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CropEventsController],
      providers: [CropEventsService],
    }).compile();

    controller = module.get<CropEventsController>(CropEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
