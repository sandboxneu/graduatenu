import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Student } from "src/student/entities/student.entity";
import { StudentService } from "src/student/student.service";
import { DeleteResult, Repository, UpdateResult } from "typeorm";
import { CreatePlanDto } from "@graduate/common/dto/create-plan.dto";
import { UpdatePlanDto } from "@graduate/common/dto/update-plan.dto";
import { Plan } from "./entities/plan.entity";

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>
  ) {}

  create(createPlanDto: CreatePlanDto, student: Student): Promise<Plan> {
    const newPlan = this.planRepository.create({ ...createPlanDto, student });

    try {
      return this.planRepository.save(newPlan);
    } catch (_error) {
      // TODO: Add logging for errors here and in every service method.
      return null;
    }
  }

  async findOne(id: number): Promise<Plan> {
    return this.planRepository.findOne({
      where: { id },
      relations: ["student"],
    });
  }

  async isPlanOwnedByStudent(
    planId: number,
    loggedInStudent: Student
  ): Promise<boolean> {
    const { student: planOwner } = await this.findOne(planId);

    /**
     * A plan that doesn't exist isn't owned by the anyone so returning false.
     */
    if (!planOwner) {
      return false;
    }

    return StudentService.isEqualStudents(planOwner, loggedInStudent);
  }

  async update(
    id: number,
    updatePlanDto: UpdatePlanDto
  ): Promise<UpdateResult> {
    const updateResult = await this.planRepository.update(id, updatePlanDto);

    if (updateResult.affected === 0) {
      // no plan was updated, which implies a plan with the given id wasn't found
      return null;
    }

    return updateResult;
  }

  async remove(id: number): Promise<DeleteResult> {
    const deleteResult = await this.planRepository.delete(id);

    if (deleteResult.affected === 0) {
      return null;
    }

    return deleteResult;
  }
}
