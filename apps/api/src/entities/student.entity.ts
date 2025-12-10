import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';
import { Curator } from './curator.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  userId!: string;

  @OneToOne(() => User, (user) => user.student)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ nullable: true })
  curatorId?: string;

  @ManyToOne(() => Curator)
  @JoinColumn({ name: 'curatorId' })
  curator?: Curator;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  countryId?: string;

  // --- НОВОЕ: Выбранные программы ---
  @Column('jsonb', { default: [] })
  selectedProgramIds!: number[];

  @Column({ nullable: true })
  bindingCode?: string;

  @Column({ default: 0 })
  xpTotal!: number;

  @Column({ nullable: true })
  camundaProcessInstanceId?: string;

  @OneToMany(() => Task, (task) => task.student)
  tasks!: Task[];
}
