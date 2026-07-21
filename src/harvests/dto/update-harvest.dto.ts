import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateHarvestDto } from './create-harvest.dto';

export class UpdateHarvestDto extends PartialType(
  OmitType(CreateHarvestDto, ['cycleId'] as const),
) {}
