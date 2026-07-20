import { Test, TestingModule } from '@nestjs/testing';
import { HarvestsController } from './harvests.controller';
import { HarvestsService } from './harvests.service';

describe('HarvestsController', () => {
  let controller: HarvestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HarvestsController],
      providers: [HarvestsService],
    }).compile();

    controller = module.get<HarvestsController>(HarvestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
