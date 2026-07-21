import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InputsService } from './inputs.service';
import { Input } from './entities/input.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';

describe('InputsService', () => {
  let service: InputsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<InputsService>(InputsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
