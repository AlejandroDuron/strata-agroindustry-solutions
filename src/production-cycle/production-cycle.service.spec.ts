import { Test, TestingModule } from '@nestjs/testing';
import { ProductionCycleService } from './production-cycle.service';

describe('ProductionCycleService', () => {
  let service: ProductionCycleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionCycleService],
    }).compile();

    service = module.get<ProductionCycleService>(ProductionCycleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
