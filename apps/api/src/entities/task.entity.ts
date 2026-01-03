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

  // NEW: Custom quest form fields
  @Column({ type: 'varchar', nullable: true, default: 'text' })
  submission_type?: 'none' | 'text' | 'link' | 'file' | 'credentials';

  @Column({ type: 'text', nullable: true })
  hint?: string;

  @Column('simple-array', { nullable: true })
  accepted_formats?: string[];

  @Column({ type: 'text', nullable: true })
  advice?: string;
}
