import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CropEventsService } from './crop-events.service';
import { CropEventsController } from './crop-events.controller';
import { CropEvent } from './entities/crop-event.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CropEvent, ProductionCycle]),
    AuthModule,
  ],
  controllers: [CropEventsController],
  providers: [CropEventsService],
  exports: [CropEventsService],
})
export class CropEventsModule {}
