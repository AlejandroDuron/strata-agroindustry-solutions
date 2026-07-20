import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Field } from '../../fields/entities/field.entity';

@Entity()
export class Farm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  location: string;

  @OneToMany(() => Field, (field) => field.farm)
  fields: Field[];
}
