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

export enum InputType {
  FERTILIZANTE = 'FERTILIZANTE',
  PESTICIDA = 'PESTICIDA',
  MANO_DE_OBRA = 'MANO_DE_OBRA',
  OTRO = 'OTRO',
}

@Entity()
export class Input {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'production_cycle_id' })
  productionCycleId: number;

  @ManyToOne(() => ProductionCycle, (cycle) => cycle.inputs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_cycle_id' })
  productionCycle: ProductionCycle;

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'varchar',
    default: InputType.OTRO,
  })
  type: InputType;

  @Column('float')
  quantity: number;

  @Column('float')
  unitCost: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'date', nullable: true })
  applicationDate: string;

  @Column({ nullable: true })
  notes: string;

  // Compatibility column for the database seed factory
  @Column({ name: 'input_type', nullable: true })
  inputType: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
