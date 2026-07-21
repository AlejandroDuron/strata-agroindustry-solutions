import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';

@Entity()
export class Harvest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cycle_id' })
  productionCycleId: number;

  @ManyToOne(() => ProductionCycle, (cycle) => cycle.harvests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cycle_id' })
  productionCycle: ProductionCycle;

  @Column('float')
  quantityObtained: number;

  @Column()
  quality: string;

  @Column('float')
  unitSalePrice: number;

  @Column('float')
  quantitySold: number;
}
