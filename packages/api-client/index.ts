import Axios, { AxiosInstance, Method } from "axios";
import {
  CreatePlanDto,
  SignUpStudentDto,
  GetPlanResponse,
  GetStudentResponse,
  INEUAndReq,
  INEUOrReq,
  LoginStudentDto,
  UpdatePlanDto,
  UpdatePlanResponse,
  UpdateStudentDto,
  UpdateStudentResponse,
  OnboardStudentDto,
  ScheduleCourse2,
  Major2,
  GetSupportedMajorsResponse,
  ConfirmEmailDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  courseToString,
  NUPathEnum,
  GetMetaInfoResponse,
  GetSupportedMinorsResponse,
  Minor,
} from "@graduate/common";
import { ClassConstructor, plainToInstance } from "class-transformer";

class APIClient {
  private axios: AxiosInstance;

  private async req<T>(
    method: Method,
    url: string,
    responseClass?: ClassConstructor<T>,
    body?: any,
    params?: any,
    headers?: any
  ): Promise<T> {
    const deployedURL = `${window.location.protocol}//api.${window.location.hostname}/api`;
    const localhostURL = "/api";
    const baseURL =
      window.location.hostname === "localhost" ? localhostURL : deployedURL;

    const reqURL = baseURL + url;

    const res = (
      await this.axios.request({
        method,
        url: reqURL,
        data: body,
        params,
        headers,
      })
    ).data;
    return responseClass ? plainToInstance(responseClass, res) : res;
  }

  constructor() {
    this.axios = Axios.create({
      headers: { "content-type": "application/json" },
      withCredentials: true,
    });
  }

  auth = {
    login: (body: LoginStudentDto): Promise<GetStudentResponse> =>
      this.req("POST", "/auth/login", GetStudentResponse, body),
    register: (body: SignUpStudentDto): Promise<GetStudentResponse> =>
      this.req("POST", "/auth/register", GetStudentResponse, body),
    logout: (): Promise<GetStudentResponse> => this.req("GET", "/auth/logout"),
    forgotPassword: (body: ForgotPasswordDto): Promise<void> =>
      this.req("POST", "/auth/forgot-password", undefined, body),
    resetPassword: (body: ResetPasswordDto): Promise<GetStudentResponse> =>
      this.req("POST", "/auth/reset-password", GetStudentResponse, body),
  };

  email = {
    confirm: (body: ConfirmEmailDto): Promise<void> =>
      this.req("POST", "/email-confirmation/confirm", undefined, body),
    resendConfirmationLink: (): Promise<void> =>
      this.req("POST", "/email-confirmation/resend-confirmation-link"),
  };

  student = {
    update: (body: UpdateStudentDto): Promise<UpdateStudentResponse> =>
      this.req("PATCH", "/students/me", UpdateStudentResponse, body),
    onboard: (body: OnboardStudentDto): Promise<UpdateStudentResponse> =>
      this.req("PATCH", "/students/me/onboard", UpdateStudentResponse, body),
    getMe: (): Promise<GetStudentResponse> =>
      this.req("GET", "/students/me", GetStudentResponse),
    getMeWithPlan: (): Promise<GetStudentResponse> =>
      this.req("GET", "/students/me", GetStudentResponse, undefined, {
        isWithPlans: true,
      }),
    delete: (): Promise<void> => this.req("DELETE", "students/me"),
    changePassword: (body: ChangePasswordDto): Promise<void> =>
      this.req("POST", "/students/changePassword", undefined, body),
  };

  plans = {
    create: (body: CreatePlanDto): Promise<GetPlanResponse> =>
      this.req("POST", "/plans", GetPlanResponse, body),
    get: (id: string | number): Promise<GetPlanResponse> =>
      this.req("GET", `/plans/${id}`, GetPlanResponse),
    update: (
      id: string | number,
      body: UpdatePlanDto
    ): Promise<UpdatePlanResponse> =>
      this.req("PATCH", `/plans/${id}`, UpdatePlanResponse, body),
    delete: (id: string | number): Promise<void> =>
      this.req("DELETE", `/plans/${id}`),
  };

  majors = {
    get: (catalogYear: number, majorName: string): Promise<Major2> =>
      this.req<Major2>("GET", `/majors/${catalogYear}/${majorName}`),
    getSupportedMajors: (): Promise<GetSupportedMajorsResponse> =>
      this.req("GET", `/majors/supportedMajors`, GetSupportedMajorsResponse),
  };
  minors = {
    get: (catalogYear: number, minorName: string): Promise<Minor> =>
      this.req<Minor>("GET", `/minors/${catalogYear}/${minorName}`),
    getSupportedMinors: (): Promise<GetSupportedMinorsResponse> =>
      this.req("GET", `/minors/supportedMinors`, GetSupportedMinorsResponse),
  };

  meta = {
    getInfo: (): Promise<GetMetaInfoResponse> =>
      this.req("GET", "/meta/info", GetMetaInfoResponse),
  };
}

/**
 * We use term ids to ensure we search through as many terms as possible when
 * searching for a course.
 *
 * Term Id => "<Year><SemEncoding>"
 *
 * Year => XXXX. For the catalog year 22 - 23, the year is 23(unlike our catalog year).
 *
 * SemEncoding => 10 for fall, 30 for spring, 40 for summer 1, 50 for summer
 * full, 60 for summer 2
 *
 * Remember to update the catalog year every year to ensure we are searching all
 * possible terms.
 */
const ALL_COURSE_TERM_IDS = ["2022", "2023", "2024", "2025"]
  .map((year) => [
    `${year}10`,
    `${year}30`,
    `${year}40`,
    `${year}50`,
    `${year}60`,
  ])
  .flat();

interface SearchClass {
  name: string;
  classId: string;
  subject: string;
  prereqs?: INEUAndReq | INEUOrReq;
  coreqs?: INEUAndReq | INEUOrReq;
  nupath?: NUPathEnum[];
  maxCredits: number;
  minCredits: number;
  termId: string;
}

function termIdToYear(termId: string) {
  return parseInt(termId.slice(0, 4), 10);
}

/**
 * Check whether the term represented by the given term id is in the graduate nu
 * catalog year.
 */
function isTermIdInCatalogYear(termId: string, graduateCatalogYear: number) {
  const year = termIdToYear(termId);

  /**
   * For catalog year: X - Y, Graduate stores X but term ids are based on Y.
   *
   * Hence, for the year 22 - 23, Graduate's catalog year is 22 but term ids
   * will contain 23, so we add 1 to the Graduate catalog year.
   */
  return year === graduateCatalogYear + 1;
}

function occurrencesToCourseByCatalogYear(
  occurrences: SearchClass[],
  catalogYear?: number
): ScheduleCourse2<null> {
  if (!occurrences || occurrences.length === 0) {
    throw Error("Course not found");
  }

  if (!catalogYear) {
    return occurrenceToCourse(occurrences[0]);
  }

  for (const occurrence of occurrences) {
    const termId = occurrence.termId;
    if (termId && isTermIdInCatalogYear(termId, catalogYear)) {
      return occurrenceToCourse(occurrence);
    }
  }

  // if course not found for given catalog year, return the latest occurrence
  return occurrenceToCourse(occurrences[0]);
}

function occurrenceToCourse(occurrence: SearchClass): ScheduleCourse2<null> {
  return {
    name: occurrence.name,
    subject: occurrence.subject,
    classId: occurrence.classId,
    numCreditsMax: occurrence.maxCredits,
    numCreditsMin: occurrence.minCredits,
    prereqs: occurrence.prereqs,
    coreqs: occurrence.coreqs,
    nupaths: occurrence.nupath,
    id: null,
  };
}

/**
 * A client for interacting with the Search API. Allows us to fetch and search
 * for courses.
 */
class SearchAPIClient {
  private axios: AxiosInstance;

  constructor(baseURL = "https://api.searchneu.com/graphql") {
    this.axios = Axios.create({ baseURL: baseURL });
  }

  /**
   * Fetch a course for a given major catalog year. The catalog year determines
   * the co-reqs and pre-reqs for the course.
   *
   * If not specified(we don't care about the pre-reqs and co-reqs), then return
   * the course for any catalog year.
   */
  fetchCourse = async (
    subject: string,
    classId: string,
    catalogYear?: number
  ): Promise<ScheduleCourse2<null>> => {
    const res = await this.axios({
      method: "post",
      data: {
        query: `{ 
          class(subject: "${subject}", classId: "${classId}") {
            allOccurrences {
              name
              subject
              classId
              maxCredits
              minCredits
              prereqs
              coreqs
              nupath
            }
          }
        }`,
      },
    });

    const courseData = await res.data.data;
    if (courseData && courseData.class && courseData.class.allOccurrences) {
      return occurrencesToCourseByCatalogYear(
        courseData?.class?.allOccurrences,
        catalogYear
      );
    } else {
      throw Error("Course not found!");
    }
  };

  fetchCourses = async (
    courses: { subject: string; classId: string }[],
    catalogYear: number
  ): Promise<ScheduleCourse2<null>[]> => {
    const input = courses
      .map((course) => {
        return `{subject: "${course.subject}", classId: "${course.classId}"}`;
      })
      .join(",");

    const res = await this.axios({
      method: "post",
      data: {
        query: `{
        bulkClasses(input: [${input}]) {
          allOccurrences {
            name
            subject
            classId
            minCredits
            maxCredits
            prereqs
            coreqs
            nupath
            termId
          }
        }
      }`,
      },
    });

    const coursesData = await res.data.data;

    if (coursesData.bulkClasses) {
      return coursesData.bulkClasses.map((course: any) => {
        return occurrencesToCourseByCatalogYear(
          course?.allOccurrences,
          catalogYear
        );
      });
    } else {
      throw Error("Courses could not be fetched");
    }
  };

  /**
   * If catalog year is provided, we search only on courses that were offered in
   * that catalog year since those courses would likely have the right pre-req
   * and co-reqs.
   *
   * If catalog year is not provided, we return occurence of the course.
   */
  searchCourses = async (
    searchQuery: string,
    catalogYear?: number,
    nupath?: NUPathEnum[],
    minIndex = 0,
    maxIndex = 9999
  ): Promise<ScheduleCourse2<null>[]> => {
    const termsToSearch = catalogYear
      ? ALL_COURSE_TERM_IDS.filter((termId) =>
          isTermIdInCatalogYear(termId, catalogYear)
        )
      : ALL_COURSE_TERM_IDS;

    /** Descending years so that we prioritize latest occurences. */
    const termsOrderedByYear = termsToSearch.sort(
      (termId1, termId2) => termIdToYear(termId2) - termIdToYear(termId1)
    );

    /** Search courses from the latest terms to the older year terms. */
    const allCourses = await Promise.all(
      termsOrderedByYear.map((termId) =>
        this.searchCoursesForTerm(
          searchQuery,
          termId,
          nupath,
          minIndex,
          maxIndex
        )
      )
    );

    /**
     * Grab all the unique courses from the multiple searches while priortizing
     * the newer ones.
     */
    const uniqueCourses = new Map<string, ScheduleCourse2<null>>();
    allCourses.forEach((coursesForATerm) => {
      coursesForATerm.forEach((course) => {
        const courseKey = courseToString(course);
        if (!uniqueCourses.has(courseKey)) {
          uniqueCourses.set(courseKey, course);
        }
      });
    });

    return Array.from(uniqueCourses.values());
  };

  private searchCoursesForTerm = async (
    searchQuery: string,
    termId: string,
    nupath: NUPathEnum[] = [],
    minIndex = 0,
    maxIndex = 9999
  ): Promise<ScheduleCourse2<null>[]> => {
    const res = await this.axios({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        query: `
        {
          search(termId:"${termId}", query: "${searchQuery}", classIdRange: {min: ${minIndex}, max: ${maxIndex}}${
          nupath.length > 0 ? `, nupath: ${JSON.stringify(nupath)}` : ""
        }) {
            totalCount 
            pageInfo { hasNextPage } 
            nodes { ... on ClassOccurrence { name subject maxCredits minCredits prereqs coreqs nupath classId
            } 
          } 
        } 
      }`,
      }),
    });

    const coursesData = await res.data;
    const nodes = coursesData?.data?.search?.nodes ?? [];

    const courses = nodes.map((result: SearchClass) => {
      return {
        name: result.name,
        classId: result.classId,
        subject: result.subject,
        prereqs: result.prereqs,
        coreqs: result.coreqs,
        nupaths: result.nupath,
        numCreditsMin: result.minCredits,
        numCreditsMax: result.maxCredits,
      };
    });

    return courses;
  };
}

export const API = new APIClient();
export const SearchAPI = new SearchAPIClient();
