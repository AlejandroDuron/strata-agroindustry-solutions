import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InputsService } from './inputs.service';
import { InputsController } from './inputs.controller';
import { Input } from './entities/input.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Input, ProductionCycle]),
    AuthModule,
  ],
  controllers: [InputsController],
  providers: [InputsService],
  exports: [InputsService],
})
export class InputsModule {}
