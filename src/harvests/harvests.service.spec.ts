import { Test, TestingModule } from '@nestjs/testing';
import { HarvestsService } from './harvests.service';

describe('HarvestsService', () => {
  let service: HarvestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HarvestsService],
    }).compile();

    service = module.get<HarvestsService>(HarvestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
