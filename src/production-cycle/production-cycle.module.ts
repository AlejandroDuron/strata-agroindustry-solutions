import { Module } from '@nestjs/common';
import { ProductionCycleService } from './production-cycle.service';
import { ProductionCycleController } from './production-cycle.controller';

@Module({
  controllers: [ProductionCycleController],
  providers: [ProductionCycleService],
})
export class ProductionCycleModule {}
