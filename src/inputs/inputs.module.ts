import { Module } from '@nestjs/common';
import { InputsService } from './inputs.service';
import { InputsController } from './inputs.controller';

@Module({
  controllers: [InputsController],
  providers: [InputsService],
})
export class InputsModule {}
