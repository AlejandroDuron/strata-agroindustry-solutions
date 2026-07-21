import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CropEventsService } from './crop-events.service';
import { CropEvent } from './entities/crop-event.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';

describe('CropEventsService', () => {
  let service: CropEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<CropEventsService>(CropEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
