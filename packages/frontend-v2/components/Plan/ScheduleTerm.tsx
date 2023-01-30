import { GridItem, Heading, useDisclosure } from "@chakra-ui/react";
import {
  courseToString,
  ScheduleCourse2,
  ScheduleTerm2,
  SeasonEnum,
  TermError,
} from "@graduate/common";
import { DraggableScheduleCourse } from "../ScheduleCourse";
import { useDroppable } from "@dnd-kit/core";
import { getSeasonDisplayWord, isCourseInTerm } from "../../utils";
import { AddCourseModal } from "../AddCourseModal";
import { AddIcon } from "@chakra-ui/icons";
import { BlueButton } from "../Button";

interface ScheduleTermProps {
  scheduleTerm: ScheduleTerm2<string>;
  termCoReqErr?: TermError;
  termPreReqErr?: TermError;

  /** Function to add classes to a given term in the plan being displayed. */
  addClassesToTermInCurrPlan: (
    classes: ScheduleCourse2<null>[],
    termYear: number,
    termSeason: SeasonEnum
  ) => void;

  /** Function to remove a course from a given term in the plan being displayed. */
  removeCourseFromTermInCurrPlan: (
    course: ScheduleCourse2<unknown>,
    termYear: number,
    termSeason: SeasonEnum
  ) => void;

  isLastColumn?: boolean;
  setIsRemove?: (val: boolean) => void
}

export const ScheduleTerm: React.FC<ScheduleTermProps> = ({
  scheduleTerm,
  addClassesToTermInCurrPlan,
  removeCourseFromTermInCurrPlan,
  isLastColumn,
  setIsRemove,
  termCoReqErr = undefined,
  termPreReqErr = undefined,
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: scheduleTerm.id });
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isCourseInCurrTerm = (course: ScheduleCourse2<unknown>) => {
    return isCourseInTerm(course.classId, course.subject, scheduleTerm);
  };

  return (
    <GridItem
      ref={setNodeRef}
      borderRight={!isLastColumn ? "1px" : undefined}
      transition="background-color 0.1s ease"
      backgroundColor={isOver ? "neutral.300" : "neutral.main"}
      display="flex"
      flexDirection="column"
      px="sm"
      pt="2xs"
      pb="xl"
      userSelect="none"
    >
      <ScheduleTermHeader
        season={scheduleTerm.season}
        year={scheduleTerm.year}
      />
      {scheduleTerm.classes.map((scheduleCourse) => (
        <DraggableScheduleCourse
          coReqErr={termCoReqErr?.[courseToString(scheduleCourse)]}
          preReqErr={termPreReqErr?.[courseToString(scheduleCourse)]}
          scheduleCourse={scheduleCourse}
          removeCourse={(course: ScheduleCourse2<unknown>) =>
            removeCourseFromTermInCurrPlan(
              course,
              scheduleTerm.year,
              scheduleTerm.season
            )
          }
          isEditable
          key={scheduleCourse.id}
          setIsRemove={setIsRemove}
        />
      ))}
      <AddCourseButton onOpen={onOpen} />
      <AddCourseModal
        isOpen={isOpen}
        closeModalDisplay={onClose}
        isCourseInCurrTerm={isCourseInCurrTerm}
        addClassesToCurrTerm={(courses: ScheduleCourse2<null>[]) =>
          addClassesToTermInCurrPlan(
            courses,
            scheduleTerm.year,
            scheduleTerm.season
          )
        }
      />
    </GridItem>
  );
};

interface ScheduleTermHeaderProps {
  season: SeasonEnum;
  year: number;
}

const ScheduleTermHeader: React.FC<ScheduleTermHeaderProps> = ({
  season,
  year,
}) => {
  const seasonDisplayWord = getSeasonDisplayWord(season);
  return (
    <Heading size="sm" pb="sm">
      {seasonDisplayWord} {year}
    </Heading>
  );
};

interface AddCourseButtonProps {
  onOpen: () => void;
}

const AddCourseButton: React.FC<AddCourseButtonProps> = ({ onOpen }) => {
  return (
    <BlueButton
      leftIcon={<AddIcon w={2} h={2} color="primary.blue.light.main" />}
      onClick={onOpen}
      mt="md"
      size="sm"
    >
      Add Course
    </BlueButton>
  );
};
