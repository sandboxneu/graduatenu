import { createAction } from "typesafe-actions";
import { Major } from "graduate-common";

export const setFullNameAction = createAction(
  "user/SET_FULL_NAME",
  (fullName: string) => ({
    fullName,
  })
)();

export const setAcademicYearAction = createAction(
  "user/SET_ACADEMIC_YEAR",
  (academicYear: number) => ({
    academicYear,
  })
)();

export const setGraduationYearAction = createAction(
  "user/SET_GRADUATION_YEAR",
  (graduationYear: number) => ({
    graduationYear,
  })
)();

export const setMajorAction = createAction(
  "user/SET_MAJOR",
  (major?: Major) => ({
    major,
  })
)();

export const setTokenAction = createAction(
  "user/SET_TOKEN",
  (token: string) => ({
    token,
  })
)();

export const setUserIdAction = createAction(
  "user/SET_USER_ID",
  (id: number) => ({
    id,
  })
)();

export const addPlanIdAction = createAction(
  "user/ADD_PLAN_ID",
  (planId: number) => ({
    planId,
  })
)();

export const setPlanNameAction = createAction(
  "user/SET_PLAN_NAME",
  (name: string) => ({
    name,
  })
)();

export const setLinkSharingAction = createAction(
  "user/SET_LINK_SHARING",
  (linkSharing: boolean) => ({
    linkSharing,
  })
)();

export const setMajorPlanAction = createAction(
  "user/SET_MAJOR_PLAN",
  (major: Major, planStr: string) => ({
    major,
    planStr,
  })
)();
