import { IsNotEmpty, IsString, IsNumber, IsEnum, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InputType } from '../entities/input.entity';

export class CreateInputDto {
  @ApiProperty({ example: 'Urea 46%' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: InputType, example: InputType.FERTILIZER })
  @IsEnum(InputType)
  type: InputType;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 15.75 })
  @IsNumber()
  @IsPositive()
  unitCost: number;

  @ApiProperty({ example: 'kg' })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty({ example: '2026-07-21' })
  @IsNotEmpty()
  @IsString()
  applicationDate: string;

  @ApiProperty({ example: 'Morning application', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
