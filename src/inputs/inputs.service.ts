import { Injectable } from '@nestjs/common';
import { CreateInputDto } from './dto/create-input.dto';
import { UpdateInputDto } from './dto/update-input.dto';

@Injectable()
export class InputsService {
  create(createInputDto: CreateInputDto) {
    return 'This action adds a new input';
  }

  findAll() {
    return `This action returns all inputs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} input`;
  }

  update(id: number, updateInputDto: UpdateInputDto) {
    return `This action updates a #${id} input`;
  }

  remove(id: number) {
    return `This action removes a #${id} input`;
  }
}
