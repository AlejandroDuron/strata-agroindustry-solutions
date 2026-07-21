import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CropEventsController } from './crop-events.controller';
import { CropEventsService } from './crop-events.service';
import { CropEvent } from './entities/crop-event.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';

describe('CropEventsController', () => {
  let controller: CropEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CropEventsController],
      providers: [
        CropEventsService,
        {
          provide: getRepositoryToken(CropEvent),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ProductionCycle),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CropEventsController>(CropEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
