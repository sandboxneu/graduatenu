import { ScraperRequirement, RowType } from "../models/types";
import {
  IAndCourse,
  IRequiredCourse,
  IOrCourse,
  ISubjectRange,
} from "../../../frontend/src/models/types";
import { createRequiredCourse } from "../utils/scraper_utils";

/**
 * A function that given a row, converts it into a Requirement type.
 * @param $ the selector function used to query the DOM.
 * @param row the row to be proccessed.
 */
export function parseRowAsRequirement(
  $: CheerioStatic,
  row: CheerioElement
): ScraperRequirement | undefined {
  let currentRow: Cheerio = $(row);
  if (currentRow.find("a").length === 0) {
    // the row doesn't have any course information to be parsed in most cases.
    // expections exist, for eg: some biochemistry courses appear as a comment.
    // todo: handle the expections.
    return undefined;
  }
  //default to assume that row is a base case Required Course
  let rowType: RowType = RowType.RequiredCourseRow;
  let codeColSpan = currentRow.find("td.codecol span");
  let rangeSpan = currentRow.find("span.courselistcomment");

  if (codeColSpan.length !== 0) {
    if (codeColSpan.text().includes("and")) {
      rowType = RowType.AndRow;
    } else if (codeColSpan.text().includes("or")) {
      rowType = RowType.OrRow;
    }
  } else {
    if (rangeSpan.length !== 0) {
      rowType = RowType.SubjectRangeRow;
    }
  }

  switch (+rowType) {
    case RowType.AndRow:
      return parseAndRow($, row);
    case RowType.OrRow:
      return parseOrRow($, row);
    case RowType.SubjectRangeRow:
      return parseSubjectRangeRow($, row);
    case RowType.RequiredCourseRow:
      return parseRequiredRow($, row);
    default:
      return undefined;
  }
}

/**
 * A function that given a row, converts it into an IAndCourse Requirement type.
 * @param $ the selector function used to query the DOM.
 * @param row the row to be proccessed.
 */
function parseAndRow(
  $: CheerioStatic,
  row: CheerioElement
): IAndCourse | undefined {
  let andCourse: IAndCourse = {
    type: "AND",
    courses: [],
  };
  let currentRow: Cheerio = $(row);
  currentRow
    .find("td.codecol a")
    .each((index: number, anchor: CheerioElement) => {
      let currentAnchor: Cheerio = $(anchor);
      let course: String = currentAnchor.text();
      let splitArray: string[] = course.split(String.fromCharCode(160));
      let requiredCourse: IRequiredCourse = createRequiredCourse(
        splitArray[0],
        parseInt(splitArray[1])
      );
      andCourse.courses.push(requiredCourse);
    });

  if (andCourse.courses.length > 0) {
    return andCourse;
  } else {
    return undefined;
  }
}

/**
 * A function that given a row, converts it into an IOrCourse Requirement type.
 * @param $ the selector function used to query the DOM.
 * @param row the row to be proccessed.
 */
function parseOrRow(
  $: CheerioStatic,
  row: CheerioElement
): IOrCourse | undefined {
  let orCourse: IOrCourse = {
    type: "OR",
    courses: [],
  };
  let currentRow: Cheerio = $(row);
  currentRow
    .find("td.codecol a")
    .each((index: number, anchor: CheerioElement) => {
      let currentAnchor: Cheerio = $(anchor);
      let course: String = currentAnchor.text();
      let splitArray: string[] = course.split(String.fromCharCode(160));
      let requiredCourse: IRequiredCourse = createRequiredCourse(
        splitArray[0],
        parseInt(splitArray[1])
      );
      orCourse.courses.push(requiredCourse);
    });
  if (orCourse.courses.length > 0) {
    return orCourse;
  } else {
    return undefined;
  }
}

/**
 * A function that given a row, converts it into an ISubjectRange Requirement type.
 * @param $ the selector function used to query the DOM.
 * @param row the row to be proccessed.
 */
export function parseSubjectRangeRow(
  $: CheerioStatic,
  row: CheerioElement
): ISubjectRange | undefined {
  let currentRow: Cheerio = $(row);
  let anchors: Cheerio = currentRow.find("span.courselistcomment a");
  if (anchors.length == 0) {
    return;
  }

  //the length should be === 2.
  let anchorsArray: CheerioElement[] = anchors.toArray();
  let lowerAnchor: Cheerio = $(anchorsArray[0]);
  let splitLowerAnchor: string[] = lowerAnchor
    .text()
    .split(String.fromCharCode(160));

  //first item in the array is the subject
  let subject: string = splitLowerAnchor[0];

  //second item in array is the course number.
  let idRangeStart: number = parseInt(splitLowerAnchor[1]);

  //default to 9999, if upper bound does not exist.
  let idRangeEnd: number = 9999;
  if (
    !currentRow
      .find("span.courselistcomment")
      .text()
      .includes("or higher")
  ) {
    // upper bound exists, get range end.
    let upperAnchor: Cheerio = $(anchorsArray[1]);
    idRangeEnd = parseInt(
      upperAnchor.text().split(String.fromCharCode(160))[1]
    );
  }
  let courseRange: ISubjectRange = {
    subject: subject,
    idRangeStart: idRangeStart,
    idRangeEnd: idRangeEnd,
  };

  return courseRange;
}

/**
 * A function that given a row, converts it into an IRequiredCourse Requirement type.
 * @param $ the selector function used to query the DOM.
 * @param row the row to be proccessed.
 */
function parseRequiredRow(
  $: CheerioStatic,
  row: CheerioElement
): IRequiredCourse {
  let currentRow: Cheerio = $(row);
  let anchors: Cheerio = currentRow.find("td.codecol a");
  let anchorsArray: CheerioElement[] = anchors.toArray();

  //the length should be === 1.
  let loadedAnchor: Cheerio = $(anchorsArray[0]);
  //length of this array === 2.
  let splitAnchor: string[] = loadedAnchor
    .text()
    .split(String.fromCharCode(160));

  //first item in the array is the subject
  let subject: string = splitAnchor[0];

  //second item in array is the course number.
  let classId: number = parseInt(splitAnchor[1]);

  //construct the required course.
  let requiredCourse: IRequiredCourse = {
    type: "COURSE",
    classId: classId,
    subject: subject,
  };

  return requiredCourse;
}
