import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';

@Entity()
export class CropEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductionCycle, (cycle) => cycle.cropEvents)
  @JoinColumn({ name: 'cycle_id' })
  productionCycle: ProductionCycle;

  @Column()
  eventType: string;

  @Column({ type: 'date' })
  eventDate: string;

  @Column({ nullable: true })
  description: string;
}
