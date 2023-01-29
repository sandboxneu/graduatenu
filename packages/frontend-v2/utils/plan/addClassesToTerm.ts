import { PlanModel, ScheduleCourse2, SeasonEnum } from "@graduate/common";
import produce from "immer";
import { prepareClassesForDnd } from ".";
import { logger } from "../logger";
import { findTerm, flattenScheduleToTerms } from "./updatePlanOnDragEnd";

/**
 * Add the given classes to the given term in the plan.
 *
 * @returns The updated plan. The original plan isn't touched and remains unchanged.
 */
export const addClassesToTerm = (
  classes: ScheduleCourse2<null>[],
  termYear: number,
  termSeason: SeasonEnum,
  plan: PlanModel<string>
) => {
  const updatedPlan = produce(plan, (draftPlan) => {
    const schedule = draftPlan.schedule;
    schedule.years;

    const term = findTerm(termSeason, plan, termYear);

    const terms = flattenScheduleToTerms(schedule);

    // populate courses with dnd id
    const courseCount = terms.reduce(
      (count, term) => count + term.classes.length,
      0
    );

    const { dndClasses } = prepareClassesForDnd(classes, courseCount);

    // add the classes to the term
    term.classes.push(...dndClasses);
  });

  return updatedPlan;
};
