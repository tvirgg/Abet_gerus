import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { University } from './university.entity';

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

  @OneToMany(() => University, (uni) => uni.country)
  universities!: University[];
}
