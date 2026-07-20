import { Injectable } from '@nestjs/common';
import { CreateProductionCycleDto } from './dto/create-production-cycle.dto';
import { UpdateProductionCycleDto } from './dto/update-production-cycle.dto';

@Injectable()
export class ProductionCycleService {
  create(createProductionCycleDto: CreateProductionCycleDto) {
    return 'This action adds a new productionCycle';
  }

  findAll() {
    return `This action returns all productionCycle`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productionCycle`;
  }

  update(id: number, updateProductionCycleDto: UpdateProductionCycleDto) {
    return `This action updates a #${id} productionCycle`;
  }

  remove(id: number) {
    return `This action removes a #${id} productionCycle`;
  }
}
