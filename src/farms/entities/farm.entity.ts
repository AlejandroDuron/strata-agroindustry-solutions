import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Field } from '../../fields/entities/field.entity';

@Entity()
export class Farm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ length: 100 })
  location: string;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => Field, (field) => field.farm)
  fields: Field[];
}
