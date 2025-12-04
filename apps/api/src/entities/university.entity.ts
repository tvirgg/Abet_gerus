import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Country } from './country.entity';
import { Program } from './program.entity';

@Entity('universities')
export class University {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  countryId!: string;

  @ManyToOne(() => Country, (country) => country.universities)
  @JoinColumn({ name: 'countryId' })
  country!: Country;

  @Column()
  name!: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @OneToMany(() => Program, (program) => program.university)
  programs!: Program[];
}
