import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InputsService } from './inputs.service';
import { CreateInputDto } from './dto/create-input.dto';
import { UpdateInputDto } from './dto/update-input.dto';

@Controller('inputs')
export class InputsController {
  constructor(private readonly inputsService: InputsService) {}

  @Post()
  create(@Body() createInputDto: CreateInputDto) {
    return this.inputsService.create(createInputDto);
  }

  @Get()
  findAll() {
    return this.inputsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inputsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInputDto: UpdateInputDto) {
    return this.inputsService.update(+id, updateInputDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inputsService.remove(+id);
  }
}
