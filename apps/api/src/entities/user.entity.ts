import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Company } from './company.entity';
import { Student } from './student.entity';
import { Curator } from './curator.entity';
import { Role } from './enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @ManyToOne(() => Company, (company) => company.users)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'enum', enum: Role, default: Role.STUDENT })
  role!: Role;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @OneToOne(() => Student, (student) => student.user)
  student?: Student;

  @OneToOne(() => Curator, (curator) => curator.user)
  curator?: Curator;
}
