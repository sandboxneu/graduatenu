import { createAction } from "typesafe-actions";
import {
  Schedule,
  ScheduleCourse,
  SeasonWord,
  Status,
} from "../../../../common/types";
import {
  DNDSchedule,
  DNDScheduleCourse,
  DNDScheduleTerm,
  IPlanData,
} from "../../models/types";

export const setActivePlanAction = createAction(
  "userPlans/SET_ACTIVE_PLAN",
  (activePlan: string, academicYear: number) => ({ activePlan, academicYear })
)();

export const addNewPlanAction = createAction(
  "userPlans/ADD_NEW_PLAN",
  (plan: IPlanData, academicYear: number) => ({ plan, academicYear })
)();

export const setUserPlansAction = createAction(
  "userPlans/SET_USER_PLANS",
  (plans: IPlanData[], academicYear: number) => ({ plans, academicYear })
)();

export const updateActivePlanAction = createAction(
  "userPlans/UPDATE_ACTIVE_PLAN",
  (plan: Partial<IPlanData>) => ({ plan })
)();

export const deletePlan = createAction(
  "userPlans/DELETE_PLAN",
  (name: string) => ({ name })
)();

// TODO: remove this and do the DND conversion in setActivePlanScheduleAction (if possible)
export const setActivePlanDNDScheduleAction = createAction(
  "userPlans/SET_ACTIVE_PLAN_DND_SCHEDULE",
  (schedule: DNDSchedule) => ({ schedule })
)();

export const setActivePlanMajorAction = createAction(
  "schedule/SET_ACTIVE_PLAN_MAJOR",
  (major: string) => ({ major })
)();

export const setActivePlanCoopCycleAction = createAction(
  "schedule/SET_ACTIVE_PLAN_COOP_CYCLE",
  (coopCycle: string, allPlans?: Record<string, Schedule[]>) => ({
    coopCycle,
    allPlans,
  })
)();

export const setActivePlanScheduleAction = createAction(
  "userPlans/SET_ACTIVE_PLAN_SCHEDULE",
  (schedule: Schedule) => ({ schedule })
)();

export const addCoursesToActivePlanAction = createAction(
  "userPlans/ADD_COURSES_TO_ACTIVE_PLAN",
  (courses: ScheduleCourse[], semester: DNDScheduleTerm) => ({
    courses,
    semester,
  })
)();

export const removeClassFromActivePlanAction = createAction(
  "userPlans/REMOVE_CLASS_FROM_ACTIVE_PLAN",
  (course: DNDScheduleCourse, semester: DNDScheduleTerm) => ({
    course,
    semester,
  })
)();

export const undoRemoveClassFromActivePlanAction = createAction(
  "userPlans/UNDO_REMOVE_CLASS_FROM_ACTIVE_PLAN",
  () => void 0
)();

export const changeSemesterStatusForActivePlanAction = createAction(
  "userPlans/CHANGE_SEMESTER_STATUS_FOR_ACTIVE_PLAN",
  (newStatus: Status, year: number, season: SeasonWord) => ({
    newStatus,
    year,
    season,
  })
)();

export const updateSemesterForActivePlanAction = createAction(
  "userPlans/UPDATE_SEMESTER_FOR_ACTIVE_PLAN",
  (year: number, season: SeasonWord, newSemester: DNDScheduleTerm) => ({
    year,
    season,
    newSemester,
  })
)();

export const setCurrentClassCounterForActivePlanAction = createAction(
  "userPlans/SET_CURRENT_CLASS_COUNTER_FOR_ACTIVE_PLAN",
  (currentClassCounter: number) => ({ currentClassCounter })
)();

export const incrementCurrentClassCounterForActivePlanAction = createAction(
  "userPlans/INCREMENT_CURRENT_CLASS_COUNTER_FOR_ACTIVE_PLAN",
  () => void 0
)();

export const toggleYearExpandedForActivePlanAction = createAction(
  "userPlans/TOGGLE_YEAR_EXPANDED_FOR_ACTIVE_PLAN",
  (index: number) => ({ index })
)();
