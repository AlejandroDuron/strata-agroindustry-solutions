import { Module } from '@nestjs/common';
import { HarvestsService } from './harvests.service';
import { HarvestsController } from './harvests.controller';

@Module({
  controllers: [HarvestsController],
  providers: [HarvestsService],
})
export class HarvestsModule {}
