import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';

@Entity()
export class Input {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductionCycle, (cycle) => cycle.inputs)
  @JoinColumn({ name: 'cycle_id' })
  productionCycle: ProductionCycle;

  @Column()
  inputType: string;

  @Column('float')
  quantity: number;

  @Column('float')
  unitCost: number;
}
