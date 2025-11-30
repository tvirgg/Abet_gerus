import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

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

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  countryId?: string;

  @Column({ nullable: true })
  bindingCode?: string;

  @Column({ default: 0 })
  xpTotal!: number;

  @Column({ nullable: true })
  camundaProcessInstanceId?: string;

  @OneToMany(() => Task, (task) => task.student)
  tasks!: Task[];
}
