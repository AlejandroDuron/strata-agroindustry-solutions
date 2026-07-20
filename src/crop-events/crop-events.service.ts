import { Injectable } from '@nestjs/common';
import { CreateCropEventDto } from './dto/create-crop-event.dto';
import { UpdateCropEventDto } from './dto/update-crop-event.dto';

@Injectable()
export class CropEventsService {
  create(createCropEventDto: CreateCropEventDto) {
    return 'This action adds a new cropEvent';
  }

  findAll() {
    return `This action returns all cropEvents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cropEvent`;
  }

  update(id: number, updateCropEventDto: UpdateCropEventDto) {
    return `This action updates a #${id} cropEvent`;
  }

  remove(id: number) {
    return `This action removes a #${id} cropEvent`;
  }
}
