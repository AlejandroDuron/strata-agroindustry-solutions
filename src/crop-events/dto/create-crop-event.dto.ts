import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventType, Severity } from '../entities/crop-event.entity';

export class CreateCropEventDto {
  @ApiProperty({ enum: EventType, example: EventType.RIEGO })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({ example: '2026-07-21' })
  @IsNotEmpty()
  @IsString()
  eventDate: string;

  @ApiProperty({ example: 'Riego por goteo nocturno de 2 horas', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: Severity, example: Severity.MEDIA, required: false })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiProperty({ example: '2026-07-22', required: false })
  @IsOptional()
  @IsString()
  resolvedAt?: string;
}
