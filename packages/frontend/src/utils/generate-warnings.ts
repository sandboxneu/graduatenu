import { IRequirementGroupWarning, WarningContainer } from "../models/types";
import {
  IWarning,
  CourseWarning,
  ANDSection,
  Concentration,
  courseEq,
  CourseTakenTracker,
  courseToString,
  IAndCourse,
  ICompleteCourse,
  ICourseRange,
  ICreditRangeCourse,
  IMajorRequirementGroup,
  INEUAndPrereq,
  INEUCourse,
  INEUOrPrereq,
  INEUPrereqCourse,
  IOrCourse,
  IRequiredCourse,
  IScheduleCourse,
  ISubjectRange,
  Major,
  ORSection,
  RANGESection,
  Requirement,
  Schedule,
  ScheduleCourse,
  ScheduleTerm,
  Season,
  SeasonEnum,
  StatusEnum,
} from "@graduate/common";
import { flattenRequirements } from "./flattenRequirements";
import { sortRequirementGroupsByConstraint } from "./requirementGroupUtils";

/*
CreditRange interface to track the min and max credits for a particular season.
seasonMax = a number representing the max numebr of credits you can take without over-loading.
seasonMin = a number representing the min number of credits you can take without under-loading.
*/
interface CreditRange {
  seasonMax: number;
  seasonMin: number;
}

/*
seasonCreditTracker is an object of string --> creditRange object.
This object is meant to encode max and min credit per season.
*/
const seasonCreditTracker: { [key: string]: CreditRange } = {
  SM: { seasonMax: 18, seasonMin: 12 },
  S1: { seasonMax: 9, seasonMin: 4 },
  S2: { seasonMax: 9, seasonMin: 4 },
  FL: { seasonMax: 18, seasonMin: 12 },
  SP: { seasonMax: 18, seasonMin: 12 },
};

interface CreditHourTracker {
  hoursCompleted: number;
}

interface HashableCourse {
  subject: string;
  classId: string;
  credits: number;
}

interface CourseInfo {
  subject: string;
  classId: string;
  terms: number[];
}

// CourseCodes for all filler objects in example plans of study
const all_fillers = ["XXXX9999"];

/**
 * This module contains functions that generate warnings based off a schedule input.
 *
 * A Schedule is defined as a 2D list of IScheduleCourses, where the first nested list is a single semester.
 *
 * Functions produce warnings in the same order, where each list corresponds to each semester.
 */

/**
 * Produces warnings for a schedule.
 * @param schedule the schedule
 * @returns a container holding the produced warnings.
 */
export function produceWarnings(
  schedule: Schedule,
  transferCourses: ScheduleCourse[]
): WarningContainer {
  // holds courses that are taken.
  const taken: Map<string, CourseInfo> = new Map<string, CourseInfo>();
  // custom tracker
  const tracker: CourseTakenTracker = {
    contains: (courseCode: string) => taken.has(courseCode),
    addCourse: (toAdd: ScheduleCourse | INEUCourse, termId: number) => {
      const code = courseCode(toAdd);
      const allTerms = taken.get(code);
      if (allTerms !== undefined) {
        allTerms.terms.push(termId);
      } else {
        const courseI: CourseInfo = {
          subject: toAdd.subject,
          classId: toAdd.classId.toString(),
          terms: [termId],
        };
        taken.set(code, courseI);
      }
    },
    addCourses: (toAdd: ScheduleCourse[] | INEUCourse[], termId: number) => {
      for (const course of toAdd) {
        const code = courseCode(course);
        const allTerms = taken.get(code);
        if (allTerms != undefined) {
          allTerms.terms.push(termId);
        } else {
          const courseI: CourseInfo = {
            subject: course.subject,
            classId: course.classId.toString(),
            terms: [termId],
          };
          taken.set(code, courseI);
        }
      }
    },
    getTermIds: (courseCode: string) => {
      const getVal: CourseInfo | undefined = taken.get(courseCode);
      if (getVal != undefined) {
        return getVal.terms;
      } else {
        return [];
      }
    },
  };

  // sort the years first to last
  const sorted = schedule.years.slice();
  sorted.sort((n1, n2) => n1 - n2);

  // handle transfer courses (treat all transfer courses if they were taken in the student's first semester)
  const firstYear = sorted[0];
  for (const course of transferCourses) {
    tracker.addCourse(course, schedule.yearMap[firstYear].fall.termId);
  }

  // store the two types of warnings.
  let normal: IWarning[] = [];
  let courseSpecific: CourseWarning[] = [];

  // computes a season's worth of warnings, updating as needed.
  function computeSeason(term: ScheduleTerm): void {
    // check all courses for warnings, and then add them, term by term.
    normal = normal.concat(produceNormalWarnings(term, tracker));
    courseSpecific = courseSpecific.concat(
      produceSpecificCourseWarnings(term, tracker)
    );
    addCoursesToTracker(term, tracker);
  }

  // for each of the years in schedule, retrieve the corresponding map.
  // smallest to biggest.
  for (const yearNum of sorted) {
    const year = schedule.yearMap[yearNum];

    computeSeason(year.fall);
    computeSeason(year.spring);

    // check summerI (could be summer full).
    computeSeason(year.summer1);
    // if summerfull, then no summer2. if not summerfull, then we have summer2.
    if (!year.isSummerFull) {
      computeSeason(year.summer2);
    }
  }

  // Iterate through each CourseInfo in the taken tracker and
  // warn each course that has more than 1 term listed for taking the course
  taken.forEach((courseIn: CourseInfo, code: string) => {
    const toWarn = tracker.getTermIds(code);
    if (toWarn.length > 1 && !all_fillers.includes(code)) {
      toWarn.forEach((termVal: number) => {
        courseSpecific.push({
          subject: courseIn.subject,
          classId: courseIn.classId,
          message: `${code}: appears in your schedule multiple times`,
          termId: termVal,
        });
      });
    }
  });

  // return the warnings.
  return {
    normalWarnings: normal,
    courseWarnings: courseSpecific,
  };
}

/**
 * Identify a list of satisfied requirements given a major and a schedule.
 * @param schedule the schedule to check requirements for.
 * @param major the major to check requirements against.
 */
export function produceSatisfiedReqGroups(
  schedule: Schedule,
  major: Major
): string[] {
  const reqWarnings: IRequirementGroupWarning[] = produceRequirementGroupWarning(
    schedule,
    major
  );
  const reqGroups: Set<string> = new Set(major.requirementGroups);

  for (const unsatisfiedWarning of reqWarnings) {
    reqGroups.delete(unsatisfiedWarning.requirementGroup);
  }

  return Array.from(reqGroups);
}

/**
 * Identify unsatisfied requirements given a major and a schedule.
 * @param schedule the schedule to check requirements for.
 * @param major the major to check requirements against.
 * @param concentration the concentration to also check requirements against.
 */
export function produceRequirementGroupWarning(
  schedule: Schedule,
  major: Major,
  concentration?: Concentration
): IRequirementGroupWarning[] {
  // holds courses that are currently on the schedule.
  const taken: Map<string, HashableCourse> = new Map<string, HashableCourse>();
  const coursesUsed: Set<string> = new Set<string>();

  //add courses from the schedule to a Map: string => number (produceCourseCode => creditHours)
  const sorted = schedule.years.slice();
  sorted.sort((n1, n2) => n1 - n2);
  for (const yearNum of sorted) {
    const year = schedule.yearMap[yearNum];

    // add courses, term by term.
    addCoursesToMap(year.fall, taken);

    addCoursesToMap(year.spring, taken);

    // if is summer full, only check summer I.
    // shouldn't matter, summerII would just be empty.
    if (year.isSummerFull) {
      addCoursesToMap(year.summer1, taken);
    } else {
      addCoursesToMap(year.summer1, taken);
      addCoursesToMap(year.summer2, taken);
    }
  }

  const requirementGroups: IMajorRequirementGroup[] = [
    ...Object.values(major.requirementGroupMap),
    ...Object.values(concentration?.requirementGroupMap || []),
  ];
  const res: IRequirementGroupWarning[] = [];
  const sortedRequirements = sortRequirementGroupsByConstraint(
    Object.values(requirementGroups)
  );

  for (const requirementGroup of sortedRequirements) {
    const unsatisfiedRequirement: IRequirementGroupWarning | undefined =
      produceUnsatifiedRequirement(requirementGroup, taken, coursesUsed);
    if (unsatisfiedRequirement) {
      res.push(unsatisfiedRequirement);
    }
  }
  return res;
}

/**
 * Produce an IUnsatisfiedRequirementGroup object if the requirementGroup hasn't been fully satisfied. Undefined otherwise.
 * @param requirementGroup the requirement group to check.
 * @param taken the Map of courses a student has on their schedule right now.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 */
function produceUnsatifiedRequirement(
  requirementGroup: IMajorRequirementGroup,
  taken: Map<string, HashableCourse>,
  coursesUsed: Set<string>
): IRequirementGroupWarning | undefined {
  switch (requirementGroup.type) {
    case "AND": {
      return processAndSection(requirementGroup, taken, coursesUsed);
    }
    case "OR": {
      return processOrSection(requirementGroup, taken, coursesUsed);
    }
    case "RANGE": {
      return processRangeSection(requirementGroup, taken, coursesUsed);
    }
    default: {
      throw new Error(
        "The given season was not a member of the enumeration required."
      );
    }
  }
}

/**
 * Produce an IUnsatisfiedRequirementGroup object if the given ANDSection hasn't been fully satisfied. Undefined otherwise.
 * @param requirementGroup the requirement group to check.
 * @param taken the Map of courses a student has on their schedule right now.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 */
function processAndSection(
  requirementGroup: ANDSection,
  taken: Map<string, HashableCourse>,
  coursesUsed: Set<string>
): IRequirementGroupWarning | undefined {
  const satisfied: CreditHourTracker = {
    hoursCompleted: 0,
  };
  const messages: string[] = [];
  for (const requirement of requirementGroup.requirements) {
    const message: string | undefined = processRequirement(
      requirement,
      taken,
      satisfied,
      coursesUsed,
      // zero because the credit hours don't matter in an AndSection--need to satisfy all requirements.
      0
    );
    if (message) {
      messages.push(message);
    }
  }

  //if any of the requirements were not satisfied produce warning.
  if (messages.length > 0) {
    const reqGroupMessage = `requirement not satisfied: ${messages.join(
      " AND "
    )}`;
    const res: IRequirementGroupWarning = {
      message: reqGroupMessage,
      requirementGroup: requirementGroup.name,
    };
    return res;
  } else {
    return undefined;
  }
}

/**
 * Produce an IUnsatisfiedRequirementGroup object if the given ORSection hasn't been fully satisfied. Undefined otherwise.
 * @param requirementGroup the requirement group to check.
 * @param taken the Map of courses a student has on their schedule right now.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 */
function processOrSection(
  requirementGroup: ORSection,
  taken: Map<string, HashableCourse>,
  coursesUsed: Set<string>
): IRequirementGroupWarning | undefined {
  const satisfied: CreditHourTracker = {
    hoursCompleted: 0,
  };
  const messages: string[] = [];
  const minCredsRequired: number = requirementGroup.numCreditsMin;
  for (const requirement of requirementGroup.requirements) {
    const message: string | undefined = processRequirement(
      requirement,
      taken,
      satisfied,
      coursesUsed,
      minCredsRequired
    );
    if (message) {
      messages.push(message);
    }

    //if the number of credits has been satisfied, we're good, don't need to look at rest of the requirements
    if (satisfied.hoursCompleted >= minCredsRequired) {
      return undefined;
    }
  }

  if (satisfied.hoursCompleted < minCredsRequired) {
    const reqGroupMessage = `requirement not satisfied: need ${
      minCredsRequired - satisfied.hoursCompleted
    } credits from: ${messages.join(" OR ")}`;
    const res: IRequirementGroupWarning = {
      message: reqGroupMessage,
      requirementGroup: requirementGroup.name,
    };
    return res;
  } else {
    return undefined;
  }
}

/**
 * Produce an IUnsatisfiedRequirementGroup object if the given ANDSection hasn't been fully satisfied. Undefined otherwise.
 * @param requirementGroup the requirement group to check.
 * @param taken the Map of courses a student has on their schedule right now.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 */
function processRangeSection(
  requirementGroup: RANGESection,
  taken: Map<string, HashableCourse>,
  coursesUsed: Set<string>
): IRequirementGroupWarning | undefined {
  const satisfied: CreditHourTracker = {
    hoursCompleted: 0,
  };
  const message: string | undefined = processRequirement(
    requirementGroup.requirements,
    taken,
    satisfied,
    coursesUsed,
    requirementGroup.numCreditsMin
  );

  // a range section only contains an ICourseRange. So if that wasn't satisfied, simply return the warning generated.
  if (message) {
    const reqGroupMessage = `requirement not satisfied: ${message}`;
    const res: IRequirementGroupWarning = {
      message: reqGroupMessage,
      requirementGroup: requirementGroup.name,
    };
    return res;
  } else {
    return undefined;
  }
}

/**
 * Produce a message listing unsatisfied requirements if requirement hasn't been fully satisfied. Undefined otherwise.
 * @param requirement the requirement to check
 * @param taken the Map of courses a student has on their schedule right now
 * @param satisfied a tracker of the hours satisfied for the top-level requirement.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 * @param creditHoursNeeded num hours need to satisfy top-level requirement.
 */
function processRequirement(
  requirement: Requirement,
  taken: Map<string, HashableCourse>,
  satisfied: CreditHourTracker,
  coursesUsed: Set<string>,
  creditHoursNeeded: number
): string | undefined {
  switch (requirement.type) {
    case "AND": {
      return processIAndCourse(
        requirement,
        taken,
        satisfied,
        coursesUsed,
        creditHoursNeeded
      );
    }
    case "OR": {
      return processIOrCourse(
        requirement,
        taken,
        satisfied,
        coursesUsed,
        creditHoursNeeded
      );
    }
    case "RANGE": {
      return processICourseRange(
        requirement,
        taken,
        satisfied,
        coursesUsed,
      );
    }
    // requirement is unsatisfied if doesn't exist in the taken map.
    case "COURSE": {
      return processIRequiredCourse(
        requirement,
        taken,
        satisfied,
        coursesUsed,
      );
    }
    case "CREDITS": {
      return processICreditRangeCourse(
        requirement,
        taken,
        satisfied,
        coursesUsed
      );
    }
  }
}

/**
 * Processes an IAndCourse requirement.
 * @param requirement the requirement to check
 * @param taken the Map of courses a student has on their schedule right now
 * @param satisfied a tracker of the hours satisfied for the top-level requirement.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 * @param creditHoursNeeded num hours need to satisfy top-level requirement.
 */
function processIAndCourse(
  requirement: IAndCourse,
  taken: Map<string, HashableCourse>,
  satisfied: CreditHourTracker,
  coursesUsed: Set<string>,
  creditHoursNeeded: number
): string | undefined {
  // requirement is unsatisfied if even one of the requirements in the list is unsatisfied.
  const processReqMessages: string[] = processRequirementCourses(
    requirement.courses,
    taken,
    satisfied,
    coursesUsed,
    creditHoursNeeded
  );
  if (processReqMessages.length > 0) {
    const reqMessage = `(${processReqMessages.join(" and ")})`;
    return reqMessage;
  } else {
    return undefined;
  }
}

/**
 * Processes an IOrCourse requirement.
 * @param requirement the requirement to check
 * @param taken the Map of courses a student has on their schedule right now
 * @param satisfied a tracker of the hours satisfied for the top-level requirement.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 * @param creditHoursNeeded num hours need to satisfy top-level requirement.
 */
function processIOrCourse(
  requirement: IOrCourse,
  taken: Map<string, HashableCourse>,
  satisfied: CreditHourTracker,
  coursesUsed: Set<string>,
  creditHoursNeeded: number
): string | undefined {
  // requirement is unsatisfied if all of the requirements in the list have not been satisfied.
  const processReqMessages: string[] = processRequirementCourses(
    requirement.courses,
    taken,
    satisfied,
    coursesUsed,
    creditHoursNeeded
  );
  if (processReqMessages.length === requirement.courses.length) {
    const reqMessage = `(${processReqMessages.join(" or ")})`;
    return reqMessage;
  } else {
    return undefined;
  }
}

/**
 * Processes an ICourseRange requirement.
 * @param requirement the requirement to check
 * @param taken the Map of courses a student has on their schedule right now
 * @param satisfied a tracker of the hours satisfied for the top-level requirement.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 * @param creditHoursNeeded num hours need to satisfy top-level requirement.
 */
function processICourseRange(
  requirement: ICourseRange,
  taken: Map<string, HashableCourse>,
  satisfied: CreditHourTracker,
  coursesUsed: Set<string>,
): string | undefined {
  // requirement is unsatisfied if the numCredits for the courseRange hasn't been satisfied.
  const numCreditsrequired: number = requirement.creditsRequired;
  let rangeCreditsCompleted = 0;

  //loop through the taken courses and check if it is in one of the subject ranges for this ICourseRange.
  for (const courseKey of Array.from(taken.keys())) {
    //check the global map to see if it has not been used.
    if (!coursesUsed.has(courseKey)) {
      const hashableCourse: HashableCourse | undefined = taken.get(courseKey);
      if (hashableCourse) {
        if (courseInSubjectRanges(hashableCourse, requirement.ranges)) {
          // use the course
          satisfied.hoursCompleted += hashableCourse.credits;
          coursesUsed.add(courseKey);
          rangeCreditsCompleted += hashableCourse.credits;
        }
      }
    }
  }

  if (rangeCreditsCompleted >= numCreditsrequired) {
    // ICourseRange satisfied
    return undefined;
  } else {
    return `(complete ${
      numCreditsrequired - rangeCreditsCompleted
    } credits from ${concatSubjectRanges(requirement.ranges)})`;
  }
}

/**
 * Check if a given HashableCourse is in the given array of IRequiredCourses
 * @param hashableCourse the HashableCourse to search for
 * @param requiredCourses the array of IRequiredCourses to search within
 */
function hashableCourseIsRequired(
  hashableCourse: HashableCourse,
  requiredCourses: IRequiredCourse[]
): boolean {
  return requiredCourses.some((c) => courseEq(c, hashableCourse));
}

/**
 * Processes an ICourseRange requirement.
 *
 * @param requirement the requirement to check
 * @param taken the Map of courses a student has on their schedule right now
 * @param satisfied a tracker of the hours satisfied for the top-level requirement.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 */
function processICreditRangeCourse(
  requirement: ICreditRangeCourse,
  taken: Map<string, HashableCourse>,
  satisfied: CreditHourTracker,
  coursesUsed: Set<string>
): string | undefined {
  // Requirement is unsatisfied if the number of credits fulfilled within its requirements is within the credit range.
  let requirementCreditsCompleted = 0;
  const allRequirementCourses = flattenRequirements(requirement.courses);

  // Loop through the taken courses and check if it is one of this ICreditRangeCourse's nested courses.
  for (const courseKey of Array.from(taken.keys())) {
    // Check the global map to see if it has not already been used.
    if (!coursesUsed.has(courseKey)) {
      const hashableCourse: HashableCourse | undefined = taken.get(courseKey);
      if (hashableCourse) {
        if (hashableCourseIsRequired(hashableCourse, allRequirementCourses)) {
          // Use the course
          satisfied.hoursCompleted += hashableCourse.credits;
          coursesUsed.add(courseKey);
          requirementCreditsCompleted += hashableCourse.credits;
        }
      }
    }
  }

  if (requirementCreditsCompleted < requirement.minCredits) {
    const untakenClasses = Array.from(allRequirementCourses).filter(
      (course: IRequiredCourse) =>
        !Array.from(taken.keys()).includes(courseCode(course))
    );
    const formattedUntakenClasses = untakenClasses.map(courseCode).join(", ");

    return `(complete ${
      requirement.minCredits - requirementCreditsCompleted
    } credits from ${formattedUntakenClasses})`;
  } else if (requirementCreditsCompleted > requirement.maxCredits) {
    return `(${
      requirementCreditsCompleted - requirement.maxCredits
    } credits taken over limit of ${requirement.maxCredits})`;
  }

  return undefined;
}

/**
 * Processes an IRequiredCourse requirement.
 * @param requirement the requirement to check
 * @param taken the Map of courses a student has on their schedule right now
 * @param satisfied a tracker of the hours satisfied for the top-level requirement.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 * @param creditHoursNeeded num hours need to satisfy top-level requirement.
 */
function processIRequiredCourse(
  requirement: IRequiredCourse,
  taken: Map<string, HashableCourse>,
  satisfied: CreditHourTracker,
  coursesUsed: Set<string>,
): string | undefined {
  // requirement is unsatisfied if doesn't exist in the taken map.
  const code: string = courseCode(requirement);
  const hashableCourse: HashableCourse | undefined = taken.get(code);
  if (hashableCourse) {
    satisfied.hoursCompleted += hashableCourse.credits;
    coursesUsed.add(code);
    return undefined;
  } else {
    return code;
  }
}

/**
 * Produce a message for each unsatisfied requirement. Undefined if all requirements in list satisfied.
 * @param requirements list of requirements
 * @param taken the Map of courses a student has on their schedule right now
 * @param satisfied a tracker of the hours satisfied for the top-level requirement.
 * @param coursesUsed a set of courses which already satisfy some requirement for the major.
 * @param creditHoursNeeded num hours need to satisfy top-level requirement.
 */
function processRequirementCourses(
  requirements: Requirement[],
  taken: Map<string, HashableCourse>,
  satisfied: CreditHourTracker,
  coursesUsed: Set<string>,
  creditHoursNeeded: number
): string[] {
  const res: string[] = [];
  for (const requirement of requirements) {
    const processedReq: string | undefined = processRequirement(
      requirement,
      taken,
      satisfied,
      coursesUsed,
      creditHoursNeeded
    );
    if (processedReq) {
      res.push(processedReq);
    }
    // if credit hours have been satisifed, don't process any other courses in the list.
    // ---bug: Co-reqs have zero credits on the schedule, so creditHoursNeeded will be satisifed with
    // just the primary course--without checking to see if co-req is on the schedule too.
    // ---fix: give co-reqs their respective credit-hours in schedule.
    if (
      creditHoursNeeded !== 0 &&
      satisfied.hoursCompleted >= creditHoursNeeded
    ) {
      break;
    }
  }
  return res;
}

/**
 * adds {@type ScheduleCourse}s to a tracker.
 * @param toAdd courses to add
 * @param tracker tracker to add to
 */
function addCoursesToTracker(
  toAdd: ScheduleTerm,
  tracker: CourseTakenTracker
): void {
  if (toAdd.status === "INACTIVE") {
    return;
  }
  for (const course of toAdd.classes) {
    tracker.addCourse(course, toAdd.termId);
  }
}

/**
 * Add courses from a ScheduleTerm to a Map of coursecode to creditHours
 * @param toAdd the ScheduleTerm
 * @param taken the Map
 */
function addCoursesToMap(
  toAdd: ScheduleTerm,
  taken: Map<string, HashableCourse>
): void {
  if (toAdd.status === "INACTIVE") {
    return;
  }
  for (const course of toAdd.classes) {
    const hashableCourse: HashableCourse = {
      subject: course.subject,
      classId: course.classId,
      credits: course.numCreditsMin,
    };
    taken.set(courseCode(course), hashableCourse);
  }
}

/**
 * Check if a course is in one of the subject ranges
 * @param courseCode the course to check
 * @param ranges the ranges to check against.
 */
function courseInSubjectRanges(
  course: HashableCourse,
  ranges: ISubjectRange[]
): boolean {
  // is the course in one of the subject ranges?
  const subject: string = course.subject;
  const classId: number = parseInt(course.classId);
  for (const subjRange of ranges) {
    if (
      subjRange.subject === subject &&
      subjRange.idRangeStart <= classId &&
      classId <= subjRange.idRangeEnd
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Sting concatenation of subject ranges
 * @param ranges the subject ranges.
 */
function concatSubjectRanges(ranges: ISubjectRange[]): string {
  const res: string[] = [];
  for (const range of ranges) {
    const rangeString: string =
      range.subject +
      " " +
      range.idRangeStart.toString() +
      "-" +
      range.idRangeEnd.toString();
    res.push(rangeString);
  }

  return res.join(" ");
}

/**
 * Produces all warnings for a given course.
 * @param classesToCheck the classes to check
 * @param tracker the course taken tracker
 */
function produceNormalWarnings(
  term: ScheduleTerm,
  tracker: CourseTakenTracker
): IWarning[] {
  let warnings: IWarning[] = [];
  const status: StatusEnum = term.status as StatusEnum;
  warnings = warnings.concat(
    checkSemesterCredits(
      term.classes,
      tracker,
      term.termId,
      term.season,
      status
    )
  );
  return warnings;
}

/**
 * Produces all course specific warnings for a given set of courses
 * @param term the classes to check
 * @param tracker the course taken traker
 */
function produceSpecificCourseWarnings(
  term: ScheduleTerm,
  tracker: CourseTakenTracker
): CourseWarning[] {
  let warnings: CourseWarning[] = [];
  warnings = warnings.concat(
    checkCorequisites(term.classes, tracker, term.termId)
  );
  warnings = warnings.concat(
    checkPrerequisites(term.classes, tracker, term.termId)
  );
  return warnings;
}

/**
 * Checks that course prerequisites are met for each semester.
 * @param toCheck The schedule to check.
 * @param tracker tracker for courses taken
 * @param termId the id for this term for the warning
 */
function checkPrerequisites(
  toCheck: ScheduleCourse[],
  tracker: CourseTakenTracker,
  termId: number
): CourseWarning[] {
  // the warnings produced.
  const warnings: CourseWarning[] = [];

  // tracker has all courses taken.
  for (const course of toCheck) {
    if (course.prereqs) {
      const prereqResult = doesPrereqExist(course.prereqs, tracker);
      if (prereqResult) {
        // if prereq doesn't exist, produce a warning.
        warnings.push({
          subject: course.subject,
          classId: course.classId,
          message: `${courseCode(
            course
          )}: prereqs not satisfied: ${prereqResult}`,
          termId: termId,
        });
      }
    }
  }
  return warnings;
}

/**
 * Checks that course corequisites are met for each semester.
 * @param schedule The schedule to check.
 * @param tracker tracker for courses taken
 */
function checkCorequisites(
  toCheck: ScheduleCourse[],
  tracker: CourseTakenTracker,
  termId: number
): CourseWarning[] {
  // construct the tracker.
  const coreqMap: Map<string, number> = new Map<string, number>();
  const coreqTracker: CourseTakenTracker = {
    contains: (code: string) => coreqMap.has(code),
    addCourses: function (
      courses: ScheduleCourse[] | INEUCourse[],
      termId: number
    ): void {
      for (const course of courses) {
        const code = courseCode(course);
        coreqMap.set(code, termId);
      }
    },
    addCourse: function (
      course: ScheduleCourse | INEUCourse,
      termId: number
    ): void {
      const code = courseCode(course);
      coreqMap.set(code, termId);
    },
    getTermIds: (courseCode: string) => {
      return Array.from(coreqMap.entries())
        .filter((e: [string, number]) => e[0] == courseCode)
        .map((e: [string, number]) => e[1]);
    },
  };

  // add warnings.
  for (const course of toCheck) {
    coreqTracker.addCourse(course, termId);
  }

  // the list of warnings.
  const warnings: CourseWarning[] = [];

  // check each course.
  for (const course of toCheck) {
    if (course.coreqs) {
      const prereqResult = doesPrereqExist(course.coreqs, coreqTracker);
      if (prereqResult) {
        warnings.push({
          subject: course.subject,
          classId: course.classId,
          message: `${courseCode(
            course
          )}: coreqs not satisfied: ${prereqResult}`,
          termId: termId,
        });
      }
    }
  }

  return warnings;
}

/**
 * Checks that per-semester credit counts don't exceed 19.
 * @param schedule The schedule to check.
 * @param tracker tracker for courses taken
 */
function checkSemesterCredits(
  toCheck: ScheduleCourse[],
  tracker: CourseTakenTracker,
  termId: number,
  season: Season | SeasonEnum,
  status: StatusEnum
): IWarning[] {
  let minCredits = 0;
  for (const course of toCheck) {
    minCredits += course.numCreditsMin; //use this one!
  }

  //defining a list of IWarnings to return later.
  const warnings: IWarning[] = [];

  let minSeasonCredits;
  let maxSeasonCredits;

  //if they are taking classes normally: set minCredits and maxCredits based on Season.
  if (status == "CLASSES") {
    //minSeasonCredits is the minimum number of credits to not be under enrolled for the given season.
    minSeasonCredits = seasonCreditTracker[season].seasonMin;
    //maxSeasonCredits is the maximum number of credits to not be over enrolled for the given season.
    maxSeasonCredits = seasonCreditTracker[season].seasonMax;

    //if they are taking classes on coop: set maxCredits to 5.
  } else {
    minSeasonCredits = 0;
    maxSeasonCredits = 5; //this is coded as 5 instead of 4 for a single class + lab
  }

  //checks the semester is classes or coop before throwing warnings.
  //no warnings can be thrown during an inactive semester.
  if (status == "CLASSES" || status == "COOP") {
    //if currently planning too few credits for the given season (needs at least one credit to throw warning).
    if (minSeasonCredits > minCredits && minCredits > 0) {
      warnings.push({
        message: `Currently enrolled in ${minCredits} credits(s). May be under-enrolled. Minimum credits for this term ${minSeasonCredits}.`,
        termId: termId,
      });
    }

    //if currently planning to overload credits  for this season. Throws warning.
    if (minCredits > maxSeasonCredits) {
      warnings.push({
        message: `Currently enrolled in ${minCredits} credit(s). May be over-enrolled. Maximum credits for this term ${maxSeasonCredits}.`,
        termId: termId,
      });
    }
  }
  return warnings;
}

/**
 * Prereq Validation code follows
 */

/**
 * Produces a string of the course's subject followed by classId.
 * @param course The course to get the code of.
 * @returns The courseCode of the course.
 */
export const courseCode = (
  course:
    | ICompleteCourse
    | IRequiredCourse
    | INEUCourse
    | INEUPrereqCourse
    | IScheduleCourse
    | ScheduleCourse
    | HashableCourse
) => {
  return courseToString(course);
};

/**
 * Checks whether or not the prereq's edges exist in the graph "graph"
 * @param to The classCode of the node to point to
 * @param prereq The prerequisite object to add an edge for (maybe).
 * @returns true if the full prereq exists in the graph "graph'"
 */
export const doesPrereqExist = (
  prereq: INEUAndPrereq | INEUOrPrereq,
  tracker: CourseTakenTracker
): string | undefined => {
  // if prereq is "and", check and.
  if (prereq.type === "and") {
    return doesAndPrereqExist(prereq, tracker);
  } else {
    return doesOrPrereqExist(prereq, tracker);
  }
};

/**
 *
 * @param to The classCode of the node to point to
 * @param prereq The prerequisite objec to add an edge for (maybe).
 * @returns true if the full prereq exists in the graph "graph"
 */
const doesAndPrereqExist = (
  prereq: INEUAndPrereq,
  tracker: CourseTakenTracker
): string | undefined => {
  // make sure each of the values exists.
  for (const item of prereq.values) {
    if ("type" in item) {
      // does the graph contain the entire prereq?
      const prereqResult = doesPrereqExist(item, tracker);
      if (prereqResult) {
        return `AND: {${prereqResult}}`;
      }
    } else {
      // does the graph contain an edge?
      if (!tracker.contains(courseCode(item))) {
        return `AND: ${courseCode(item)}`;
      }
    }
  }

  // if we hit this point, everything passed.
  return undefined;
};

/**
 *
 * @param to The classCode of the node to point to
 * @param prereq The prerequisite object to add an edge for (mabye).
 * @returns true if the full prerequisite object exists in the graph "graph"
 */
const doesOrPrereqExist = (
  prereq: INEUOrPrereq,
  tracker: CourseTakenTracker
): string | undefined => {
  // if any one of the prereqs exists, return true.
  for (const item of prereq.values) {
    if ("type" in item) {
      const prereqResult = doesPrereqExist(item, tracker);
      if (prereqResult === undefined) {
        return undefined;
      }
    } else {
      if (tracker.contains(courseCode(item))) {
        return undefined;
      }
    }
  }

  // nothing existed, so return false
  return `OR: ${prereq.values.map(function (prereq) {
    if ("type" in prereq) {
      return "{Object}";
    } else {
      return courseCode(prereq);
    }
  })}`;
};
