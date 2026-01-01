import { Entity, PrimaryColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { University } from './university.entity';
import { Student } from './student.entity';

@Entity('countries')
export class Country {
  @PrimaryColumn()
  id!: string; // 'at', 'it'

  @Column()
  name!: string;

  @Column()
  flagIcon!: string;

  // --- НОВОЕ ПОЛЕ ---
  @Column('jsonb', { default: [] })
  requiredDocumentIds!: number[];

  @ManyToMany(() => Student, student => student.countries)
  students!: Student[];

  @OneToMany(() => University, (uni) => uni.country)
  universities!: University[];
}
