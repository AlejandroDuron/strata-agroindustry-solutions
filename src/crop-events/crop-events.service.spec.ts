import { Test, TestingModule } from '@nestjs/testing';
import { CropEventsService } from './crop-events.service';

describe('CropEventsService', () => {
  let service: CropEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CropEventsService],
    }).compile();

    service = module.get<CropEventsService>(CropEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
