import { PartialType } from '@nestjs/swagger';
import { CreateCropEventDto } from './create-crop-event.dto';

export class UpdateCropEventDto extends PartialType(CreateCropEventDto) {}
