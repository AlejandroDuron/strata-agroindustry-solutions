import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Field } from '../../fields/entities/field.entity';
import { Crop } from '../../crops/entities/crop.entity';
import { Input } from '../../inputs/entities/input.entity';
import { CropEvent } from '../../crop-events/entities/crop-event.entity';
import { Harvest } from '../../harvests/entities/harvest.entity';

@Entity()
export class ProductionCycle {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Field, (field) => field.productionCycles)
  @JoinColumn({ name: 'field_id' })
  field: Field;

  @ManyToOne(() => Crop, (crop) => crop.productionCycles)
  @JoinColumn({ name: 'crop_id' })
  crop: Crop;

  @Column({ type: 'date' })
  sowingDate: string;

  @Column({ type: 'date' })
  expectedHarvestDate: string;

  @Column('float')
  estimatedYield: number;

  @Column('float')
  currentCostPerArea: number;

  @Column({ default: 'OPEN' })
  status: string;

  @Column({ type: 'float', nullable: true })
  totalRevenueAtClose: number;

  @Column({ type: 'float', nullable: true })
  totalCostAtClose: number;

  @Column({ type: 'float', nullable: true })
  grossMarginAtClose: number;

  @Column({ type: 'float', nullable: true })
  realYieldAtClose: number;

  @OneToMany(() => Input, (input) => input.productionCycle)
  inputs: Input[];

  @OneToMany(() => CropEvent, (event) => event.productionCycle)
  cropEvents: CropEvent[];

  @OneToMany(() => Harvest, (harvest) => harvest.productionCycle)
  harvests: Harvest[];
}
