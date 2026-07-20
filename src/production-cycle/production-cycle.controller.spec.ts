import { Test, TestingModule } from '@nestjs/testing';
import { ProductionCycleController } from './production-cycle.controller';
import { ProductionCycleService } from './production-cycle.service';

describe('ProductionCycleController', () => {
  let controller: ProductionCycleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionCycleController],
      providers: [ProductionCycleService],
    }).compile();

    controller = module.get<ProductionCycleController>(ProductionCycleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
