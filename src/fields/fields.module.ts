import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldsService } from './fields.service';
import { FieldsController } from './fields.controller';
import { Field } from './entities/field.entity';
import { FarmsModule } from '../farms/farms.module';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Field, ProductionCycle]),
    FarmsModule,
  ],
  controllers: [FieldsController],
  providers: [FieldsService],
  exports: [FieldsService],
})
export class FieldsModule {}
