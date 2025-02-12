import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Schedule2 } from "@graduate/common";
import { Student } from "../../student/entities/student.entity";

@Entity()
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Student, (student) => student.plans, {
    onDelete: "CASCADE",
  })
  student: Student;

  @Column({ type: "json" })
  schedule: Schedule2<null>;

  @Column({ nullable: true })
  major: string;

  @Column({ nullable: true })
  minor: string;

  @Column({ nullable: true })
  concentration: string;

  @Column({ nullable: true, type: "smallint" })
  catalogYear: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
