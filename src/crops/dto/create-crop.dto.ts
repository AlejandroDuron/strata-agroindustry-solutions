import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCropDto {
  @ApiProperty({ example: 'Café', description: 'Tipo de cultivo' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Arábica', description: 'Variedad del cultivo' })
  @IsString()
  @IsNotEmpty()
  variety: string;
}
