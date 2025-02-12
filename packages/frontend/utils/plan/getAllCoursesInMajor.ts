import {
  IRequiredCourse,
  Major2,
  Minor,
  Requirement2,
  Section,
} from "@graduate/common";

export const getAllCoursesInMinor = (
  minor: Minor | undefined
): { subject: string; classId: string }[] => {
  if (!minor) {
    return [];
  }

  const minorRequirements = minor.requirementSections.reduce(
    (courses: IRequiredCourse[], section: Section) => {
      const requiredCourses: IRequiredCourse[] = [];
      getRequiredCourses(section?.requirements ?? [], requiredCourses);
      return courses.concat(requiredCourses);
    },
    []
  );

  const coursesQueryData: { subject: string; classId: string }[] = [];
  for (const requirement of minorRequirements) {
    const subject = requirement.subject;
    const classId = requirement.classId.toString();
    coursesQueryData.push({ subject, classId });
  }

  if (coursesQueryData) {
    return coursesQueryData;
  } else {
    return [];
  }
};

export const getAllCoursesInMajor = (
  major: Major2 | undefined,
  concentration: Section | undefined
): { subject: string; classId: string }[] => {
  if (!major) {
    return [];
  }

  const concentrationRequirements: IRequiredCourse[] = [];
  getRequiredCourses(
    concentration?.requirements ?? [],
    concentrationRequirements
  );

  const majorRequirements = major.requirementSections.reduce(
    (courses: IRequiredCourse[], section: Section) => {
      const requiredCourses: IRequiredCourse[] = [];
      getRequiredCourses(section.requirements ?? [], requiredCourses);
      return courses.concat(requiredCourses);
    },
    []
  );

  const requirements = majorRequirements.concat(concentrationRequirements);

  const coursesQueryData: { subject: string; classId: string }[] = [];
  for (const requirement of requirements) {
    const subject = requirement.subject;
    const classId = requirement.classId.toString();
    coursesQueryData.push({ subject, classId });
  }

  if (coursesQueryData) {
    return coursesQueryData;
  } else {
    return [];
  }
};

const getRequiredCourses = (
  requirements: Requirement2[],
  requiredCourses: IRequiredCourse[]
) => {
  for (const requirement of requirements) {
    if (requirement.type === "RANGE") {
      continue;
    } else if (requirement.type === "COURSE") {
      requiredCourses.push(requirement);
    } else if (requirement.type === "SECTION") {
      getRequiredCourses(requirement.requirements ?? [], requiredCourses);
    } else if (Array.isArray(requirement)) {
      getRequiredCourses(extractRequirements(requirement), requiredCourses);
    } else {
      getRequiredCourses(requirement.courses ?? [], requiredCourses);
    }
  }
};

const extractRequirements = (requirements: Requirement2[]): Requirement2[] => {
  const extracted: Requirement2[] = [];
  for (const value of requirements) {
    extracted.push(value);
  }
  return extracted;
};
