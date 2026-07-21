import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';

export enum EventType {
  IRRIGATION = 'IRRIGATION',
  FUMIGATION = 'FUMIGATION',
  DISEASE_DETECTED = 'DISEASE_DETECTED',
  PRUNING = 'PRUNING',
  FERTILIZATION = 'FERTILIZATION',
  OTHER = 'OTHER',
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity()
export class CropEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'production_cycle_id' })
  productionCycleId: number;

  @ManyToOne(() => ProductionCycle, (cycle) => cycle.cropEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_cycle_id' })
  productionCycle: ProductionCycle;

  @Column({
    type: 'varchar',
    default: EventType.OTHER,
  })
  eventType: EventType | string;

  @Column({ type: 'date' })
  eventDate: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  severity: Severity;

  @Column({ type: 'date', nullable: true })
  resolvedAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
