import { IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetReportsFilterDto {
    @ApiPropertyOptional({ description: 'ID del lote para filtrar resultados' })
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