import { IsInt, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductionCycleDto {
  @ApiProperty({ description: 'ID of the associated field (lot)' })
  @IsInt()
  fieldId: number;

  @ApiProperty({ description: 'ID of the associated crop' })
  @IsInt()
  cropId: number;

  @ApiProperty({ description: 'Sowing date', example: '2026-01-15' })
  @IsDateString()
  sowingDate: string;

  @ApiProperty({
    description: 'Expected harvest date',
    example: '2026-06-15',
  })
  @IsDateString()
  expectedHarvestDate: string;

  @ApiProperty({ description: 'Estimated yield (qq/area)', example: 30 })
  @IsNumber()
  estimatedYield: number;
}
