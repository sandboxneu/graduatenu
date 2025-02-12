import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Schedule2, ScheduleCourse } from "./types";

/**
 * Data transfer objects for data going into our API. Class validator decorators
 * are used to validate incoming data.
 */

export class CreatePlanDtoWithoutSchedule {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  major?: string;

  @IsString()
  @IsOptional()
  minor?: string;

  @IsString()
  @IsOptional()
  concentration?: string;

  @IsInt()
  @Min(1898)
  @Max(3000)
  @IsOptional()
  catalogYear?: number;

  @IsBoolean()
  @IsOptional()
  agreeToBetaMajor?: boolean;
}

export class CreatePlanDto extends CreatePlanDtoWithoutSchedule {
  @IsObject()
  schedule: Schedule2<null>;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  schedule?: Schedule2<null>;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  minor?: string;

  @IsOptional()
  @IsString()
  concentration?: string;

  @IsOptional()
  @IsInt()
  @Min(1898)
  @Max(3000)
  catalogYear?: number;
}

export class SignUpStudentDto {
  @IsOptional()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  passwordConfirm: string;
}
export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  nuid?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(1898) // the year NEU was established
  @Max(3000) // will GraduateNU last beyond year 3000?!
  academicYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1898)
  @Max(3000)
  graduateYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1898)
  @Max(3000)
  catalogYear?: number;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  minor?: string;

  @IsOptional()
  @IsString()
  coopCycle?: string;

  @IsOptional()
  @IsObject()
  coursesCompleted?: ScheduleCourse[];

  @IsOptional()
  @IsArray()
  coursesTransfered?: ScheduleCourse[];

  @IsOptional()
  @IsInt()
  primaryPlanId?: number;

  @IsOptional()
  @IsString()
  concentration?: string;

  @IsOptional()
  @IsBoolean()
  isOnboarded?: boolean;
}

export class OnboardStudentDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsString()
  nuid: string;

  @IsInt()
  @Min(1898) // the year NEU was established
  @Max(3000) // will GraduateNU last beyond year 3000!
  academicYear: number;

  @IsInt()
  @Min(1898)
  @Max(3000)
  graduateYear: number;

  @IsInt()
  @Min(1898)
  @Max(3000)
  catalogYear: number;

  @IsString()
  major: string;

  @IsString()
  minor: string;

  @IsString()
  coopCycle: string;

  @IsObject()
  coursesCompleted: ScheduleCourse[];

  @IsObject()
  coursesTransfered: ScheduleCourse[];

  @IsInt()
  primaryPlanId: number;

  @IsString()
  concentration: string;
}

export class LoginStudentDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class ConfirmEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  newPasswordConfirm: string;
}

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  passwordConfirm: string;
}
