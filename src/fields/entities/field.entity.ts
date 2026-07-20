import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';

@Entity()
export class Field {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Farm, (farm) => farm.fields)
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column()
  name: string;

  @Column('float')
  area: number;

  @OneToMany(() => ProductionCycle, (cycle) => cycle.field)
  productionCycles: ProductionCycle[];
}
