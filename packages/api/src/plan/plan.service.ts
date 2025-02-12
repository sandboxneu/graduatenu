import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Student } from "../student/entities/student.entity";
import { StudentService } from "../student/student.service";
import { DeleteResult, Repository, UpdateResult } from "typeorm";
import { CreatePlanDto, UpdatePlanDto } from "@graduate/common";
import { Plan } from "./entities/plan.entity";
import { formatServiceCtx } from "../utils";
import { MajorService } from "../major/major.service";
import {
  InvalidCatalogYear,
  InvalidConcentration,
  InvalidMajor,
} from "./plan.errors";

@Injectable()
export class PlanService {
  private readonly logger: Logger = new Logger();

  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    private readonly majorService: MajorService
  ) {}

  create(createPlanDto: CreatePlanDto, student: Student): Promise<Plan> {
    const {
      major: majorName,
      catalogYear,
      concentration: concentrationName,
    } = createPlanDto;

    // if the plan has a major, then validate the major, year, concentration
    if (majorName) {
      const major = this.majorService.findByMajorAndYear(
        majorName,
        catalogYear
      );
      if (!major) {
        this.logger.debug(
          {
            message: "Attempting to create a plan with an unsupported major.",
            majorName,
            catalogYear,
          },
          this.formatPlanServiceCtx("create")
        );

        return null;
      }

      const isValidConcentrationForMajor =
        this.majorService.isValidConcentrationForMajor(
          majorName,
          catalogYear,
          concentrationName
        );

      if (!isValidConcentrationForMajor) {
        this.logger.debug(
          {
            message:
              "Attempting to create a plan with an unsupported concentration.",
            majorName,
            catalogYear,
          },
          this.formatPlanServiceCtx("create")
        );

        return null;
      }
    }

    const newPlan = this.planRepository.create({ ...createPlanDto, student });

    try {
      return this.planRepository.save(newPlan);
    } catch (error) {
      return null;
    }
  }

  /** Returns the plan if it exists, else returns nothing. */
  async findOne(id: number): Promise<Plan | void> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ["student"],
    });

    if (!plan) {
      this.logger.debug(
        { message: "Plan doesn't exist in db", id },
        this.formatPlanServiceCtx
      );
      return;
    }

    return plan;
  }

  async isPlanOwnedByStudent(
    planId: number,
    loggedInStudent: Student
  ): Promise<boolean> {
    const plan = await this.findOne(planId);
    if (!plan) {
      this.logger.debug(
        { message: "Plan doesn't exist in db", planId },
        this.formatPlanServiceCtx("isPlanOwnedByStudent")
      );
      return false;
    }

    const planOwner = plan.student;

    return StudentService.isEqualStudents(planOwner, loggedInStudent);
  }

  async update(
    id: number,
    updatePlanDto: UpdatePlanDto
  ): Promise<UpdateResult> {
    const {
      major: newMajorName,
      minor: newMinorName,
      catalogYear: newCatalogYear,
      concentration: newConcentrationName,
      schedule: newSchedule,
      name: newName,
    } = updatePlanDto;

    const currentPlan = await this.findOne(id);

    if (!currentPlan) {
      this.logger.debug(
        { message: "Plan doesn't exist in db", id },
        this.formatPlanServiceCtx("update")
      );
      return null;
    }

    /**
     * If the major is being updated, all the fields related to the major
     * (catalog year, concentration) are updated.
     *
     * TODO: Fix the DTO issue that populates undefined values for fields not
     * present. https://github.com/sandboxnu/graduatenu/issues/533
     */
    // It is necessary for this to be OR because we need to run an update if any of these are true.
    const isMajorInfoUpdate =
      newMajorName || newCatalogYear || newConcentrationName;

    /** Wipe Major => Remove existing major from the plan. */
    const isWipeMajorUpdate =
      !newMajorName &&
      !newCatalogYear &&
      !newConcentrationName &&
      currentPlan.major;

    /** Wipe Minor => Remove existing minor from the plan. */
    const isWipeMinorUpdate =
      !newMinorName && !newCatalogYear && currentPlan.minor;

    const isScheduleUpdate = newSchedule && !isMajorInfoUpdate;

    if (
      !(isWipeMajorUpdate || isMajorInfoUpdate || isScheduleUpdate || newName)
    ) {
      this.logger.debug(
        { message: "Either update all major fields or only the schedule", id },
        this.formatPlanServiceCtx("update")
      );
    }

    // validate the major info if major is being updated
    if (isMajorInfoUpdate) {
      // validate the major, year, concentration pair if either one is being update
      const major = this.majorService.findByMajorAndYear(
        newMajorName,
        newCatalogYear
      );

      if (!major) {
        this.logger.debug(
          {
            message: "Attempting to update a plan with an unsupported major.",
            newMajorName,
            newCatalogYear,
          },
          this.formatPlanServiceCtx("update")
        );
        throw new InvalidMajor();
      }

      const isValidMajorCatalogueYear = this.majorService.isValidCatalogueYear(
        newMajorName,
        newCatalogYear,
        newConcentrationName
      );

      if (!isValidMajorCatalogueYear) {
        this.logger.debug(
          {
            message: "Attempting to add plan with an invalid catalogue year",
            newMajorName,
            newCatalogYear,
          },
          this.formatPlanServiceCtx("update")
        );

        throw new InvalidCatalogYear();
        return null;
      }

      const isValidConcentrationForMajor =
        this.majorService.isValidConcentrationForMajor(
          newMajorName,
          newCatalogYear,
          newConcentrationName
        );

      if (!isValidConcentrationForMajor) {
        this.logger.debug(
          {
            message:
              "Attempting to update a plan with an unsupported concentration.",
            newMajorName,
            newCatalogYear,
          },
          this.formatPlanServiceCtx("update")
        );

        throw new InvalidConcentration();
      }
    }

    /**
     * If some fields are not being updated, we use previous values. This is
     * needed cause we fields not being updated are still in the DTO for some
     * reason. Hence, if we simply update the plan with the DTO we override the
     * fields not being updated with undefined in the database, essentially
     * wiping it out.
     *
     * This should go away with TODO: https://github.com/sandboxnu/graduatenu/issues/533
     */
    let name = currentPlan.name;
    let schedule = currentPlan.schedule;
    let major = isWipeMajorUpdate ? undefined : currentPlan.major;
    let minor = isWipeMinorUpdate ? undefined : currentPlan.minor;
    let catalogYear = isWipeMajorUpdate ? undefined : currentPlan.catalogYear;
    let concentration = isWipeMajorUpdate
      ? undefined
      : currentPlan.concentration;

    if (newSchedule) {
      schedule = newSchedule;
    }

    if (newName) {
      name = newName;
    }

    if (newMajorName) {
      major = newMajorName;
      catalogYear = newCatalogYear;
      concentration = newConcentrationName;
    }

    if (newMinorName) {
      minor = newMinorName;
    }

    const newPlan = {
      name,
      major,
      minor,
      catalogYear,
      concentration,
      schedule,
    };
    const updateResult = await this.planRepository.update(id, newPlan);

    return updateResult;
  }

  async remove(id: number): Promise<DeleteResult> {
    const deleteResult = await this.planRepository.delete(id);

    if (deleteResult.affected === 0) {
      // no plan was deleted, which implies a plan with the given id wasn't found
      this.logger.debug(
        { message: "Plan doesn't exist in db", id },
        this.formatPlanServiceCtx("delete")
      );
      return null;
    }

    return deleteResult;
  }

  private formatPlanServiceCtx(methodName: string): string {
    return formatServiceCtx(PlanService.name, methodName);
  }
}
