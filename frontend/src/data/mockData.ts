import {
  DNDSchedule,
  DNDScheduleCourse,
  SeasonEnum,
  StatusEnum,
} from "../models/types";

const mockClass = (num: number): DNDScheduleCourse => ({
  semester: null,
  classId: "3500",
  subject: "CS",
  numCreditsMin: 4,
  numCreditsMax: 4,
  dndId: "class-" + num,
  name: "Object-Oriented Design",
});

export const mockEmptySchedule: DNDSchedule = {
  years: [2019, 2020, 2021, 2022],
  yearMap: {
    2019: {
      year: 2019,
      isSummerFull: false,
      fall: {
        season: SeasonEnum.FL,
        year: 2019,
        termId: 201910,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      spring: {
        season: SeasonEnum.SP,
        year: 2019,
        termId: 201930,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      summer1: {
        season: SeasonEnum.S1,
        year: 2019,
        termId: 201940,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      summer2: {
        season: SeasonEnum.S2,
        year: 2019,
        termId: 201960,
        status: StatusEnum.CLASSES,
        classes: [],
      },
    },
    2020: {
      year: 2020,
      isSummerFull: false,
      fall: {
        season: SeasonEnum.FL,
        year: 2020,
        termId: 202010,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      spring: {
        season: SeasonEnum.SP,
        year: 2020,
        termId: 202030,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      summer1: {
        season: SeasonEnum.S1,
        year: 2020,
        termId: 202040,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      summer2: {
        season: SeasonEnum.S2,
        year: 2020,
        termId: 202060,
        status: StatusEnum.CLASSES,
        classes: [],
      },
    },
    2021: {
      year: 2021,
      isSummerFull: false,
      fall: {
        season: SeasonEnum.FL,
        year: 2021,
        termId: 202110,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      spring: {
        season: SeasonEnum.SP,
        year: 2021,
        termId: 202130,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      summer1: {
        season: SeasonEnum.S1,
        year: 2021,
        termId: 202140,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      summer2: {
        season: SeasonEnum.S2,
        year: 2021,
        termId: 202160,
        status: StatusEnum.CLASSES,
        classes: [],
      },
    },
    2022: {
      year: 2022,
      isSummerFull: false,
      fall: {
        season: SeasonEnum.FL,
        year: 2022,
        termId: 202210,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      spring: {
        season: SeasonEnum.SP,
        year: 2022,
        termId: 202230,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      summer1: {
        season: SeasonEnum.S1,
        year: 2022,
        termId: 202240,
        status: StatusEnum.CLASSES,
        classes: [],
      },
      summer2: {
        season: SeasonEnum.S2,
        year: 2022,
        termId: 202260,
        status: StatusEnum.CLASSES,
        classes: [],
      },
    },
  },
};

export const mockData: DNDSchedule = {
  years: [2019, 2020],
  yearMap: {
    2019: {
      year: 2019,
      isSummerFull: false,
      fall: {
        season: SeasonEnum.FL,
        year: 2019,
        termId: 201910,
        status: StatusEnum.CLASSES,
        classes: [mockClass(1), mockClass(2), mockClass(3), mockClass(4)],
      },
      spring: {
        season: SeasonEnum.SP,
        year: 2019,
        termId: 201930,
        status: StatusEnum.CLASSES,
        classes: [mockClass(5), mockClass(6), mockClass(7), mockClass(8)],
      },
      summer1: {
        season: SeasonEnum.S1,
        year: 2019,
        termId: 201940,
        status: StatusEnum.CLASSES,
        classes: [mockClass(9), mockClass(10)],
      },
      summer2: {
        season: SeasonEnum.S2,
        year: 2019,
        termId: 201960,
        status: StatusEnum.CLASSES,
        classes: [],
      },
    },
    2020: {
      year: 2020,
      isSummerFull: false,
      fall: {
        season: SeasonEnum.FL,
        year: 2020,
        termId: 202010,
        status: StatusEnum.CLASSES,
        classes: [mockClass(11), mockClass(12), mockClass(13), mockClass(14)],
      },
      spring: {
        season: SeasonEnum.SP,
        year: 2020,
        termId: 202030,
        status: StatusEnum.CLASSES,
        classes: [mockClass(15), mockClass(16), mockClass(17), mockClass(18)],
      },
      summer1: {
        season: SeasonEnum.S1,
        year: 2020,
        termId: 202040,
        status: StatusEnum.CLASSES,
        classes: [mockClass(19), mockClass(20)],
      },
      summer2: {
        season: SeasonEnum.S2,
        year: 2020,
        termId: 202060,
        status: StatusEnum.CLASSES,
        classes: [],
      },
    },
  },
};

export const mockKhouryClassesData = [
  {
    subject: "CS",
    course_id: "2500",
    semester: "201910",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "1800",
    semester: "201910",
    completion: "PASSED",
  },
  {
    subject: "ENGW",
    course_id: "1111",
    semester: "201910",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "1200",
    semester: "201910",
    completion: "PASSED",
  },
  {
    subject: "GAME",
    course_id: "2500",
    semester: "201910",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "2501",
    semester: "201910",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "1802",
    semester: "201910",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "2801",
    semester: "201930",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "2800",
    semester: "201930",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "2510",
    semester: "201930",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "2511",
    semester: "201930",
    completion: "PASSED",
  },
  {
    subject: "ARTF",
    course_id: "1122",
    semester: "201930",
    completion: "PASSED",
  },
  {
    subject: "PHIL",
    course_id: "1145",
    semester: "201930",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "3000",
    semester: "201940",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "3200",
    semester: "201940",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "3500",
    semester: "202010",
    completion: "PASSED",
  },
  {
    subject: "MATH",
    course_id: "2331",
    semester: "202010",
    completion: "PASSED",
  },
  {
    subject: "MATH",
    course_id: "3081",
    semester: "202010",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "3650",
    semester: "202010",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "3950",
    semester: "202010",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "4400",
    semester: "202030",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "1210",
    semester: "202030",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "3700",
    semester: "202030",
    completion: "PASSED",
  },
  {
    subject: "DS",
    course_id: "3000",
    semester: "202030",
    completion: "PASSED",
  },
  {
    subject: "ENGW",
    course_id: "3302",
    semester: "202030",
    completion: "PASSED",
  },
  {
    subject: "COOP",
    course_id: "3945",
    semester: "202060",
    completion: "PASSED",
  },
  {
    subject: "COOP",
    course_id: "3945",
    semester: "202110",
    completion: "PASSED",
  },
  {
    subject: "ARTG",
    course_id: "2251",
    semester: "202130",
    completion: "PASSED",
  },
  {
    subject: "ARTG",
    course_id: "2252",
    semester: "202130",
    completion: "PASSED",
  },
  {
    subject: "ARTG",
    course_id: "2250",
    semester: "202130",
    completion: "PASSED",
  },
  {
    subject: "CS",
    course_id: "4500",
    semester: "202130",
    completion: "PASSED",
  },
  {
    subject: "EECE",
    course_id: "2322",
    semester: "202130",
    completion: "PASSED",
  },
  {
    subject: "EECE",
    course_id: "2323",
    semester: "202130",
    completion: "PASSED",
  },
  {
    subject: "ARTF",
    course_id: "1123",
    semester: "202130",
    completion: "PASSED",
  },
  {
    subject: "MATH",
    course_id: "1341",
    semester: null,
    completion: "TRANSFER",
  },
  {
    subject: "MATH",
    course_id: "1342",
    semester: null,
    completion: "TRANSFER",
  },
  {
    subject: "CHEM",
    course_id: "1211",
    semester: null,
    completion: "TRANSFER",
  },
  {
    subject: "CHEM",
    course_id: "1212",
    semester: null,
    completion: "TRANSFER",
  },
  {
    subject: "CHEM",
    course_id: "1214",
    semester: null,
    completion: "TRANSFER",
  },
  {
    subject: "CHEM",
    course_id: "1215",
    semester: null,
    completion: "TRANSFER",
  },
  {
    subject: "PHYS",
    course_id: "1151",
    semester: null,
    completion: "TRANSFER",
  },
  {
    subject: "PHYS",
    course_id: "1152",
    semester: null,
    completion: "TRANSFER",
  },
  {
    subject: "PHYS",
    course_id: "1153",
    semester: null,
    completion: "TRANSFER",
  },
  {
    subject: "PSYC",
    course_id: "1101",
    semester: null,
    completion: "TRANSFER",
  },
  {
    subject: "HIST",
    course_id: "1130",
    semester: null,
    completion: "TRANSFER",
  },
];
