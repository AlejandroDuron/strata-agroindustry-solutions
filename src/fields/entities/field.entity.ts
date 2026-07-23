import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';

@Entity()
@Unique(['farmId', 'name'])
export class Field {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'farm_id' })
  farmId: number;

  @ManyToOne(() => Farm, (farm) => farm.fields)
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ length: 100 })
  name: string;

  /** Field area in manzanas */
  @Column('float', { comment: 'Area in manzanas' })
  area: number;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => ProductionCycle, (cycle) => cycle.field)
  productionCycles: ProductionCycle[];
}
