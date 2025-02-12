import {
  Concentrations2,
  IAndCourse2,
  ICourseRange2,
  IOrCourse2,
  IRequiredCourse,
  IScheduleCourse,
  IXofManyCourse,
  Major2,
  Requirement2,
  ScheduleCourse2,
  Section,
  ResultType,
  Result,
  Err,
  Ok,
  Minor,
} from "./types";
import { assertUnreachable, courseToString } from "./course-utils";

/**
 * General solution: postorder traversal requirements, producing all solutions
 * at each level. inductive step: combine child solutions to produce solutions
 * for ourselves
 */

// ------------------------ TYPES ------------------------

/**
 * A single solution, containing a list of courseToString(c) + # of credits
 * satisfied (needed for XOM)
 */
type Solution = {
  minCredits: number;
  maxCredits: number;
  sol: Array<string>;
};

/**
 * Concentrations are specified by their name or index in the accompanying
 * concentrations list
 */
type SelectedConcentrationsType = number | string | (number | string)[];

// Error types and constructors
export type MajorValidationError =
  | CourseError
  | AndError
  | OrError
  | XOMError
  | SectionError;
export const MajorValidationErrorType = {
  Course: "COURSE",
  Range: "RANGE",
  And: {
    Type: "AND",
    UnsatChild: "AND_UNSAT_CHILD",
    NoSolution: "AND_NO_SOLUTION",
    UnsatChildAndNoSolution: "AND_UNSAT_CHILD_AND_NO_SOLUTION",
  },
  Or: "OR",
  XofMany: "XOM",
  Section: "SECTION",
} as const;
export type ChildError = MajorValidationError & { childIndex: number };
type CourseError = {
  type: typeof MajorValidationErrorType.Course;
  requiredCourse: string;
};

export const CourseError = (c: IRequiredCourse): CourseError => ({
  type: MajorValidationErrorType.Course,
  requiredCourse: courseToString(c),
});
type AndError = {
  type: typeof MajorValidationErrorType.And.Type;
  error:
    | {
        type: typeof MajorValidationErrorType.And.UnsatChild;
        childErrors: Array<ChildError>;
      }
    | {
        type: typeof MajorValidationErrorType.And.NoSolution;
        discoveredAtChild: number;
      }
    | {
        type: typeof MajorValidationErrorType.And.UnsatChildAndNoSolution;
        noSolution: {
          type: typeof MajorValidationErrorType.And.NoSolution;
          discoveredAtChild: number;
        };
        unsatChildErrors: {
          type: typeof MajorValidationErrorType.And.UnsatChild;
          childErrors: Array<ChildError>;
        };
      };
};

export const AndErrorUnsatChildAndNoSolution = (
  unsatChildErrors: Array<ChildError>,
  noSolutionIndex: number
): AndError => {
  return {
    type: MajorValidationErrorType.And.Type,
    error: {
      type: MajorValidationErrorType.And.UnsatChildAndNoSolution,
      noSolution: {
        type: MajorValidationErrorType.And.NoSolution,
        discoveredAtChild: noSolutionIndex,
      },
      unsatChildErrors: {
        type: MajorValidationErrorType.And.UnsatChild,
        childErrors: unsatChildErrors,
      },
    },
  };
};

export const AndErrorUnsatChild = (
  childErrors: Array<ChildError>
): AndError => ({
  type: MajorValidationErrorType.And.Type,
  error: { type: MajorValidationErrorType.And.UnsatChild, childErrors },
});
export const AndErrorNoSolution = (idx: number): AndError => ({
  type: MajorValidationErrorType.And.Type,
  error: {
    type: MajorValidationErrorType.And.NoSolution,
    discoveredAtChild: idx,
  },
});
type OrError = {
  type: typeof MajorValidationErrorType.Or;
  childErrors: Array<ChildError>;
};
const OrError = (childErrors: Array<ChildError>): OrError => ({
  type: MajorValidationErrorType.Or,
  childErrors,
});
type XOMError = {
  type: typeof MajorValidationErrorType.XofMany;
  childErrors: Array<ChildError>;
  minRequiredCredits: number;
  maxPossibleCredits: number;
};
const XOMError = (
  r: IXofManyCourse,
  childErrors: Array<ChildError>,
  maxPossibleCredits: number
): XOMError => ({
  type: MajorValidationErrorType.XofMany,
  childErrors,
  minRequiredCredits: r.numCreditsMin,
  maxPossibleCredits,
});
type SectionError = {
  type: typeof MajorValidationErrorType.Section;
  sectionTitle: string;
  childErrors: Array<ChildError>;
  minRequiredChildCount: number;
  maxPossibleChildCount: number;
};
export const SectionError = (
  r: Section,
  childErrors: Array<ChildError>,
  max: number
): SectionError => ({
  type: MajorValidationErrorType.Section,
  sectionTitle: r.title,
  childErrors,
  minRequiredChildCount: r.minRequirementCount,
  maxPossibleChildCount: max,
});
export type TotalCreditsRequirementError = {
  takenCredits: number;
  requiredCredits: number;
};

// for keeping track of courses taken
interface CourseValidationTracker {
  // retrieve a given schedule course if it exists
  // validation algorithm shouldn't care about the id so we use unknown instead of any/null
  get(input: IScheduleCourse): ScheduleCourse2<unknown> | null;

  // retrieves the number of times a course has been taken
  getCount(input: IScheduleCourse): number;

  // retrieves all matching courses (subject, and within start/end inclusive)
  getAll(
    subject: string,
    start: number,
    end: number
  ): Array<ScheduleCourse2<unknown>>;

  // do we have enough courses to take all classes in both solutions?
  hasEnoughCoursesForBoth(s1: Solution, s2: Solution): boolean;
}

// exported for testing
export class Major2ValidationTracker implements CourseValidationTracker {
  // maps courseString => [course instance, # of times taken]
  private currentCourses: Map<string, [ScheduleCourse2<unknown>, number]>;

  constructor(courses: ScheduleCourse2<unknown>[]) {
    this.currentCourses = new Map();
    for (const c of courses) {
      const cs = courseToString(c);
      let tup = this.currentCourses.get(cs);
      if (!tup) {
        // assume each course instance is the same
        tup = [c, 0];
        this.currentCourses.set(cs, tup);
      }
      tup[1] += 1;
    }
  }

  get(input: IScheduleCourse) {
    const course = this.currentCourses.get(courseToString(input));
    if (course) {
      return course[0];
    }
    return null;
  }

  getCount(input: IScheduleCourse) {
    return this.currentCourses.get(courseToString(input))?.[1] ?? 0;
  }

  getAll(subject: string, start: number, end: number) {
    return Array.from(this.currentCourses.values()).flatMap(([c, count]) => {
      const cid = Number(c.classId);
      const valid = c.subject === subject && cid >= start && cid <= end;
      if (!valid) return [];
      return Array(count).fill(c);
    });
  }

  hasEnoughCoursesForBoth(s1: Solution, s2: Solution) {
    const s1map = Major2ValidationTracker.createTakenMap(s1);
    const s2map = Major2ValidationTracker.createTakenMap(s2);
    // iterate through the solution with fewer courses for speed
    const [fst, snd] =
      s1.sol.length < s2.sol.length ? [s1map, s2map] : [s2map, s1map];
    // for all courses in both solutions, check we have enough courses
    for (const [cs, fstCount] of fst) {
      const sndCount = snd.get(cs);
      // if not in second solution, we have enough (skip)
      if (!sndCount) continue;
      const neededCount = fstCount + sndCount;
      const tup = this.currentCourses.get(cs);
      if (!tup) {
        throw new Error("Solution contained a course that the tracker did not");
      }
      const actualCount = tup[1];
      // if we don't have enough, return false, otherwise continue
      if (actualCount < neededCount) {
        return false;
      }
    }
    return true;
  }

  // Maps the # of each course required in the given solution
  private static createTakenMap(s: Solution): Map<string, number> {
    const map = new Map();
    for (const c of s.sol) {
      const val = map.get(c) ?? 0;
      map.set(c, val + 1);
    }
    return map;
  }
}

// the result of major validation
export type MajorValidationResult = Result<
  Solution[],
  {
    majorRequirementsError?: MajorValidationError;
    totalCreditsRequirementError?: TotalCreditsRequirementError;
  }
>;

export function validateMajor2(
  major: Major2,
  taken: ScheduleCourse2<unknown>[],
  minor?: Minor,
  concentrations?: SelectedConcentrationsType
): MajorValidationResult {
  const tracker = new Major2ValidationTracker(taken);

  let concentrationReq: Requirement2[] = [];
  if (major.concentrations) {
    concentrationReq = getConcentrationsRequirement(
      concentrations,
      major.concentrations
    );
  }

  let minorRequirements: Requirement2[] = [];
  if (minor) {
    // Get the minor requirements and assign them
    minorRequirements = getMinorRequirement(minor);
    // console.log(minorRequirements)
  }

  //const majorReqs = [...major.requirementSections, ...(minor?.requirementSections ?? []), ...concentrationReq];
  const majorReqs = [
    ...major.requirementSections,
    ...minorRequirements,
    ...concentrationReq,
  ];
  // create a big AND requirement of all the sections and selected concentrations
  const requirementsResult = validateRequirement(
    {
      type: "AND",
      courses: majorReqs,
    },
    tracker
  );
  const creditsResult = validateTotalCreditsRequired(
    major.totalCreditsRequired + (minor?.totalCreditsRequired ?? 0),
    taken
  );

  const [solutions, majorRequirementsError] =
    requirementsResult.type === ResultType.Ok
      ? [requirementsResult.ok, undefined]
      : [undefined, requirementsResult.err];
  if (solutions) {
    return Ok(solutions);
  }
  const totalCreditsRequirementError =
    creditsResult.type === ResultType.Ok ? undefined : creditsResult.err;
  console.log("error");
  return Err({
    majorRequirementsError,
    totalCreditsRequirementError,
  });
}

/**
 * Produces the selected input concentrations to be included in major validation.
 *
 * @param inputConcentrations       The concentrations to include
 * @param concentrationsRequirement All available concentrations
 */
export function getConcentrationsRequirement(
  inputConcentrations: undefined | SelectedConcentrationsType,
  concentrationsRequirement: Concentrations2
): Requirement2[] {
  const selectedConcentrations =
    convertToConcentrationsArray(inputConcentrations);
  if (concentrationsRequirement.concentrationOptions.length === 0) {
    return [];
  }
  const concentrationRequirements = [];
  for (const c of selectedConcentrations) {
    const found = concentrationsRequirement.concentrationOptions.find(
      (cf, idx) => {
        switch (typeof c) {
          case "number":
            return c === idx;
          case "string":
            return c === cf.title;
          default:
            return assertUnreachable(c);
        }
      }
    );
    if (!found) {
      const msg = `Concentration specified was not found in the major: ${c}`;
      throw new Error(msg);
    }
    concentrationRequirements.push(found);
  }
  return [{ type: "AND", courses: concentrationRequirements }];
}

// normalizes input to an array of strings and numbers
function convertToConcentrationsArray(
  concentrations: undefined | string | number | (string | number)[]
) {
  if (concentrations === undefined) {
    return [];
  }
  if (
    typeof concentrations === "string" ||
    typeof concentrations === "number"
  ) {
    return [concentrations];
  }
  return concentrations;
}

export function getMinorRequirement(
  inputMinor: undefined | Minor
): Requirement2[] {
  // No minor
  if (!inputMinor) {
    return [];
  }

  // put all the minor requirments into minor requirments and assigning type as section
  const minorRequirements: Section[] = inputMinor.requirementSections;

  const selectedMinors = convertToMinorsArray(inputMinor);

  const matchedRequirements = [];
  // for (const minor of selectedMinors) {
  //   console.log(selectedMinors);
  //   const found = minorRequirements.find((m) => {
  //     // for(const req of )
  //     console.log(`Comparing title: ${m.title} with minor name: ${minor.name}`);
  //     return m.title === minor.name;
  //   });
  //   if (!found) {
  //     throw new Error (`Minor was not found: ${minor.name}`);
  //   }
  //   matchedRequirements.push(found);
  // }

  return [{ type: "AND", courses: minorRequirements }];
}

function convertToMinorsArray(minors: undefined | Minor | Minor[]): Minor[] {
  if (minors === undefined) {
    return [];
  }
  if (!Array.isArray(minors)) {
    return [minors];
  }
  return minors;
}

// the solutions returned may have duplicate courses, indicating the # of times a course is taken
export const validateRequirement = (
  req: Requirement2,
  tracker: CourseValidationTracker
): Result<Array<Solution>, MajorValidationError> => {
  switch (req.type) {
    // base cases
    case "RANGE":
      return validateRangeRequirement(req, tracker);
    case "COURSE":
      return validateCourseRequirement(req, tracker);
    // inductive cases
    case "AND":
      return validateAndRequirement(req, tracker);
    case "XOM":
      return validateXomRequirement(req, tracker);
    case "OR":
      return validateOrRequirement(req, tracker);
    case "SECTION":
      return validateSectionRequirement(req, tracker);
    default:
      return assertUnreachable(req);
  }
};

function validateTotalCreditsRequired(
  requiredCredits: number,
  coursesTaken: ScheduleCourse2<unknown>[]
): Result<null, TotalCreditsRequirementError> {
  const takenCredits = coursesTaken.reduce(
    (total, course) => total + course.numCreditsMin,
    0
  );

  if (takenCredits < requiredCredits) {
    return Err({
      takenCredits,
      requiredCredits,
    });
  }
  return Ok(null);
}

function validateCourseRequirement(
  r: IRequiredCourse,
  tracker: CourseValidationTracker
): Result<Array<Solution>, MajorValidationError> {
  const c = tracker.get(r);
  if (c) {
    return Ok([
      {
        minCredits: c.numCreditsMin,
        maxCredits: c.numCreditsMax,
        sol: [courseToString(c)],
      },
    ]);
  }
  return Err(CourseError(r));
}

function validateRangeRequirement(
  r: ICourseRange2,
  tracker: CourseValidationTracker
): Result<Array<Solution>, MajorValidationError> {
  // get the eligible courses (Filter out exceptions)
  const exceptions = new Set(r.exceptions.map(courseToString));
  const courses = tracker
    .getAll(r.subject, r.idRangeStart, r.idRangeEnd)
    .filter((c) => !exceptions.has(courseToString(c)));

  const solutionsSoFar: Array<Solution> = [];

  // produce all combinations of the courses
  for (const course of courses) {
    const solutionsSoFarWithCourse: Array<Solution> = [];
    const cs = courseToString(course);
    const courseSol = {
      sol: [cs],
      minCredits: course.numCreditsMin,
      maxCredits: course.numCreditsMax,
    };

    // Adds the current course to all previous valid solutions if there are
    // enough courses.
    for (const solutionSoFar of solutionsSoFar) {
      // TODO: if i take a course twice, can both count in the same range?
      // for now assume yes. but ask khoury, then remove this note
      if (tracker.hasEnoughCoursesForBoth(solutionSoFar, courseSol)) {
        const currentSol: Solution = combineSolutions(solutionSoFar, courseSol);
        solutionsSoFarWithCourse.push(currentSol);
      }
    }
    // include solutions where the only course is ourself
    solutionsSoFarWithCourse.push(courseSol);
    solutionsSoFar.push(...solutionsSoFarWithCourse);
  }
  return Ok(solutionsSoFar);
}

/**
 * Example: <child 1> <child 2> (CS2810 or CS2800) and (CS2810 or DS3000)
 *
 * Child Solutions:
 *
 * Child 1:
 *
 * - Solution 1: { min: 4, max: 4, sol: [CS2810]}
 * - Solution 2: { min: 4, max: 4, sol: [CS2800]} Child 2:
 * - Solution 1: { min: 4, max: 4, sol: [CS2810]}
 * - Solution 2: { min: 4, max: 4, sol: [DS3000]}
 *
 * For each of the sols so far, try combining with each solution of child 1:
 * solsSoFar = [[]]
 *
 * Try combining base solution with c1s1. It works! solsSoFarWithChild = [[CS2810]]
 *
 * Try combining base solution with c1s2. It works! solsSoFarWithChild =
 * [[CS2810], [CS2800]]
 *
 * Done with Child 1! set solsSoFar <- solsSoFarWithChild
 *
 * For each of the sols so far, try combining with each solution of child 2: Try
 * combining solsSoFar[0] = [CS2810] with c2s1 = [CS2810]. It doesn't work--
 * (CS2810 twice) solsSoFarWithChild = []
 *
 * Try combining solsSoFar[0] = [CS2810] with c2s2 = [DS3000]. It works!
 * solsSoFarWithChild = [[CS2810, DS3000]]
 *
 * // next solSoFar
 *
 * Try combining solsSoFar[1] = [CS2800] with c2s1 = [CS2810]. It works!
 * solsSoFarWithChild = [[CS2810, DS3000], [CS2800, CS2810]]
 *
 * Try combining solsSoFar[1] = [CS2800] with c2s2 = [DS3000]. It works!
 * solsSoFarWithChild = [[CS2810, DS3000], [CS2800, CS2810], [CS2800, DS3000]]
 *
 * That was the last child, so we are done!
 */
function validateAndRequirement(
  r: IAndCourse2,
  tracker: CourseValidationTracker
): Result<Array<Solution>, MajorValidationError> {
  const results = validateRequirements(r.courses, tracker);
  const [allChildReqSolutions, childErrors] = splitChildResults(results);

  // valid solutions for all the requirements so far
  let solutionsSoFar: Array<Solution> = [
    { maxCredits: 0, minCredits: 0, sol: [] },
  ];

  // Diff solutions of each requirement in the AND
  for (const childRequirementSolutions of allChildReqSolutions.values()) {
    const solutionsSoFarWithChild: Array<Solution> = [];
    for (const solutionSoFar of solutionsSoFar) {
      // Each solution of each subsolution
      for (const childSolution of childRequirementSolutions) {
        // if the intersection of us and the solution so far is empty, combine them and add to current solutions
        if (tracker.hasEnoughCoursesForBoth(childSolution, solutionSoFar)) {
          solutionsSoFarWithChild.push(
            combineSolutions(solutionSoFar, childSolution)
          );
        }
      }
    }
    // if there were no solutions added, then there are no valid solutions for the whole AND
    if (solutionsSoFarWithChild.length === 0) {
      const actualIndex = results.findIndex((solution) => {
        return (
          solution.type === ResultType.Ok &&
          solution.ok === childRequirementSolutions
        );
      });
      if (childErrors.length > 0) {
        return Err(AndErrorUnsatChildAndNoSolution(childErrors, actualIndex));
      } else {
        return Err(AndErrorNoSolution(actualIndex));
      }
    }
    solutionsSoFar = solutionsSoFarWithChild;
  }

  // AND's children has errors
  if (childErrors.length > 0) {
    return Err(AndErrorUnsatChild(childErrors));
  }

  return Ok(solutionsSoFar);
}

// find all combinations with total credits >= # required credits (kinda)
function validateXomRequirement(
  r: IXofManyCourse,
  tracker: CourseValidationTracker
): Result<Array<Solution>, MajorValidationError> {
  const splitResults = validateAndSplit(r.courses, tracker);
  const [allChildRequirementSolutions, childErrors] = splitResults;
  // error if there are no solutions, and at least 1 credit is required
  if (allChildRequirementSolutions.length === 0 && r.numCreditsMin > 0) {
    return Err(XOMError(r, childErrors, 0));
  }

  // solutions w #totalcredits < #required
  const unfinishedSolutionsSoFar: Array<Solution> = [];
  // solutions w #totalCredits >= #required
  const finishedSolutions: Array<Solution> = [];

  for (const childRequirementSolutions of allChildRequirementSolutions) {
    const unfinishedSolutionsWithChild: Array<Solution> = [];
    // for each child, try each childSolution with each unfinishedSolution
    for (const childSolution of childRequirementSolutions) {
      for (const solutionSoFar of unfinishedSolutionsSoFar) {
        // if we have enough credits for both, add it
        if (tracker.hasEnoughCoursesForBoth(childSolution, solutionSoFar)) {
          const currentSol = combineSolutions(solutionSoFar, childSolution);
          // Check if the min credit requirement is met, if it is
          // I don't need to build on this solution so add to finished
          if (currentSol.minCredits >= r.numCreditsMin) {
            finishedSolutions.push(currentSol);
          } else {
            unfinishedSolutionsWithChild.push(currentSol);
          }
        }
      }
      // consider the by itself as well (possible we don't take any prior solutions)
      if (childSolution.minCredits >= r.numCreditsMin) {
        finishedSolutions.push(childSolution);
      } else {
        unfinishedSolutionsWithChild.push(childSolution);
      }
    }
    // add all child+unfinished combinations to unfinished
    unfinishedSolutionsSoFar.push(...unfinishedSolutionsWithChild);
  }
  if (finishedSolutions.length > 0) {
    return Ok(finishedSolutions);
  }
  // Find the sol with the max credits, as use that as your error
  const max = unfinishedSolutionsSoFar.reduce(
    (a, b) => Math.max(a, b.minCredits),
    0
  );
  return Err(XOMError(r, childErrors, max));
}

function validateOrRequirement(
  r: IOrCourse2,
  tracker: CourseValidationTracker
): Result<Array<Solution>, MajorValidationError> {
  // just return concatenated list of child solutions
  const [oks, errs] = validateAndSplit(r.courses, tracker);
  if (oks.length === 0) {
    return Err(OrError(errs));
  }
  return Ok(oks.flat());
}

function validateSectionRequirement(
  r: Section,
  tracker: CourseValidationTracker
): Result<Array<Solution>, MajorValidationError> {
  if (r.minRequirementCount < 1) {
    return Ok([]);
    // this should be an invalid shape and throw an error, but for now we'll just return an empty array
    // since the solution for a section with no requirements is an empty array
    throw new Error("Section requirement count must be >= 1");
  }

  const splitResults = validateAndSplit(r.requirements, tracker);
  const [allChildRequirementSolutions, childErrors] = splitResults;
  // we must have at least the min required # of child solutions
  if (allChildRequirementSolutions.length < r.minRequirementCount) {
    return Err(
      SectionError(r, childErrors, allChildRequirementSolutions.length)
    );
  }

  type Solution1 = Solution & { count: number };
  // invariant: requirementCount of unfinished solutions < minRequirementCount
  const unfinishedSolutionsSoFar: Array<Solution1> = [];
  // solutions where requirement count === minRequirementCount
  const finishedSolutions: Array<Solution> = [];

  for (const childRequirementSolutions of allChildRequirementSolutions) {
    const unfinishedSolutionsWithChild: Array<Solution1> = [];
    // for each child, try each childSolution with each unfinishedSolution
    for (const childSolution of childRequirementSolutions) {
      for (const {
        count: solutionSoFarCount,
        ...solutionSoFar
      } of unfinishedSolutionsSoFar) {
        // if enough for both, combine them, then add to corresponding list
        if (tracker.hasEnoughCoursesForBoth(childSolution, solutionSoFar)) {
          const currentSol = combineSolutions(solutionSoFar, childSolution);
          const currentSolCount = solutionSoFarCount + 1;
          if (currentSolCount === r.minRequirementCount) {
            finishedSolutions.push(currentSol);
          } else {
            unfinishedSolutionsWithChild.push({
              ...currentSol,
              count: currentSolCount,
            });
          }
        }
      }
      // same as XOM, consider the solutions where we don't take prior child solutions
      // push single child solution by itself
      if (r.minRequirementCount === 1) {
        finishedSolutions.push(childSolution);
      } else {
        unfinishedSolutionsWithChild.push({ ...childSolution, count: 1 });
      }
    }
    unfinishedSolutionsSoFar.push(...unfinishedSolutionsWithChild);
  }
  if (finishedSolutions.length > 0) {
    return Ok(finishedSolutions);
  }
  const max = unfinishedSolutionsSoFar.reduce(
    (a, b) => Math.max(a, b.count),
    0
  );
  return Err(SectionError(r, childErrors, max));
}

function combineSolutions(s1: Solution, s2: Solution) {
  return {
    minCredits: s1.minCredits + s2.minCredits,
    maxCredits: s1.maxCredits + s2.maxCredits,
    sol: [...s1.sol, ...s2.sol],
  };
}

// validates children and splits their results into solutions and errors
function validateAndSplit(
  rs: Requirement2[],
  tracker: CourseValidationTracker
): [Solution[][], Array<ChildError>] {
  const results = validateRequirements(rs, tracker);
  return splitChildResults(results);
}

function splitChildResults(
  reqs: Result<Solution[], MajorValidationError>[]
): [Solution[][], Array<ChildError>] {
  const oks = [];
  const errs = [];
  for (let i = 0; i < reqs.length; i += 1) {
    const result = reqs[i];
    if (result.type === ResultType.Ok) oks.push(result.ok);
    else errs.push({ ...result.err, childIndex: i });
  }
  return [oks, errs];
}

function validateRequirements(
  rs: Requirement2[],
  tracker: CourseValidationTracker
) {
  while (rs.some((r) => Array.isArray(r))) {
    const newRs = [];
    for (const r of rs) {
      if (Array.isArray(r)) {
        newRs.push(...extractRequirements(r));
      } else {
        newRs.push(r);
      }
    }
    rs = newRs;
  }

  return rs.map((r) => validateRequirement(r, tracker));
}

const extractRequirements = (requirements: Requirement2[]): Requirement2[] => {
  const extracted: Requirement2[] = [];
  for (const value of requirements) {
    extracted.push(value);
  }
  return extracted;
};
