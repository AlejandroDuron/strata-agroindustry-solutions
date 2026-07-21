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
  RIEGO = 'RIEGO',
  FUMIGACION = 'FUMIGACION',
  ENFERMEDAD_DETECTADA = 'ENFERMEDAD_DETECTADA',
  PODA = 'PODA',
  OTRO = 'OTRO',
  
  // Seed factory compatibility values
  irrigation = 'irrigation',
  fumigation = 'fumigation',
  disease = 'disease',
  pruning = 'pruning',
  fertilization = 'fertilization',
}

export enum Severity {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
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
    default: EventType.OTRO,
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
