import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';

@Entity()
export class Field {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'farm_id' })
  farmId: number;

  @ManyToOne(() => Farm, (farm) => farm.fields)
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column('float')
  area: number;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => ProductionCycle, (cycle) => cycle.field)
  productionCycles: ProductionCycle[];
}
