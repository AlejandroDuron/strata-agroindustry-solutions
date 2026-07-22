import { IsInt, IsDateString, IsNumber, Min, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfterSowingDate', async: false })
class IsAfterSowingDate implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const obj = args.object as any;
    if (!obj.sowingDate) return true;
    return new Date(value) > new Date(obj.sowingDate);
  }

  defaultMessage() {
    return 'expectedHarvestDate must be after sowingDate';
  }
}

export class CreateProductionCycleDto {
  @ApiProperty({ description: 'ID of the associated field (lot)' })
  @IsInt()
  @Min(1)
  fieldId: number;

  @ApiProperty({ description: 'ID of the associated crop' })
  @IsInt()
  @Min(1)
  cropId: number;

  @ApiProperty({ description: 'Sowing date', example: '2026-01-15' })
  @IsDateString()
  sowingDate: string;

  @ApiProperty({
    description: 'Expected harvest date (must be after sowing date)',
    example: '2026-06-15',
  })
  @IsDateString()
  @Validate(IsAfterSowingDate)
  expectedHarvestDate: string;

  @ApiProperty({ description: 'Estimated yield (qq/area)', example: 30 })
  @IsNumber()
  @Min(0.01, { message: 'estimatedYield must be greater than 0' })
  estimatedYield: number;
}
