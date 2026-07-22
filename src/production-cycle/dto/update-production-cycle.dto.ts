import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductionCycleDto } from './create-production-cycle.dto';

export class UpdateProductionCycleDto extends PartialType(
    OmitType(CreateProductionCycleDto, ['fieldId', 'cropId'] as const)
) { }
