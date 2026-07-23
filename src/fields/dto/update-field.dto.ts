import { IsOptional, IsString, IsNumber, IsPositive, MaxLength, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFieldDto {
  @ApiPropertyOptional({ example: 'North Field' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({ example: 6.0, description: 'Field area in manzanas' })
  @IsOptional()
  @IsNumber({}, { message: 'Area must be a number' })
  @IsPositive({ message: 'Area must be greater than 0' })
  @Max(1000, { message: 'Area cannot exceed 1000 manzanas' })
  area?: number;
}
