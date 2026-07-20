import { Test, TestingModule } from '@nestjs/testing';
import { InputsController } from './inputs.controller';
import { InputsService } from './inputs.service';

describe('InputsController', () => {
  let controller: InputsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InputsController],
      providers: [InputsService],
    }).compile();

    controller = module.get<InputsController>(InputsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
