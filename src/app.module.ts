import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { FarmsModule } from './farms/farms.module';
import { FieldsModule } from './fields/fields.module';
import { CropsModule } from './crops/crops.module';
import { ProductionCycleModule } from './production-cycle/production-cycle.module';
import { InputsModule } from './inputs/inputs.module';
import { CropEventsModule } from './crop-events/crop-events.module';
import { HarvestsModule } from './harvests/harvests.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [DatabaseModule, AuthModule, UsersModule, FarmsModule, FieldsModule, CropsModule, ProductionCycleModule, InputsModule, CropEventsModule, HarvestsModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
