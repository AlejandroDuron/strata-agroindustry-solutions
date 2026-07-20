import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HarvestsService } from './harvests.service';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { UpdateHarvestDto } from './dto/update-harvest.dto';

@Controller('harvests')
export class HarvestsController {
  constructor(private readonly harvestsService: HarvestsService) {}

  @Post()
  create(@Body() createHarvestDto: CreateHarvestDto) {
    return this.harvestsService.create(createHarvestDto);
  }

  @Get()
  findAll() {
    return this.harvestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.harvestsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHarvestDto: UpdateHarvestDto) {
    return this.harvestsService.update(+id, updateHarvestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.harvestsService.remove(+id);
  }
}
