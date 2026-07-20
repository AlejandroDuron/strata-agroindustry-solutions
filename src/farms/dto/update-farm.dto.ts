import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFarmDto {
  @ApiPropertyOptional({ example: 'Finca La Esperanza' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name?: string;

  @ApiPropertyOptional({ example: 'Sonsonate, El Salvador' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La ubicación no puede exceder 100 caracteres' })
  location?: string;
}
