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
}
