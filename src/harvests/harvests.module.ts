import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HarvestsService } from './harvests.service';
import { HarvestsController } from './harvests.controller';
import { Harvest } from './entities/harvest.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Harvest, ProductionCycle])],
  controllers: [HarvestsController],
  providers: [HarvestsService],
  exports: [HarvestsService],
})
export class HarvestsModule {}
