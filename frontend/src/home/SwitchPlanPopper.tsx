import React from "react";
import { MenuItem, Menu } from "@material-ui/core";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "../state/reducers/state";
import { Dispatch } from "redux";
import { getSchedulesFromState, getActiveScheduleFromState } from "../state";
import {
  setActiveScheduleAction,
  removeScheduleAction,
  addScheduleAction,
} from "../state/actions/schedulesActions";
import { NamedSchedule, PastPresentSchedule } from "../models/types";

const SwitchPlanContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
`;

const SwitchPlanMenu = styled(Menu)`
  margin-top: 45px;
  margin-left: 20px;
`;

interface ReduxStoreSwitchSchedulesProps {
  // activeSchedule: NamedSchedule;
  schedules: NamedSchedule[];
}

interface ReduxDispatchSwitchSchedulesProps {
  setActiveSchedule: (activeSchedule: number) => void;
  addSchedule: (name: string, schedule: PastPresentSchedule) => void;
  removeSchedule: (name: string, schedule: PastPresentSchedule) => void;
}

type Props = ReduxStoreSwitchSchedulesProps & ReduxDispatchSwitchSchedulesProps;

interface SwitchSchedulePopperState {
  anchorEl: null | HTMLElement;
}

export class SwitchPlanPopperComponent extends React.Component<
  Props,
  SwitchSchedulePopperState
> {
  constructor(props: Props) {
    super(props);
    this.state = {
      anchorEl: null,
    };
  }

  /**
   * Toggles opening the SwitchPlanPopper when the plan name is clicked.
   * @param event mouse event trigger
   */
  handleClick(event: React.MouseEvent<HTMLElement>) {
    if (this.state.anchorEl === null) {
      this.setState({
        anchorEl: event.currentTarget,
      });
    } else {
      this.setState({
        anchorEl: null,
      });
    }
  }

  /**
   * Updates this user's active schedule based on the schedule selected in the dropdown.
   */
  onChoosePlan(value: string) {
    const newSchedule = this.props.schedules.find(s => s.name === value);
    if (newSchedule) {
      const newActive = this.props.schedules.indexOf(newSchedule);
      this.props.setActiveSchedule(newActive);
      this.setState({
        anchorEl: null,
      });
    }
  }

  /**
   * Enables hiding the popper by clicking anywhere else on the screen.
   */
  handleClickAway() {
    this.setState({
      anchorEl: null,
    });
  }

  render() {
    console.log(this.props);
    return (
      <div>
        <SwitchPlanContainer onClick={event => this.handleClick(event)}>
          {/* <h2>{`- ${this.props.activeSchedule.name}`}</h2> */}
          <h2>{`- hello`}</h2>
          {Boolean(this.state.anchorEl) ? (
            <KeyboardArrowUpIcon />
          ) : (
            <KeyboardArrowDownIcon />
          )}
        </SwitchPlanContainer>
        <SwitchPlanMenu
          id={"simple-popper"}
          open={Boolean(this.state.anchorEl)}
          anchorEl={this.state.anchorEl}
          onClose={this.handleClickAway}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
        >
          {this.props.schedules.map(s => (
            <MenuItem onClick={() => this.onChoosePlan(s.name)} key={s.name}>
              {s.name}
            </MenuItem>
          ))}
        </SwitchPlanMenu>
      </div>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  schedules: getSchedulesFromState(state),
  // activeSchedule: getActiveScheduleFromState(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setActiveSchedule: (activeSchedule: number) =>
    dispatch(setActiveScheduleAction(activeSchedule)),
  addSchedule: (name: string, schedule: PastPresentSchedule) =>
    dispatch(addScheduleAction(schedule, name)),
  removeSchedule: (name: string, schedule: PastPresentSchedule) =>
    dispatch(removeScheduleAction(schedule, name)),
});

export const SwitchPlanPopper = connect<
  ReduxStoreSwitchSchedulesProps,
  ReduxDispatchSwitchSchedulesProps,
  {},
  AppState
>(
  mapStateToProps,
  mapDispatchToProps
)(SwitchPlanPopperComponent);
