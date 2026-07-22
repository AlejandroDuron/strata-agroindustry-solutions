import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CropEvent } from './entities/crop-event.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';
import { CreateCropEventDto } from './dto/create-crop-event.dto';
import { UpdateCropEventDto } from './dto/update-crop-event.dto';

@Injectable()
export class CropEventsService {
  constructor(
    @InjectRepository(CropEvent)
    private readonly eventRepo: Repository<CropEvent>,
    @InjectRepository(ProductionCycle)
    private readonly cycleRepo: Repository<ProductionCycle>,
  ) {}

  private async getCycleAndValidateOpen(cycleId: number): Promise<ProductionCycle> {
    const cycle = await this.cycleRepo.findOne({
      where: { id: cycleId },
    });

    if (!cycle) {
      throw new NotFoundException(`Production cycle with ID ${cycleId} not found`);
    }

    if (cycle.status === 'CLOSED') {
      throw new BadRequestException(`Cannot perform operation: Production cycle with ID ${cycleId} is CLOSED`);
    }

    return cycle;
  }

  private normalizeDate(date: string): string {
    return date.split('T')[0];
  }

  async create(cycleId: number, dto: CreateCropEventDto): Promise<CropEvent> {
    const cycle = await this.getCycleAndValidateOpen(cycleId);

    if (this.normalizeDate(dto.eventDate) < this.normalizeDate(cycle.sowingDate)) {
      throw new BadRequestException(
        `eventDate cannot be before the cycle sowingDate (${cycle.sowingDate})`
      );
    }

    if (dto.resolvedAt && this.normalizeDate(dto.resolvedAt) < this.normalizeDate(dto.eventDate)) {
      throw new BadRequestException('resolvedAt cannot be before eventDate');
    }

    const event = this.eventRepo.create({
      ...dto,
      productionCycleId: cycleId,
    });

    return this.eventRepo.save(event);
  }

  async findAll(cycleId: number): Promise<CropEvent[]> {
    const cycle = await this.cycleRepo.findOne({ where: { id: cycleId } });
    if (!cycle) {
      throw new NotFoundException(`Production cycle with ID ${cycleId} not found`);
    }

    return this.eventRepo.find({
      where: { productionCycleId: cycleId },
      order: { eventDate: 'ASC', id: 'ASC' },
    });
  }

  async findOne(cycleId: number, id: number): Promise<CropEvent> {
    const event = await this.eventRepo.findOne({
      where: { id, productionCycleId: cycleId },
    });

    if (!event) {
      throw new NotFoundException(`Crop event with ID ${id} not found in production cycle ${cycleId}`);
    }

    return event;
  }

  async update(cycleId: number, id: number, dto: UpdateCropEventDto): Promise<CropEvent> {
    const cycle = await this.getCycleAndValidateOpen(cycleId);
    const event = await this.findOne(cycleId, id);

    const newEventDate = dto.eventDate || event.eventDate;
    if (this.normalizeDate(newEventDate) < this.normalizeDate(cycle.sowingDate)) {
      throw new BadRequestException(
        `eventDate cannot be before the cycle sowingDate (${cycle.sowingDate})`
      );
    }

    const newResolvedAt = dto.resolvedAt !== undefined ? dto.resolvedAt : event.resolvedAt;
    if (newResolvedAt && this.normalizeDate(newResolvedAt) < this.normalizeDate(newEventDate)) {
      throw new BadRequestException('resolvedAt cannot be before eventDate');
    }

    Object.assign(event, dto);
    return this.eventRepo.save(event);
  }

  async remove(cycleId: number, id: number): Promise<void> {
    await this.getCycleAndValidateOpen(cycleId);
    const event = await this.findOne(cycleId, id);

    await this.eventRepo.remove(event);
  }
}
