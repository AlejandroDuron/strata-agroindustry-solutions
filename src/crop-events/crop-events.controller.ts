import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CropEventsService } from './crop-events.service';
import { CreateCropEventDto } from './dto/create-crop-event.dto';
import { UpdateCropEventDto } from './dto/update-crop-event.dto';

@Controller('crop-events')
export class CropEventsController {
  constructor(private readonly cropEventsService: CropEventsService) {}

  @Post()
  create(@Body() createCropEventDto: CreateCropEventDto) {
    return this.cropEventsService.create(createCropEventDto);
  }

  @Get()
  findAll() {
    return this.cropEventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cropEventsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCropEventDto: UpdateCropEventDto) {
    return this.cropEventsService.update(+id, updateCropEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cropEventsService.remove(+id);
  }
}
