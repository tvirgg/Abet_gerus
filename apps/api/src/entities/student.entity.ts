import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';
import { Curator } from './curator.entity';
import { Country } from './country.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  userId!: string;

  @OneToOne(() => User, (user) => user.student, { onDelete: 'CASCADE' })
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

  // --- Multi-Country Support ---
  @ManyToMany(() => Country)
  @JoinTable({
    name: 'student_countries',
    joinColumn: { name: 'studentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'countryId', referencedColumnName: 'id' }
  })
  countries!: Country[];

  // --- НОВОЕ: Выбранные программы ---
  @Column('jsonb', { default: [] })
  selectedProgramIds!: number[];

  @Column({ nullable: true })
  bindingCode?: string;

  @Column({ type: 'bigint', nullable: true }) // Telegram Chat ID может быть большим
  telegramGroupId?: string;

  @Column({ default: 0 })
  xpTotal!: number;

  @Column({ nullable: true })
  camundaProcessInstanceId?: string;

  @OneToMany(() => Task, (task) => task.student)
  tasks!: Task[];
}
