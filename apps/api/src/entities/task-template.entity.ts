import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('task_templates')
export class TaskTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  countryId?: string;

  @Column({ nullable: true })
  universityId?: string;

  // --- НОВОЕ: Привязка к конкретной программе ---
  @Column({ nullable: true })
  programId?: number;

  @Column()
  stage!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  xpReward!: number;

  @Column({ default: 'text' })
  submissionType!: string;

  @Column({ type: 'text', nullable: true })
  hint?: string;

  @Column('text', { nullable: true })
  advice?: string;

  @Column({ type: 'jsonb', nullable: true })
  validationRules?: any;

  @Column({ nullable: true })
  deadlineOffset?: number;

  @Column('simple-array', { nullable: true })
  accepted_formats?: string[];
}
