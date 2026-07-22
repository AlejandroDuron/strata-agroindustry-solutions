import { IsNotEmpty, IsString, IsNumber, IsEnum, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InputType } from '../entities/input.entity';
import { MaxDecimals } from '../../common/validators/max-decimals.validator';

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
  @MaxDecimals(2, { message: 'quantity must have at most 2 decimal places' })
  quantity: number;

  @ApiProperty({ example: 15.75 })
  @IsNumber()
  @IsPositive()
  @MaxDecimals(2, { message: 'unitCost must have at most 2 decimal places' })
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
