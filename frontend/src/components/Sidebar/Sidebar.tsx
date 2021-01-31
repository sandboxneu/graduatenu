import React from "react";
import { DNDSchedule } from "../../models/types";
import {
  IMajorRequirementGroup,
  Major,
  ScheduleCourse,
} from "../../../../common/types";
import styled from "styled-components";
import { RequirementSection } from ".";
import {
  produceRequirementGroupWarning,
  getCompletedCourseStrings,
} from "../../utils";
import { AppState } from "../../state/reducers/state";
import {
  safelyGetActivePlanCatalogYearFromState,
  getActivePlanMajorFromState,
  getActivePlanScheduleFromState,
  safelyGetTransferCoursesFromState,
} from "../../state";
import { connect, useSelector } from "react-redux";
import { findMajorFromName } from "../../utils/plan-helpers";
import { ScrollWrapper } from "../../Onboarding/GenericOnboarding";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background: #f2f2f2;
  padding: 0px 12px 12px 10px;
`;

const MajorTitle = styled.p`
  font-size: 20px;
  font-weight: 600;
  line-height: 24px;
  margin-right: 12px;
  margin-left: 4px;
  margin-bottom: 12px;
`;

interface SidebarProps {
  isEditable: boolean;
}

interface MajorSidebarProps {
  schedule: DNDSchedule;
  major: Major;
  transferCourses: ScheduleCourse[];
  isEditable: boolean;
}

const NoMajorSidebarComponent: React.FC = () => {
  return (
    <Container>
      <MajorTitle>No major selected</MajorTitle>
    </Container>
  );
};

const MajorSidebarComponent: React.FC<MajorSidebarProps> = ({
  schedule,
  major,
  transferCourses,
  isEditable,
}) => {
  const warnings = produceRequirementGroupWarning(schedule, major);
  const completedCourses: string[] = getCompletedCourseStrings(schedule);
  const completedCourseStrings: string[] = transferCourses
    ? completedCourses.concat(
        ...transferCourses.map(course => course.subject + course.classId)
      )
    : completedCourses;

  const reqGroupSortOrder = ["AND", "OR", "RANGE"];

  const sortOnValues = (
    groupMap: Record<string, IMajorRequirementGroup>
  ): Record<string, IMajorRequirementGroup> => {
    // Create items array of arrays
    var items = Object.keys(groupMap).map((key): [
      string,
      IMajorRequirementGroup
    ] => {
      return [key, groupMap[key]];
    });

    // Sort the array based on the second element (value in the item pair)
    items = items.sort(
      (
        first: [string, IMajorRequirementGroup],
        second: [string, IMajorRequirementGroup]
      ): number => {
        const diff =
          reqGroupSortOrder.indexOf(first[1].type) -
          reqGroupSortOrder.indexOf(second[1].type);
        if (diff < 0) {
          return -1;
        }
        if (diff > 0) {
          return 1;
        } else {
          return 0;
        }
      }
    );
    // turn into dictionary
    const dictionary: Record<string, IMajorRequirementGroup> = {};
    items.map((pair: [string, IMajorRequirementGroup]) => {
      dictionary[pair[0]] = pair[1];
    });
    return dictionary;
  };

  const sortedGroups = sortOnValues(major.requirementGroupMap);
  console.log("Sorted", sortedGroups);
  return (
    <Container>
      <ScrollWrapper>
        <MajorTitle>{major.name}</MajorTitle>
        {Object.keys(sortedGroups).map((req, index) => {
          return (
            <RequirementSection
              title={!!req ? req : "Additional Requirements"}
              // TODO: this is a temporary solution for major scraper bug
              contents={sortedGroups[req]}
              warning={warnings.find(w => w.requirementGroup === req)} // validation here :D
              key={index + major.name}
              completedCourses={completedCourseStrings}
              isEditable={isEditable}
            />
          );
        })}
      </ScrollWrapper>
    </Container>
  );
};

export const Sidebar: React.FC<SidebarProps> = props => {
  const { schedule, major, transferCourses } = useSelector(
    (state: AppState) => ({
      major: getActivePlanMajorFromState(state),
      schedule: getActivePlanScheduleFromState(state),
      transferCourses: safelyGetTransferCoursesFromState(state),
    })
  );

  const { majorObj } = useSelector((state: AppState) => {
    return {
      majorObj: findMajorFromName(
        major,
        state.majorState.majors,
        safelyGetActivePlanCatalogYearFromState(state)
      ),
    };
  });

  return (
    <ScrollWrapper>
      {majorObj ? (
        <MajorSidebarComponent
          schedule={schedule}
          major={majorObj}
          transferCourses={transferCourses}
          isEditable={props.isEditable}
        />
      ) : (
        <NoMajorSidebarComponent />
      )}
    </ScrollWrapper>
  );
};
