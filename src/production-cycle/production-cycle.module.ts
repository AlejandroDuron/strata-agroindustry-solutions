import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionCycleService } from './production-cycle.service';
import { ProductionCycleController } from './production-cycle.controller';
import { ProductionCycle } from './entities/production-cycle.entity';
import { Harvest } from '../harvests/entities/harvest.entity';
import { Input } from '../inputs/entities/input.entity';
import { Field } from '../fields/entities/field.entity';
import { Crop } from '../crops/entities/crop.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionCycle,
      Harvest,
      Input,
      Field,
      Crop,
    ]),
  ],
  controllers: [ProductionCycleController],
  providers: [ProductionCycleService],
  exports: [ProductionCycleService],
})
export class ProductionCycleModule {}
