import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { DNDScheduleCourse } from "../../models/types";
import { CourseWarning } from "@graduate/common";
import styled from "styled-components";
import { Card, Tooltip } from "@material-ui/core";

const Container = styled.div<any>`
  flex: 1;
  margin: 5px 0px 0px ${(props) => 4 + props.level * 10 + "px"};
`;

const Block = styled(Card)<any>`
  height: 25px;
  border-radius: 4px;
  display: flex;
  flex-direction: row;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.15);
  width: 100%;
`;

const SidebarClassBlockBodyContainer = styled.div<any>`
  background-color: #e5e5e5;
  padding-left: 5px;
  flex: 1;
  min-width: 0;
`;

const CompletedSidebarClassBlockBodyContainer = styled.div<any>`
  background-color: #cee2d6;
  padding-left: 5px;
  flex: 1;
  min-width: 0;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  min-width: 0;
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
`;

const Title = styled.div`
  font-weight: normal;
  font-size: 14px;
  margin-right: 4px;
`;

const CompletedTitle = styled.div`
  color: #5d6b63;
  font-weight: normal;
  font-size: 14px;
  margin-right: 4px;
`;

interface SidebarClassBlockProps {
  class: DNDScheduleCourse;
  lab?: DNDScheduleCourse;
  index: number;
  warning?: CourseWarning;
  completed: boolean;
  currentClassCounter: number;
  level: number;
  isEditable: boolean;
}

export class SidebarClassBlock extends React.Component<SidebarClassBlockProps> {
  constructor(props: SidebarClassBlockProps) {
    super(props);
  }

  renderBody() {
    if (this.props.completed) {
      return (
        <CompletedSidebarClassBlockBodyContainer warning={this.props.warning}>
          <Wrapper>
            <TitleWrapper>
              {this.props.lab && (
                <CompletedTitle>
                  {this.props.class.subject +
                    " " +
                    this.props.class.classId +
                    " and " +
                    this.props.lab.classId}
                </CompletedTitle>
              )}
              {!this.props.lab && (
                <CompletedTitle>
                  {this.props.class.subject + " " + this.props.class.classId}
                </CompletedTitle>
              )}
            </TitleWrapper>
          </Wrapper>
        </CompletedSidebarClassBlockBodyContainer>
      );
    } else {
      return (
        <SidebarClassBlockBodyContainer warning={this.props.warning}>
          <Wrapper>
            <TitleWrapper>
              {this.props.lab && (
                <Title>
                  {this.props.class.subject +
                    " " +
                    this.props.class.classId +
                    " and " +
                    this.props.lab.classId}
                </Title>
              )}
              {!this.props.lab && (
                <Title>
                  {this.props.class.subject + " " + this.props.class.classId}
                </Title>
              )}
            </TitleWrapper>
          </Wrapper>
        </SidebarClassBlockBodyContainer>
      );
    }
  }

  /**
   * Returns this ClassBlock's draggableId based on whether or not it contains a lab.
   */
  getDraggableId() {
    if (this.props.lab) {
      return (
        this.props.class.subject.toUpperCase() +
        " " +
        this.props.class.classId +
        " " +
        this.props.lab.subject.toUpperCase() +
        " " +
        this.props.lab.classId
      );
    } else {
      return (
        this.props.class.subject.toUpperCase() + " " + this.props.class.classId
      );
    }
  }

  getTitle() {
    if (this.props.lab) {
      return this.props.class.name + " and " + this.props.lab.name;
    } else {
      return this.props.class.name;
    }
  }

  render() {
    if (this.props.isEditable) {
      return (
        <Container level={this.props.level}>
          <Draggable
            isDragDisabled={this.props.completed}
            draggableId={this.getDraggableId()}
            index={this.props.index}
          >
            {(provided) => {
              return (
                <Tooltip
                  title={this.getTitle()}
                  placement="top"
                  PopperProps={{
                    disablePortal: true,
                  }}
                >
                  <div>
                    <Block
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      ref={provided.innerRef}
                    >
                      {this.renderBody()}
                    </Block>
                  </div>
                </Tooltip>
              );
            }}
          </Draggable>
        </Container>
      );
    } else {
      return (
        <Container level={this.props.level}>
          <Tooltip
            title={this.getTitle()}
            placement="top"
            PopperProps={{
              disablePortal: true,
            }}
          >
            <div>
              <Block>{this.renderBody()}</Block>
            </div>
          </Tooltip>
        </Container>
      );
    }
  }
}
