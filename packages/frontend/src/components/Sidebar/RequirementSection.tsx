import React from "react";
import {
  courseToString,
  ICourseRange,
  IMajorRequirementGroup,
  IRequiredCourse,
  ISubjectRange,
  Requirement,
  ScheduleCourse,
} from "@graduate/common";
import { fetchCourse } from "../../api";
import {
  DNDScheduleCourse,
  IRequirementGroupWarning,
} from "../../models/types";
import styled from "styled-components";
import ExpandMoreOutlinedIcon from "@material-ui/icons/ExpandMoreOutlined";
import ExpandLessOutlinedIcon from "@material-ui/icons/ExpandLessOutlined";
import { SidebarAddClassModal } from "./SidebarAddClassModal";
import { convertToDNDCourses } from "../../utils/schedule-helpers";
import { Droppable } from "react-beautiful-dnd";
import { SidebarClassBlock } from "./SidebarClassBlock";
import { connect } from "react-redux";
import { AppState } from "../../state/reducers/state";
import { getCurrentClassCounterFromState } from "../../state";
import { incrementCurrentClassCounterForActivePlanAction } from "../../state/actions/userPlansActions";
import { Dispatch } from "redux";

const SectionHeaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 1px;
`;

const TitleText = styled.div`
  margin-left: 4px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
`;

const SubtitleWrapper = styled.div`
  margin-top: 4px;
`;

const SubtitleText = styled.div<any>`
  margin-left: ${(props) => 4 + props.level * 10 + "px"};
  font-weight: 600;
  font-size: 12px;
`;

const Separator = styled.div`
  height: 14px;
`;

const CompletedTitleText = styled.div`
  margin-left: 4px;
  margin-right: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  color: rgba(21, 116, 62, 0.68);
`;

const CourseText = styled.p`
  font-size: 14px;
  margin: 4px;
`;

const CourseAndLabWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

const ANDORText = styled.p`
  font-size: 14px;
  margin: 4px;
`;

interface RequirementSectionProps {
  title: string;
  contents: IMajorRequirementGroup;
  warning?: IRequirementGroupWarning;
  completedCourses: string[];
  isEditable: boolean;
}

interface ReduxStoreProps {
  currentClassCounter: number;
}

interface ReduxDispatchProps {
  incrementCurrentClassCounter: () => void;
}

type Props = RequirementSectionProps & ReduxStoreProps & ReduxDispatchProps;

interface RequirementSectionState {
  expanded: boolean;
  modalVisible: boolean;
  selectedCourses: IRequiredCourse[];
  classData: { [id: string]: DNDScheduleCourse };
  indexData: { [id: string]: number };
}

class RequirementSectionComponent extends React.Component<
  Props,
  RequirementSectionState
> {
  _isMounted: boolean;

  constructor(props: Props) {
    super(props);

    // TODO note that this is an antipattern introduced to solve
    // issues with setting state on an unmounted component, remove
    // and find a better solution.
    this._isMounted = false;

    this.state = {
      expanded: !!props.warning,
      modalVisible: false,
      selectedCourses: [
        {
          type: "COURSE",
          classId: 0,
          subject: "",
        },
      ],
      classData: {},
      indexData: {},
    };
  }

  /**
   * Shows this SidebarAddClassModal and passes the given courses to the modal.
   * @param courses the list of courses that triggered the showModal call
   */
  showModal(courses: IRequiredCourse[]) {
    this.setState({
      modalVisible: true,
      selectedCourses: courses,
    });
  }

  /**
   * Hides this SidebarAddClassModal.
   */
  hideModal() {
    this.setState({ modalVisible: false });
  }

  componentWillReceiveProps(nextProps: RequirementSectionProps) {
    this.setState({
      expanded: !!nextProps.warning,
    });
  }

  /**
   * Fetches class data for each requirement upon loading this component.
   */
  async componentDidMount() {
    this._isMounted = true;
    const data = await this.fetchClassData();
    if (data && this._isMounted) {
      this.setState(data);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * Fetches course data for each non range requirement in this RequirementSection.
   * Transforms each IRequiredCourse into its corresponding DNDScheduleCourse.
   * Stores each DNDScheduleCourse into this.state.classData
   */
  async fetchClassData() {
    const majorRequirementGroup: IMajorRequirementGroup = this.props.contents;

    if (majorRequirementGroup.type === "RANGE") {
      return;
    }

    const requirements: Requirement[] =
      majorRequirementGroup.requirements.filter(
        (requirement) => requirement.type !== "RANGE"
      );

    const promises: Promise<ScheduleCourse | null>[] = [];

    function addPromiseForRequirements(reqs: Requirement[]) {
      for (const r of reqs) {
        if (r.type === "COURSE") {
          promises.push(
            fetchCourse(r.subject.toUpperCase(), r.classId.toString())
          );
        }
        if (r.type === "AND" || r.type === "OR" || r.type === "CREDITS") {
          addPromiseForRequirements(r.courses);
        }
      }
    }

    // EFFECT: mutates promises
    addPromiseForRequirements(requirements);

    // resolve promises
    const scheduleCourses: (ScheduleCourse | null)[] = await Promise.all(
      promises
    );
    // filter out null scheduleCourses
    const filteredScheduleCourses: ScheduleCourse[] = scheduleCourses.filter(
      (scheduleCourse): scheduleCourse is ScheduleCourse =>
        scheduleCourse !== null
    );

    const dndCourses: DNDScheduleCourse[] = filteredScheduleCourses.map(
      (scheduleCourse: ScheduleCourse) => {
        const [newCourses] = convertToDNDCourses(
          [scheduleCourse!],
          this.props.currentClassCounter
        );
        return newCourses[0];
      }
    );

    const classData: { [id: string]: DNDScheduleCourse } = {};
    const indexData: { [id: string]: number } = {};

    for (let i = 0; i < dndCourses.length; i++) {
      const course: DNDScheduleCourse = dndCourses[i];
      classData[courseToString(course)] = course;
      indexData[courseToString(course)] = i;
    }

    return {
      classData,
      indexData,
    };
  }

  /**
   * Maps the given list of requirements to the render function.
   * @param reqs the list of requirements to be rendered
   */
  parseRequirements(reqs: Requirement[]) {
    return reqs.map((r: Requirement, index: number) => (
      <div key={index}>
        {this.renderRequirement(r, index, 0, reqs.length !== 1)}
      </div>
    ));
  }

  /**
   * Handles each Requirement type to render the given Requirement at the given index.
   * @param req the requirement to be rendered
   * @param index the designated index of this requirement
   * @param level the current indentation level of this requirement
   * @param top determines if this requirement is at top level
   */
  renderRequirement(
    req: Requirement,
    index: number,
    level: number,
    top: boolean
  ) {
    if (req.type === "COURSE") {
      return this.renderCourse(level, index, req as IRequiredCourse);
    }

    if (req.type === "RANGE") {
      return this.handleRange(req as ICourseRange);
    }

    if (
      req.type === "AND" &&
      req.courses.length === 2 &&
      req.courses.filter((c) => c.type === "COURSE").length === 2
    ) {
      return (
        <CourseAndLabWrapper key={index}>
          {this.renderCourse(
            level,
            index,
            req.courses[0] as IRequiredCourse,
            req.courses[1] as IRequiredCourse
          )}
        </CourseAndLabWrapper>
      );
    }

    return (
      <div key={index.toString()}>
        {this.convertTypeToText(req, level, top, index)}
        {req.courses
          .filter((c) => c.type === "COURSE")
          .map((c, index) =>
            this.renderCourse(level, index, c as IRequiredCourse)
          )}
        {req.courses
          .filter((c) => c.type === "AND")
          .map((c: Requirement, index: number) =>
            this.renderRequirement(c, index, level + 1, req.type !== "AND")
          )}
        {req.courses
          .filter(
            (c) => c.type === "OR" || c.type === "CREDITS" || c.type === "RANGE"
          )
          .map((c: Requirement, index: number) =>
            this.renderRequirement(c, index, level + 1, false)
          )}
      </div>
    );
  }

  /**
   * Renders a given ICourseRange as a sidebar requirement
   * @param req the given course range to be rendered
   */
  handleRange(req: ICourseRange) {
    return (
      <div>
        <ANDORText style={{ marginBottom: 8 }}>
          Complete {req.creditsRequired} credits from the following ranges that
          are not already required:
        </ANDORText>
        {req.ranges.map((r: ISubjectRange) => {
          return (
            <CourseText key={r.subject + r.idRangeStart + " - " + r.idRangeEnd}>
              {r.subject + r.idRangeStart + " through " + r.idRangeEnd}
            </CourseText>
          );
        })}
      </div>
    );
  }

  /**
   * Renders the given course as a draggable SidebarClassBlock.
   * @param level the current indentation level for this course block
   * @param index the index of this course within its Requirement, used for its key
   * @param course the given IRequiredCourse
   * @param andCourse? only received by this function if the given course is an and course
   */
  renderCourse(
    level: number,
    index: number,
    course: IRequiredCourse,
    andCourse?: IRequiredCourse
  ) {
    const courseString = courseToString(course);
    const convertedCourse: DNDScheduleCourse =
      this.state.classData[courseString];

    if (andCourse) {
      const andCourseString = courseToString(andCourse);
      const convertedLab: DNDScheduleCourse =
        this.state.classData[andCourseString];

      if (convertedCourse == null) {
        return null;
      } else {
        return (
          <SidebarClassBlock
            key={`${courseString}${andCourseString}${index}`}
            class={convertedCourse}
            lab={convertedLab}
            index={this.state.indexData[courseString]}
            completed={
              this.props.completedCourses.includes(courseString) &&
              this.props.completedCourses.includes(andCourseString)
            }
            currentClassCounter={this.props.currentClassCounter}
            level={level}
            isEditable={this.props.isEditable}
          />
        );
      }
    } else {
      if (convertedCourse == null) {
        return null;
      } else {
        return (
          <SidebarClassBlock
            key={courseString}
            class={convertedCourse}
            index={this.state.indexData[courseString]}
            completed={this.props.completedCourses.includes(courseString)}
            currentClassCounter={this.props.currentClassCounter}
            level={level}
            isEditable={this.props.isEditable}
          />
        );
      }
    }
  }

  /**
   * Translates type to desired display text in sidebar.
   * @param type the given Requirement type
   * @param level the current indentation level for this display text
   * @param top determines if this display text is at top level
   */
  convertTypeToText(
    req: Requirement,
    level: number,
    top: boolean,
    index: number
  ) {
    if (req.type === "OR") {
      return (
        <SubtitleWrapper>
          {top && <Separator />}
          <SubtitleText level={top ? level + 1 : level}>
            Complete one of the following:
          </SubtitleText>
        </SubtitleWrapper>
      );
    }
    if (req.type === "CREDITS") {
      return (
        <SubtitleWrapper>
          {top && <Separator />}
          <SubtitleText level={top ? level + 1 : level}>
            Complete {req.minCredits} to {req.maxCredits} credits from the
            following courses:
          </SubtitleText>
        </SubtitleWrapper>
      );
    }
    if (req.type === "AND") {
      if (index !== 0 && top) {
        return <Separator />;
      }
      return "";
    }

    return req.type;
  }

  /**
   * Updates the state to show more of this requirement section.
   */
  expandSection() {
    this.setState({
      expanded: !this.state.expanded,
    });
  }

  render() {
    const { title, contents, warning } = this.props;
    const { modalVisible } = this.state;

    return (
      <div>
        {!!title && (
          <SectionHeaderWrapper onClick={this.expandSection.bind(this)}>
            <TitleWrapper>
              {!!warning ? (
                <TitleText>{title}</TitleText>
              ) : (
                <CompletedTitleText>{title}</CompletedTitleText>
              )}
            </TitleWrapper>

            {this.state.expanded ? (
              <ExpandLessOutlinedIcon
                htmlColor={warning ? "#666666" : "rgba(21, 116, 62, 0.68)"}
              />
            ) : (
              <ExpandMoreOutlinedIcon
                htmlColor={warning ? "#666666" : "rgba(21, 116, 62, 0.68)"}
              />
            )}
          </SectionHeaderWrapper>
        )}
        {this.state.expanded && !!contents && contents.type === "OR" && (
          <SubtitleWrapper>
            <SubtitleText level={0}>
              Complete one of the following:
            </SubtitleText>
          </SubtitleWrapper>
        )}
        {this.state.expanded && this.props.isEditable && (
          <Droppable isDropDisabled={true} droppableId={this.props.title}>
            {(provided) => (
              <div ref={provided.innerRef as any} {...provided.droppableProps}>
                {!!contents &&
                  contents.type !== "RANGE" &&
                  this.parseRequirements(contents.requirements)}
                {!!contents &&
                  contents.type === "RANGE" &&
                  this.handleRange(contents.requirements)}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
        {this.state.expanded && !this.props.isEditable && (
          <div>
            {!!contents &&
              contents.type !== "RANGE" &&
              this.parseRequirements(contents.requirements)}
            {!!contents &&
              contents.type === "RANGE" &&
              this.handleRange(contents.requirements)}
          </div>
        )}

        <SidebarAddClassModal
          visible={modalVisible}
          handleClose={this.hideModal.bind(this)}
          handleSubmit={this.hideModal.bind(this)}
          selectedCourses={this.state.selectedCourses}
        ></SidebarAddClassModal>
      </div>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  currentClassCounter: getCurrentClassCounterFromState(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  incrementCurrentClassCounter: () =>
    dispatch(incrementCurrentClassCounterForActivePlanAction()),
});

export const RequirementSection = connect<
  ReduxStoreProps,
  ReduxDispatchProps,
  RequirementSectionProps,
  AppState
>(
  mapStateToProps,
  mapDispatchToProps
)(RequirementSectionComponent);
