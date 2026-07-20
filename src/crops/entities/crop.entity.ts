import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';

@Entity()
export class Crop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  variety: string;

  @OneToMany(() => ProductionCycle, (cycle) => cycle.crop)
  productionCycles: ProductionCycle[];
}
