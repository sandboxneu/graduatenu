import React from "react";
import {
  IMajorRequirementGroup,
  Requirement,
  IRequiredCourse,
  ICourseRange,
  ISubjectRange,
  IRequirementGroupWarning,
  DNDScheduleCourse,
  ScheduleCourse,
} from "../../models/types";
import styled from "styled-components";
import CheckIcon from "@material-ui/icons/Check";
import ClearIcon from "@material-ui/icons/Clear";
import { styled as materialStyled } from "@material-ui/styles";
import ExpandMoreOutlinedIcon from "@material-ui/icons/ExpandMoreOutlined";
import ExpandLessOutlinedIcon from "@material-ui/icons/ExpandLessOutlined";
import { SidebarAddButton } from "./SidebarAddButton";
import { SidebarAddClassModal } from "./SidebarAddClassModal";
import { ClassBlock } from "../ClassBlocks/ClassBlock";
import { convertToDNDCourses } from "../../utils/schedule-helpers";
import { fetchCourse } from "../../api";
import { Droppable } from "react-beautiful-dnd";
import { ClassList } from "../ClassList";

const SectionHeaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
  margin-bottom: 5px;
`;

const TitleText = styled.div`
  margin-left: 4px;
  margin-right: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
`;

const CourseWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const CourseText = styled.p`
  font-size: 14px;
  margin: 4px;
`;

const CourseTextNoMargin = styled.p`
  font-size: 14px;
  margin: 0px;
  margin-top: 4px;
  margin-bottom: 4px;
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

const MyCheckIcon = materialStyled(CheckIcon)({
  color: "green",
});

interface RequirementSectionProps {
  title: string;
  contents: IMajorRequirementGroup;
  warning?: IRequirementGroupWarning;
}

interface RequirementSectionState {
  expanded: boolean;
  modalVisible: boolean;
  selectedCourses: IRequiredCourse[];
  classData: { [id: string]: DNDScheduleCourse };
}

export class RequirementSection extends React.Component<
  RequirementSectionProps,
  RequirementSectionState
> {
  constructor(props: RequirementSectionProps) {
    super(props);

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
    await this.fetchClassData();
  }

  /**
   * Fetches course data for each non range requirement in this RequirementSection.
   * Transforms each IRequiredCourse into its corresponding DNDScheduleCourse.
   * Stores each DNDScheduleCourse into this.state.classData
   */
  async fetchClassData() {
    if (this.props.contents.type === "RANGE") {
      return;
    }

    let requirements: Requirement[] = this.props.contents.requirements.filter(
      requirement => requirement.type !== "RANGE"
    );
    let promises: Promise<ScheduleCourse | null>[] = [];

    function addPromiseForRequirements(reqs: Requirement[]) {
      for (const r of reqs) {
        if (r.type === "COURSE") {
          promises.push(
            fetchCourse(r.subject.toUpperCase(), r.classId.toString())
          );
        }
        if (r.type === "AND" || r.type === "OR") {
          addPromiseForRequirements(r.courses);
        }
      }
    }

    // EFFECT: mutates promises
    addPromiseForRequirements(requirements);

    // resolve promises
    let scheduleCourses: (ScheduleCourse | null)[] = await Promise.all(
      promises
    );
    // filter out null scheduleCourses
    let filteredScheduleCourses: ScheduleCourse[] = scheduleCourses.filter(
      (scheduleCourse): scheduleCourse is ScheduleCourse =>
        scheduleCourse !== null
    );

    let dndCourses: DNDScheduleCourse[] = filteredScheduleCourses.map(
      (scheduleCourse: ScheduleCourse) => {
        return convertToDNDCourses([scheduleCourse!], 0)[0][0];
      }
    );

    let classData: { [id: string]: DNDScheduleCourse } = {};

    for (const course of dndCourses) {
      classData[course.subject + course.classId] = course;
    }

    this.setState({
      classData,
    });
  }

  /**
   * Maps the given list of requirements to the render function.
   * @param reqs the list of requirements to be rendered
   */
  parseRequirements(reqs: Requirement[]) {
    return reqs.map((r: Requirement, index: number) => (
      <div key={index}>{this.renderRequirement(r, index)}</div>
    ));
  }

  /**
   * Handles each Requirement type to render the given Requirement at the given index.
   * @param req the requirement to be rendered
   * @param index the designated index of this requirement
   */
  renderRequirement(req: Requirement, index: number) {
    if (req.type === "COURSE") {
      return this.renderCourse(req as IRequiredCourse);
    }

    if (req.type === "RANGE") {
      return this.handleRange(req as ICourseRange);
    }

    if (
      req.type === "AND" &&
      req.courses.length === 2 &&
      req.courses.filter(c => c.type === "COURSE").length === 2
    ) {
      return (
        <CourseAndLabWrapper key={index}>
          {this.renderCourse(req.courses[0] as IRequiredCourse, true, true, req
            .courses[1] as IRequiredCourse)}
          <CourseText> and </CourseText>
          {this.renderCourse(req.courses[1] as IRequiredCourse, true, false)}
        </CourseAndLabWrapper>
      );
    }

    return (
      <div key={index.toString()}>
        <ANDORText>{this.convertTypeToText(req.type)}</ANDORText>
        {req.courses
          .filter(c => c.type === "COURSE")
          .map(c => this.renderCourse(c as IRequiredCourse))}
        {req.courses
          .filter(c => c.type === "AND")
          .map((c: Requirement, index: number) =>
            this.renderRequirement(c, index)
          )}
        {req.courses
          .filter(c => c.type === "OR")
          .map((c: Requirement, index: number) =>
            this.renderRequirement(c, index)
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
          Complete {req.creditsRequired} credits from the following courses that
          are not already required:
        </ANDORText>
        {req.ranges.map((r: ISubjectRange, index: number) => {
          return (
            <CourseText key={r.subject + r.idRangeStart + " - " + r.idRangeEnd}>
              {r.subject + r.idRangeStart + " through " + r.idRangeEnd}
            </CourseText>
          );
        })}
      </div>
    );
  }

  async getDNDCourse(
    course: IRequiredCourse
  ): Promise<DNDScheduleCourse | null> {
    let convertedCourse: DNDScheduleCourse;

    let scheduleCourse: ScheduleCourse | null = await fetchCourse(
      course.subject.toUpperCase(),
      course.classId.toString()
    );

    if (scheduleCourse == null) {
      return null;
    } else {
      convertedCourse = convertToDNDCourses([scheduleCourse!], 0)[0][0];
      return convertedCourse;
    }
    // .then(response => {
    //   convertedCourse = convertToDNDCourses([response!], 0)[0][0];
    // });
  }

  /**
   * Renders the given course as a sidebar course.
   * @param course the given IRequiredCourse
   * @param noMargin determines if this sidebar course should have a margin or not
   * @param addButton determines if this sidebar course should have a SidebarAddButton
   * @param andCourse true if the given course is an and course
   */
  renderCourse(
    course: IRequiredCourse,
    noMargin: boolean = false,
    addButton: boolean = true,
    andCourse?: IRequiredCourse
  ) {
    const convertedCourse: DNDScheduleCourse = this.state.classData[
      course.subject + course.classId
    ];

    if (convertedCourse == null) {
      return null;
    } else {
      return (
        <ClassBlock
          class={convertedCourse}
          index={0}
          onDelete={() => {
            console.log("oops");
          }}
        ></ClassBlock>
      );
    }

    // return (
    //   <CourseWrapper key={course.subject + course.classId + course.type}>
    //     {addButton && andCourse && (
    //       <SidebarAddButton
    //         onClick={() => this.showModal([course, andCourse])}
    //       />
    //     )}
    //     {addButton && !andCourse && (
    //       <SidebarAddButton onClick={() => this.showModal([course])} />
    //     )}
    //     {noMargin ? (
    //       <CourseTextNoMargin>
    //         {course.subject + course.classId}
    //       </CourseTextNoMargin>
    //     ) : (
    //       <CourseText>{course.subject + course.classId}</CourseText>
    //     )}
    //   </CourseWrapper>
    // );
  }

  /**
   * Translates type to desired display text in sidebar.
   * @param type the given Requirement type
   */
  convertTypeToText(type: string) {
    if (type === "OR") {
      return "Complete one of the following:";
    }

    return type;
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
              {/* {!!warning ? (
                <ClearIcon color="error" fontSize="small"></ClearIcon>
              ) : (
                <MyCheckIcon fontSize="small"></MyCheckIcon>
              )} */}
              <TitleText>{title}</TitleText>
            </TitleWrapper>
            {/* {this.state.expanded ? (
              <ExpandLessOutlinedIcon />
            ) : (
              <ExpandMoreOutlinedIcon />
            )} */}
          </SectionHeaderWrapper>
        )}
        {this.state.expanded && (
          <Droppable droppableId={this.props.title}>
            {provided => (
              <ClassList
                innerRef={provided.innerRef as any}
                {...provided.droppableProps}
              >
                <div>
                  {!!contents &&
                    contents.type !== "RANGE" &&
                    this.parseRequirements(contents.requirements)}
                  {!!contents &&
                    contents.type === "RANGE" &&
                    this.handleRange(contents.requirements)}
                </div>
                {provided.placeholder}
              </ClassList>
            )}
          </Droppable>
          // <div>
          //   {!!contents &&
          //     contents.type !== "RANGE" &&
          //     this.parseRequirements(contents.requirements)}
          //   {!!contents &&
          //     contents.type === "RANGE" &&
          //     this.handleRange(contents.requirements)}
          // </div>
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
