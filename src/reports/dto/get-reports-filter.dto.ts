import { IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetReportsFilterDto {
    @ApiPropertyOptional({ description: 'Field ID to filter results' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    fieldId?: number;

    @ApiPropertyOptional({ description: 'Start date of the range (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'End date of the range (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}