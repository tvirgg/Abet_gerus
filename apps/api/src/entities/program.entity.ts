import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { University } from './university.entity';

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  universityId!: string;

  @ManyToOne(() => University, (uni) => uni.programs)
  @JoinColumn({ name: 'universityId' })
  university!: University;

// --- НОВОЕ ПОЛЕ ---
  @Column({ nullable: true })
  category?: string; // 'IT', 'Engineering', 'Business', 'Arts', etc.

  @Column()
  title!: string;

  @Column({ type: 'date', nullable: true })
  deadline?: string;

  @Column({ nullable: true })
  link?: string;

  @Column({ nullable: true })
  imageUrl?: string;
}
