import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('countries')
export class Country {
  @PrimaryColumn()
  id!: string; // 'at', 'it'

  @Column()
  name!: string;

  @Column()
  flagIcon!: string;
}
