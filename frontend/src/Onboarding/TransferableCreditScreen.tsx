import { Grid, Paper } from "@material-ui/core";
import React, { useState } from "react";
import { useDispatch, shallowEqual, useSelector } from "react-redux";
import { TransferableExam, TransferableExamGroup } from "../../../common/types";
import {
  addPlanIdAction,
  setExamCredits,
  setLinkSharingAction,
  setPlanNameAction,
} from "../state/actions/userActions";
import {
  MainTitleText,
  OnboardingSelectionTemplate,
  SelectableCourse,
  TitleText,
} from "./GenericOnboarding";
import { APExamGroups2020To2021 } from "../../../common/ap_exams";
import { IBExamGroups2020To2021 } from "../../../common/ib_exams";
import { ScheduleSlice } from "../models/types";
import { createPlanForUser } from "../services/PlanService";
import {
  getDeclaredMajorFromState,
  getPlanStrFromState,
  getScheduleDataFromState,
  getTokenFromState,
  getUserId,
} from "../state";
import { AppState } from "../state/reducers/state";
import { addNewSchedule } from "../state/actions/schedulesActions";

interface TransferableExamGroupComponentProps {
  readonly transferableExamGroup: TransferableExamGroup;
  readonly selectedTransferableExams: Array<TransferableExam>;
  readonly setSelectedTransferableExams: (
    transferableExams: TransferableExam[]
  ) => void;
}

interface TransferableExamComponentProps {
  readonly transferableExam: TransferableExam;
  readonly selectedTransferableExams: Array<TransferableExam>;
  readonly setSelectedTransferableExams: (
    transferableExams: TransferableExam[]
  ) => void;
}

interface TransferableExamGroupsComponentProps {
  readonly transferableExamGroups: TransferableExamGroup[];
  readonly selectedTransferableExams: Array<TransferableExam>;
  readonly keyPrefix: string;
  readonly setSelectedTransferableExams: (
    transferableExams: TransferableExam[]
  ) => void;
}

/**
 * Component for displaying a single transferable exam.
 */
const TransferableExamComponent: React.FC<
  TransferableExamComponentProps
> = props => {
  const addCourseToSelected = () => {
    const newSelectedTransferableExams: Array<TransferableExam> = [
      ...props.selectedTransferableExams,
      props.transferableExam,
    ];
    props.setSelectedTransferableExams(newSelectedTransferableExams);
  };

  const removeCourseFromSelected = () => {
    const newSelectedTransferableExams: Array<
      TransferableExam
    > = props.selectedTransferableExams.filter(
      (transferableExam: TransferableExam) =>
        transferableExam.name !== props.transferableExam.name
    );
    props.setSelectedTransferableExams(newSelectedTransferableExams);
  };

  const onChecked = (e: any): void => {
    const checked = e.target.checked;
    if (checked) {
      addCourseToSelected();
    } else {
      removeCourseFromSelected();
    }
  };

  return (
    <SelectableCourse
      key={`${props.transferableExam.type}-${props.transferableExam.name}`}
      onChange={onChecked}
      courseText={props.transferableExam.name}
    />
  );
};

/**
 * Component for displaying a group of transferable exams under a single subject.
 * For example, 2D and 3D Arts and Design are both exaums under the Arts group, so
 * this component would be used to display the entire group.
 */
const TransferableExamGroupComponent: React.FC<
  TransferableExamGroupComponentProps
> = props => {
  return (
    <div>
      <TitleText>{props.transferableExamGroup.name}</TitleText>
      {props.transferableExamGroup.transferableExams.map(
        (transferableExam: TransferableExam) => (
          <TransferableExamComponent
            transferableExam={transferableExam}
            selectedTransferableExams={props.selectedTransferableExams}
            setSelectedTransferableExams={props.setSelectedTransferableExams}
            key={`${transferableExam.type}-${transferableExam.name}`}
          />
        )
      )}
    </div>
  );
};

/**
 * Component for displaying a whole array of exam groups.
 * For example, AP exams has the groups Arts and Sciences, so
 * this component would be used to display each group.
 */
const TransferableExamGroupsComponent: React.FC<
  TransferableExamGroupsComponentProps
> = props => {
  return (
    <div>
      {props.transferableExamGroups.map(
        (transferableExamGroup: TransferableExamGroup) => (
          <TransferableExamGroupComponent
            transferableExamGroup={transferableExamGroup}
            selectedTransferableExams={props.selectedTransferableExams}
            setSelectedTransferableExams={props.setSelectedTransferableExams}
            key={`${props.keyPrefix}-${transferableExamGroup.name}`}
          />
        )
      )}
    </div>
  );
};

const TransferableCreditScreen: React.FC = () => {
  const {
    major,
    planStr,
    getCurrentScheduleData,
    userId,
    userToken,
  } = useSelector(
    (state: AppState) => ({
      major: getDeclaredMajorFromState(state),
      planStr: getPlanStrFromState(state),
      getCurrentScheduleData: () => getScheduleDataFromState(state),
      userId: getUserId(state),
      userToken: getTokenFromState(state),
    }),
    shallowEqual
  );

  const dispatch = useDispatch();
  const [selectedTransferableExams, setSelectedTransferableExams] = useState<
    Array<TransferableExam>
  >([]);

  const onSubmit = (): void => {
    dispatch(setExamCredits(selectedTransferableExams));

    const scheduleData: ScheduleSlice = getCurrentScheduleData();
    createPlanForUser(userId!, userToken!, {
      name: "Plan 1",
      link_sharing_enabled: false,
      schedule: scheduleData.schedule,
      major: major ? major.name : "",
      coop_cycle: planStr ? planStr : "None",
      course_counter: scheduleData.currentClassCounter,
      warnings: scheduleData.warnings,
      course_warnings: scheduleData.courseWarnings,
    }).then(plan => {
      dispatch(addNewSchedule(plan.plan.name, plan.plan as ScheduleSlice));
      dispatch(addPlanIdAction(plan.plan.id));
      dispatch(setPlanNameAction(plan.plan.name));
      dispatch(setLinkSharingAction(plan.plan.link_sharing_enabled));
    });
  };

  return (
    <OnboardingSelectionTemplate
      screen={3}
      mainTitleText={"Select any exams you took for AP or IB credit:"}
      onSubmit={onSubmit}
      to={"/home"}
    >
      <Grid container justify="space-evenly">
        <Grid key={0} item>
          <Paper
            elevation={0}
            style={{
              width: 350,
            }}
          >
            <MainTitleText>AP Exams</MainTitleText>
            <TransferableExamGroupsComponent
              transferableExamGroups={APExamGroups2020To2021}
              selectedTransferableExams={selectedTransferableExams}
              setSelectedTransferableExams={setSelectedTransferableExams}
              keyPrefix={"ap"}
            />
          </Paper>
        </Grid>
        <Grid key={1} item>
          <Paper
            elevation={0}
            style={{
              width: 350,
            }}
          >
            <MainTitleText>IB Exams</MainTitleText>
            <TransferableExamGroupsComponent
              transferableExamGroups={IBExamGroups2020To2021}
              selectedTransferableExams={selectedTransferableExams}
              setSelectedTransferableExams={setSelectedTransferableExams}
              keyPrefix={"ib"}
            />
          </Paper>
        </Grid>
      </Grid>
    </OnboardingSelectionTemplate>
  );
};

export default TransferableCreditScreen;
