import { GetStudentResponse } from "@graduate/common";

export const DELETE_COURSE_AREA_DND_ID = "delete-course-area";
export const SIDEBAR_DND_ID_PREFIX = "sidebar";
export const WEAK_PASSWORD_MSG =
  "A password should be at least 8 characters with digits and letters";
export const SEARCH_NEU_FETCH_COURSE_ERROR_MSG =
  "Sorry, we can't load details for this course right now 😞. We rely on SearchNEU for our course details, and there may be an ongoing issue on their end. We recommend refreshing the page and trying again soon.";
export const BETA_MAJOR_TOOLTIP_MSG =
  "Requirements for beta majors have not been validated and therefore may be inconsistent with your degree audit.";
export const GEN_PLACEHOLDER_MSG =
  "General Placeholderse are generic courses that you can place in your plan if you do not know yet what to take but want the requirements to be fulfilled";
export const FALL_1 = "1-FL";
export const COOP_TITLE = "Co-op Education";
export const FALL_1_COOP_ERROR_MSG =
  "You may only register a co-op in your second year and beyond.";
export const SPRING_4_COOP_ERROR_MSG =
  "You cannot register a co-op in your last semester.";
export const GENERIC_ERROR_MSG = "This is an error.";
export const UNDECIDED_CONCENTRATION = "Concentration Undecided";
export const UNDECIDED_STRING = "Undecided";

export const defaultGuestStudent: GetStudentResponse = {
  uuid: undefined,
  nuid: undefined,
  fullName: undefined,
  isOnboarded: false,
  email: "guest@guest.com",
  isEmailConfirmed: false,
  academicYear: undefined,
  graduateYear: undefined,
  catalogYear: undefined,
  major: undefined,
  coopCycle: undefined,
  coursesCompleted: undefined,
  coursesTransfered: undefined,
  primaryPlanId: undefined,
  concentration: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  plans: [],
};
