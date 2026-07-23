import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCropDto {
  @ApiProperty({ example: 'Coffee', description: 'Crop type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Arabica', description: 'Crop variety' })
  @IsString()
  @IsNotEmpty()
  variety: string;
}
