import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InputsController } from './inputs.controller';
import { InputsService } from './inputs.service';
import { Input } from './entities/input.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';

describe('InputsController', () => {
  let controller: InputsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InputsController],
      providers: [
        InputsService,
        {
          provide: getRepositoryToken(Input),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ProductionCycle),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<InputsController>(InputsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
