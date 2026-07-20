import { Module } from '@nestjs/common';
import { CropEventsService } from './crop-events.service';
import { CropEventsController } from './crop-events.controller';

@Module({
  controllers: [CropEventsController],
  providers: [CropEventsService],
})
export class CropEventsModule {}
