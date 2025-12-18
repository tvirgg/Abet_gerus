import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { TaskStatus } from './enums';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  companyId!: string;

  @Column()
  studentId!: string;

  @ManyToOne(() => Student, (student) => student.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column()
  stage!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  xpReward!: number;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status!: TaskStatus;

  @Column('jsonb', { nullable: true })
  submission?: any;
}
