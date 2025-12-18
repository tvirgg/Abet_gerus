import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('curators')
export class Curator {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  userId!: string;

  @OneToOne(() => User, (user) => user.curator, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  specialization?: string;

  @Column('text', { nullable: true })
  bio?: string;

  @Column({ nullable: true })
  avatarUrl?: string;
}
