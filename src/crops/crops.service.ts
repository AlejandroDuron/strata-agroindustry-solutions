import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Crop } from './entities/crop.entity';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';

@Injectable()
export class CropsService {
  constructor(
    @InjectRepository(Crop)
    private readonly cropRepository: Repository<Crop>,
  ) {}

  async create(createCropDto: CreateCropDto): Promise<Crop> {
    const existing = await this.cropRepository.findOne({
      where: {
        type: createCropDto.type,
        variety: createCropDto.variety,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A crop with type "${createCropDto.type}" and variety "${createCropDto.variety}" already exists`,
      );
    }

    const crop = this.cropRepository.create(createCropDto);
    return this.cropRepository.save(crop);
  }

  async findAll(): Promise<Crop[]> {
    return this.cropRepository.find();
  }

  async findOne(id: number): Promise<Crop> {
    const crop = await this.cropRepository.findOne({ where: { id } });
    if (!crop) {
      throw new NotFoundException(`Crop with id ${id} not found`);
    }
    return crop;
  }

  async update(id: number, updateCropDto: UpdateCropDto): Promise<Crop> {
    const crop = await this.findOne(id);

    const type = updateCropDto.type ?? crop.type;
    const variety = updateCropDto.variety ?? crop.variety;

    const duplicate = await this.cropRepository.findOne({
      where: { type, variety },
    });

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException(
        `A crop with type "${type}" and variety "${variety}" already exists`,
      );
    }

    Object.assign(crop, updateCropDto);
    return this.cropRepository.save(crop);
  }

  async remove(id: number): Promise<void> {
    const crop = await this.findOne(id);
    await this.cropRepository.remove(crop);
  }
}
