import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import * as bcrypt from "bcrypt";
import { Exclude } from "class-transformer";
import { ScheduleCourse, ScheduleCourse2 } from "@graduate/common";
import { Plan } from "../../plan/entities/plan.entity";

@Entity()
export class Student {
  @PrimaryGeneratedColumn("uuid")
  uuid: string;

  @Column({ nullable: true })
  nuid: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ default: false })
  isOnboarded: boolean;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  isEmailConfirmed: boolean;

  @Column()
  @Exclude() // excludes this whenever an instance of Student is returned by a controller
  password: string;

  @Column({ type: "smallint", nullable: true })
  academicYear: number;

  @Column({ type: "smallint", nullable: true })
  graduateYear: number;

  @Column({ type: "smallint", nullable: true })
  catalogYear: number;

  @Column({ nullable: true })
  major: string;

  @Column({ nullable: true })
  minor: string;

  @Column({ nullable: true })
  coopCycle: string;

  @Column({ type: "json", nullable: true })
  coursesCompleted: ScheduleCourse[];

  @Column({ type: "json", nullable: true })
  coursesTransfered: ScheduleCourse2<null>[];

  @Column({ nullable: true })
  primaryPlanId: number;

  @OneToMany(() => Plan, (plan) => plan.student)
  plans: Plan[];

  @Column({ nullable: true })
  concentration: string;

  @CreateDateColumn({ default: () => "NOW()" })
  createdAt: Date;

  @UpdateDateColumn({ default: () => "NOW()" })
  updatedAt: Date;

  @Exclude()
  // attached to the student object to be stored as a cookie only
  accessToken?: string;

  @BeforeUpdate()
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
