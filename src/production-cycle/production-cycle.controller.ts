import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductionCycleService } from './production-cycle.service';
import { CreateProductionCycleDto } from './dto/create-production-cycle.dto';
import { UpdateProductionCycleDto } from './dto/update-production-cycle.dto';

@Controller('production-cycle')
export class ProductionCycleController {
  constructor(private readonly productionCycleService: ProductionCycleService) {}

  @Post()
  create(@Body() createProductionCycleDto: CreateProductionCycleDto) {
    return this.productionCycleService.create(createProductionCycleDto);
  }

  @Get()
  findAll() {
    return this.productionCycleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionCycleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductionCycleDto: UpdateProductionCycleDto) {
    return this.productionCycleService.update(+id, updateProductionCycleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionCycleService.remove(+id);
  }
}
