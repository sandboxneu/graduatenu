import React from "react";
import { withRouter, RouteComponentProps, Link } from "react-router-dom";
import { Backdrop, TextField, Tooltip } from "@material-ui/core";
import { GenericOnboardingTemplate } from "./GenericOnboarding";
import { NextButton } from "../components/common/NextButton";
import { connect } from "react-redux";
import styled from "styled-components";
import { Dispatch } from "redux";
import { Major, Schedule, ScheduleCourse } from "../../../common/types";
import {
  generateInitialSchedule,
  generateInitialScheduleNoCoopCycle,
  planToString,
} from "../utils";
import {
  setStudentAcademicYearAction,
  setStudentGraduationYearAction,
  setStudentCoopCycleAction,
  setStudentMajorAction,
  setStudentCatalogYearAction,
  setStudentConcentrationAction,
} from "../state/actions/studentActions";
import Loader from "react-loader-spinner";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@material-ui/core";
import {
  getMajorsFromState,
  getPlansFromState,
  getMajorsLoadingFlagFromState,
  getPlansLoadingFlagFromState,
  getUserMajorNameFromState,
  getUserIdFromState,
  getCompletedCoursesFromState,
} from "../state";
import { AppState } from "../state/reducers/state";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { findMajorFromName } from "../utils/plan-helpers";
import { SaveInParentConcentrationDropdown } from "../components/ConcentrationDropdown";
import { getAuthToken } from "../utils/auth-helpers";
import { updateUser } from "../services/UserService";
import { createPlanForUser, setPrimaryPlan } from "../services/PlanService";
import { addNewPlanAction } from "../state/actions/userPlansActions";
import { IPlanData, ITemplatePlan } from "../models/types";
import { DisclaimerPopup } from "../components/common/DisclaimerPopup";
import { BASE_FORMATTED_COOP_CYCLES } from "../plans/coopCycles";

const SpinnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 700px;
`;

interface OnboardingReduxStoreProps {
  major: string | null;
  majors: Major[];
  plans: Record<string, Schedule[]>;
  isFetchingMajors: boolean;
  isFetchingPlans: boolean;
  userId: number;
  completedCourses: ScheduleCourse[];
}

interface OnboardingReduxDispatchProps {
  setAcademicYear: (academicYear: number) => void;
  setGraduationYear: (graduationYear: number) => void;
  setCatalogYear: (catalogYear: number | null) => void;
  setMajor: (major: string | null) => void;
  setConcentration: (concentration: string | null) => void;
  setCoopCycle: (coopCycle: string | null) => void;
  addNewPlanAction: (
    plan: IPlanData | ITemplatePlan,
    academicYear?: number
  ) => void;
}

type OnboardingScreenProps = OnboardingReduxStoreProps &
  OnboardingReduxDispatchProps;

interface OnboardingScreenState {
  year?: number;
  beenEditedYear: boolean;
  gradYear?: number;
  beenEditedGrad: boolean;
  major?: string;
  concentration?: string;
  coopCycle?: string;
  catalogYear?: number;
  hasNoConcentrationSelectedError: boolean;
  showErrors: boolean;
  open: boolean;
}

const marginSpace = 12;

type Props = OnboardingScreenProps & RouteComponentProps;

class OnboardingScreenComponent extends React.Component<
  Props,
  OnboardingScreenState
> {
  constructor(props: Props) {
    super(props);

    this.state = {
      year: undefined,
      gradYear: undefined,
      catalogYear: undefined,
      beenEditedYear: false,
      beenEditedGrad: false,
      hasNoConcentrationSelectedError: false,
      showErrors: false,
      major: props.major || undefined,
      concentration: undefined,
      coopCycle: undefined,
      open: true,
    };
  }

  hasMajorAndNoCatalogYearError() {
    return !this.state.catalogYear && !!this.state.major;
  }

  /**
   * All of the different functions that modify the properies of the screen as they are
   * changed
   */
  onChangeYear(e: any) {
    this.setState({
      year: Number(e.target.value),
      beenEditedYear: true,
      showErrors: false,
    });
  }

  onChangeGradYear(e: any) {
    this.setState({
      gradYear: Number(e.target.value),
      beenEditedGrad: true,
      showErrors: false,
    });
  }

  onChangeCatalogYear(event: React.SyntheticEvent<{}>, value: any) {
    const newCatalogYear = Number(value);

    // if this.state.major exists, and the major exists with the selected catalog year, don't erase the major from the form
    const newMajor =
      this.state.major &&
      !!findMajorFromName(this.state.major, this.props.majors, newCatalogYear)
        ? this.state.major
        : undefined;

    this.setState({
      major: newMajor,
      concentration: undefined,
      coopCycle: undefined,
      catalogYear: newCatalogYear,
      showErrors: false,
    });
  }

  onChangeMajor(event: React.SyntheticEvent<{}>, value: any) {
    this.setState({
      major: value || undefined,
      coopCycle: undefined,
      concentration: undefined,
      showErrors: false,
    });
  }

  onChangeConcentration(value: any) {
    this.setState({
      concentration: value,
      showErrors: false,
    });
  }

  onChangePlan(event: React.SyntheticEvent<{}>, value: any) {
    this.setState({ coopCycle: value || undefined, showErrors: false });
  }

  /**
   * This function handles setting all of the properties once the next button has been pressed,
   * assuming all of the required fields have been filled out
   */
  onSubmit() {
    this.props.setAcademicYear(this.state.year!);
    this.props.setGraduationYear(this.state.gradYear!);
    this.props.setCatalogYear(this.state.catalogYear || null);
    this.props.setMajor(this.state.major || null);
    this.props.setConcentration(this.state.concentration || null);
    this.props.setCoopCycle(this.state.coopCycle || null);

    this.updateUserAndCreatePlan();
  }

  updateUserAndCreatePlan() {
    const token = getAuthToken();
    const updateUserPromise = () =>
      updateUser(
        {
          id: this.props.userId!,
          token: token,
        },
        {
          major: this.state.major || null,
          academic_year: this.state.year!,
          graduation_year: this.state.gradYear!,
          coop_cycle: this.state.coopCycle || null,
          concentration: this.state.concentration || null,
          catalog_year: this.state.catalogYear || null,
        }
      );

    const createPlanPromise = () => {
      let schedule, courseCounter;
      if (!!this.state.coopCycle) {
        [schedule, courseCounter] = generateInitialSchedule(
          this.state.year!,
          this.state.gradYear!,
          this.props.completedCourses,
          this.state.major!,
          this.state.coopCycle!,
          this.props.plans
        );
      } else {
        [schedule, courseCounter] = generateInitialScheduleNoCoopCycle(
          this.state.year!,
          this.state.gradYear!,
          this.props.completedCourses
        );
      }

      createPlanForUser(this.props.userId!, {
        name: "Plan 1",
        link_sharing_enabled: false,
        schedule: schedule,
        major: this.state.major || null,
        coop_cycle: this.state.coopCycle || null,
        concentration: this.state.concentration || null,
        course_counter: courseCounter,
        catalog_year: this.state.catalogYear || null,
      }).then(response => {
        this.props.addNewPlanAction(response.plan, this.state.year!);
        setPrimaryPlan(this.props.userId, response.plan.id);
      });
    };

    return Promise.all([updateUserPromise(), createPlanPromise()]);
  }

  /**
   * Renders the major drop down
   */
  renderMajorDropDown() {
    let majorNames = this.props.majors.filter(
      major => major.yearVersion === this.state.catalogYear
    ); //takes in a major object return t if you want to keep it (only when catalog)
    return (
      <Autocomplete
        style={{ width: 326, marginBottom: marginSpace }}
        disableListWrap
        options={majorNames.map(maj => maj.name)} //need to filter for only current catalog year
        renderInput={params => (
          <TextField
            {...params}
            variant="outlined"
            label="Select A Major"
            fullWidth
          />
        )}
        value={!!this.state.major ? this.state.major + " " : ""}
        onChange={this.onChangeMajor.bind(this)}
      />
    );
  }

  /**
   * Renders the academic year select component
   */
  renderAcademicYearSelect() {
    const error =
      this.state.showErrors && !this.state.year && this.state.beenEditedYear;

    return (
      <FormControl
        variant="outlined"
        error={error}
        style={{ marginBottom: marginSpace, minWidth: 326 }}
      >
        <InputLabel
          id="demo-simple-select-outlined-label"
          style={{ marginBottom: marginSpace }}
        >
          Academic Year
        </InputLabel>
        <Select
          labelId="demo-simple-select-outlined-label"
          id="demo-simple-select-outlined"
          value={this.state.year}
          onChange={this.onChangeYear.bind(this)}
          labelWidth={110}
        >
          <MenuItem value={1}>1st Year</MenuItem>
          <MenuItem value={2}>2nd Year</MenuItem>
          <MenuItem value={3}>3rd Year</MenuItem>
          <MenuItem value={4}>4th Year</MenuItem>
          <MenuItem value={5}>5th Year</MenuItem>
        </Select>
        <FormHelperText>
          {error && "Please select a valid year\n"}
        </FormHelperText>
      </FormControl>
    );
  }

  /**
   * Renders the grad year select component
   */
  renderGradYearSelect() {
    const error =
      this.state.showErrors &&
      !this.state.gradYear &&
      this.state.beenEditedGrad;

    return (
      <FormControl
        variant="outlined"
        error={error}
        style={{ marginBottom: marginSpace, minWidth: 326 }}
      >
        <InputLabel
          id="demo-simple-select-outlined-label"
          style={{ marginBottom: marginSpace }}
        >
          Graduation Year
        </InputLabel>
        <Select
          labelId="demo-simple-select-outlined-label"
          id="demo-simple-select-outlined"
          value={this.state.gradYear}
          onChange={this.onChangeGradYear.bind(this)}
          labelWidth={115}
        >
          <MenuItem value={2019}>2019</MenuItem>
          <MenuItem value={2020}>2020</MenuItem>
          <MenuItem value={2021}>2021</MenuItem>
          <MenuItem value={2022}>2022</MenuItem>
          <MenuItem value={2023}>2023</MenuItem>
          <MenuItem value={2024}>2024</MenuItem>
          <MenuItem value={2025}>2025</MenuItem>
        </Select>
        <FormHelperText>{error && "Please select a valid year"}</FormHelperText>
      </FormControl>
    );
  }

  /**
   * Renders the coop cycle drop down
   */
  renderCoopCycleDropDown() {
    return (
      <Autocomplete
        style={{ width: 326, marginBottom: marginSpace }}
        disableListWrap
        options={BASE_FORMATTED_COOP_CYCLES}
        renderInput={params => (
          <TextField
            {...params}
            variant="outlined"
            label="Select A Co-op Cycle"
            fullWidth
          />
        )}
        value={this.state.coopCycle || ""}
        onChange={this.onChangePlan.bind(this)}
      />
    );
  }

  /**
   * Renders the catalog drop down
   */
  renderCatalogYearDropDown() {
    //need to make chanegs to options to filter out repeat catalog years
    let majorSet = [
      ...Array.from(
        new Set(this.props.majors.map(maj => maj.yearVersion.toString()))
      ),
    ];

    const error: boolean =
      this.state.showErrors && this.hasMajorAndNoCatalogYearError();

    // show error if there is a major (given from khoury) and no catalog year is selected
    return (
      <FormControl
        variant="outlined"
        error={error}
        style={{ marginBottom: marginSpace, minWidth: 326 }}
      >
        <Tooltip
          title="Catalog Year refers to the year your major credits are associated to. This is usually the year you declared your Major."
          placement="top"
        >
          <Autocomplete
            disableListWrap
            options={majorSet}
            renderInput={params => (
              <TextField
                {...params}
                variant="outlined"
                label="Select a Catalog Year"
                fullWidth
                error={error}
              />
            )}
            value={!!this.state.catalogYear ? this.state.catalogYear + " " : ""}
            onChange={this.onChangeCatalogYear.bind(this)}
          />
        </Tooltip>
        <FormHelperText>
          {error && "Because you have a major, a catalog year is required"}
        </FormHelperText>
      </FormControl>
    );
  }

  renderConcentrationDropdown() {
    const major: Major | undefined = findMajorFromName(
      this.state.major,
      this.props.majors,
      this.state.catalogYear
    );

    const setError = (error: boolean) => {
      this.setState({ hasNoConcentrationSelectedError: error });
    };

    return (
      <SaveInParentConcentrationDropdown
        major={major}
        concentration={this.state.concentration || null}
        setConcentration={this.onChangeConcentration.bind(this)}
        style={{ width: 326, marginBottom: marginSpace }}
        useLabel={true}
        showError={this.state.showErrors}
        setError={setError}
      />
    );
  }
  handleClose() {
    this.setState({ open: false });
  }
  render() {
    const { gradYear, year, major, catalogYear } = this.state;
    const { isFetchingMajors, isFetchingPlans } = this.props;

    if (isFetchingMajors || isFetchingPlans) {
      //render a spinnner if the majors/plans are still being fetched.
      return (
        <SpinnerWrapper>
          <Loader
            type="Puff"
            color="#f50057"
            height={100}
            width={100}
            timeout={5000} //5 secs
          />
        </SpinnerWrapper>
      );
    } else {
      const allRequirementsFilled: boolean =
        !!year && !!gradYear && (!major || !!catalogYear);

      const majorSelectedAndNoConcentration =
        !!this.state.major && this.state.hasNoConcentrationSelectedError;

      const allFilledAndNoErrors =
        allRequirementsFilled &&
        !this.hasMajorAndNoCatalogYearError() &&
        !majorSelectedAndNoConcentration;

      const onClick = () => {
        if (this.hasMajorAndNoCatalogYearError()) {
          this.setState({
            beenEditedYear: true,
            beenEditedGrad: true,
            showErrors: true,
          });
        } else if (allFilledAndNoErrors) {
          this.onSubmit();
        } else {
          this.setState({
            showErrors: true,
          });
        }
      };

      // renders all of the different drop downs and for the next button, ensures that all
      // required fields are filled out before allowing it to move to the next screen
      return (
        <GenericOnboardingTemplate screen={0}>
          {this.renderAcademicYearSelect()}
          {this.renderGradYearSelect()}
          {this.renderCatalogYearDropDown()}
          {/* if there is a major given from khoury we want to show the major dropdown */}
          {(!!catalogYear || !!major) && this.renderMajorDropDown()}
          {!!catalogYear && !!major && this.renderConcentrationDropdown()}
          {!!catalogYear && !!major && this.renderCoopCycleDropDown()}
          {/* requires year, gradYear, and if there is a major, then there must be a catalog year */}
          {allFilledAndNoErrors ? (
            // Bypass completed courses screen to prevent overriding actual completed courses
            <Link
              to={{
                // pathname: !!major
                //   ? "/completedCourses"
                //   : "/transferableCredits",
                pathname: "/home",
              }}
              onClick={onClick}
              style={{ textDecoration: "none" }}
            >
              <NextButton />
            </Link>
          ) : (
            <div onClick={onClick}>
              <NextButton />
            </div>
          )}
          <DisclaimerPopup
            open={this.state.open}
            handleClose={this.handleClose.bind(this)}
          />
        </GenericOnboardingTemplate>
      );
    }
  }
}

/**
 * Callback to be passed into connect, to make properties of the AppState available as this components props.
 * @param state the AppState
 */
const mapDispatchToProps = (dispatch: Dispatch) => ({
  setAcademicYear: (academicYear: number) =>
    dispatch(setStudentAcademicYearAction(academicYear)),
  setGraduationYear: (academicYear: number) =>
    dispatch(setStudentGraduationYearAction(academicYear)),
  setMajor: (major: string | null) => dispatch(setStudentMajorAction(major)),
  setConcentration: (concentration: string | null) =>
    dispatch(setStudentConcentrationAction(concentration)),
  setCoopCycle: (coopCycle: string | null) =>
    dispatch(setStudentCoopCycleAction(coopCycle)),
  setCatalogYear: (catalogYear: number | null) =>
    dispatch(setStudentCatalogYearAction(catalogYear)),
  addNewPlanAction: (plan: IPlanData | ITemplatePlan, academicYear?: number) =>
    dispatch(addNewPlanAction(plan, academicYear)),
});

/**
 * Callback to be passed into connect, responsible for dispatching redux actions to update the appstate.
 * @param dispatch responsible for dispatching actions to the redux store.
 */
const mapStateToProps = (state: AppState) => ({
  major: getUserMajorNameFromState(state),
  majors: getMajorsFromState(state),
  plans: getPlansFromState(state),
  isFetchingMajors: getMajorsLoadingFlagFromState(state),
  isFetchingPlans: getPlansLoadingFlagFromState(state),
  userId: getUserIdFromState(state),
  completedCourses: getCompletedCoursesFromState(state),
});

/**
 * Convert this React component to a component that's connected to the redux store.
 * When rendering the connecting component, the props assigned in mapStateToProps, do not need to
 * be passed down as props from the parent component.
 */
export const OnboardingInfoScreen = connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(OnboardingScreenComponent));
