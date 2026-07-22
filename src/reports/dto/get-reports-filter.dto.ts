import { IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetReportsFilterDto {
    @ApiPropertyOptional({ description: 'ID de la finca para filtrar el resumen financiero' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    farmId?: number;

    @ApiPropertyOptional({ description: 'ID del lote para obtener el histórico de rendimiento' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    fieldId?: number;

    @ApiPropertyOptional({ description: 'Fecha de inicio del rango (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'Fecha de fin del rango (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}