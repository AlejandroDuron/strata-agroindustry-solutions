import { IsOptional, IsString, IsNumber, IsPositive, MaxLength, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFieldDto {
  @ApiPropertyOptional({ example: 'Lote Norte' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name?: string;

  @ApiPropertyOptional({ example: 6.0 })
  @IsOptional()
  @IsNumber({}, { message: 'El área debe ser un número' })
  @IsPositive({ message: 'El área debe ser mayor a 0' })
  @Max(1000, { message: 'El área no puede exceder 1000 manzanas' })
  area?: number;
}
