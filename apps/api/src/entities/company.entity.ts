import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('jsonb', { default: {} })
  config!: Record<string, any>;

  @Column({ default: false })
  isArchived!: boolean;

  @OneToMany(() => User, (user) => user.company)
  users!: User[];
}
