import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';
import { Field } from '../fields/entities/field.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionCycle, Field])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}