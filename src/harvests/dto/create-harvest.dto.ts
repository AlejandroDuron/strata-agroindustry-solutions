import { IsInt, IsNumber, IsString, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHarvestDto {
  @ApiProperty({ description: 'ID of the production cycle', example: 1 })
  @IsInt()
  @Min(1)
  cycleId: number;

  @ApiProperty({ description: 'Quantity obtained (qq)', example: 25.5 })
  @IsNumber()
  @Min(0.01, { message: 'quantityObtained must be greater than 0' })
  quantityObtained: number;

  @ApiProperty({ description: 'Quality grade', enum: ['A', 'B', 'C'], example: 'A' })
  @IsString()
  @IsIn(['A', 'B', 'C'], { message: 'quality must be A, B, or C' })
  quality: string;

  @ApiProperty({ description: 'Unit sale price per qq', example: 120.0 })
  @IsNumber()
  @Min(0.01, { message: 'unitSalePrice must be greater than 0' })
  unitSalePrice: number;

  @ApiProperty({ description: 'Quantity sold (qq)', example: 22.0 })
  @IsNumber()
  @Min(0, { message: 'quantitySold cannot be negative' })
  quantitySold: number;
}
