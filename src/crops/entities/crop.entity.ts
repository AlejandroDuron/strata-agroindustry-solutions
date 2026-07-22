import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn } from 'typeorm';
import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';

@Entity()
export class Crop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  variety: string;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => ProductionCycle, (cycle) => cycle.crop)
  productionCycles: ProductionCycle[];
}
