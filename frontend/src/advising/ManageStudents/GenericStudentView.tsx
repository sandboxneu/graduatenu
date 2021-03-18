import React, { useEffect, useState } from "react";
import { batch, useDispatch } from "react-redux";
import { useParams, useRouteMatch } from "react-router";
import { fetchUser } from "../../services/AdvisorService";
import {
  setStudentAction,
  setTransferCoursesAction,
} from "../../state/actions/studentActions";
import { getScheduleCoursesFromSimplifiedCourseDataAPI } from "../../utils/course-helpers";
import { ExpandedStudentView } from "./ExpandedStudentView";
import { StudentView } from "./StudentView";

interface ParamProps {
  id: string; // id of the student
  planId: string; // id of the student's plan
}

/**
 * This component represents a standard or expanded student view within the advisor workflow.
 * The reason for this abstraction is in order to share data across both of these views and
 * properly clean up set state when navigating away from either.
 * @returns
 */
export const GenericStudentView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>();
  const dispatch = useDispatch();
  const params = useParams<ParamProps>();
  const userId = Number(params.id);

  const isExpanded = !!useRouteMatch(
    "/advisor/manageStudents/:id/expanded/:planId"
  );

  useEffect(() => {
    fetchUser(userId).then(response => {
      const user = response.user;

      getScheduleCoursesFromSimplifiedCourseDataAPI(user.coursesTransfer).then(
        courses => {
          batch(() => {
            dispatch(setStudentAction(user));
            dispatch(setTransferCoursesAction(courses));
          });

          setLoading(false);
        }
      );

      setUser(user);
    });

    return () => {
      // Clear the student.
      dispatch(setStudentAction());
    };
  }, []);

  if (isExpanded) {
    return <ExpandedStudentView user={user} />;
  }

  return <StudentView user={user} fetchingStudent={loading} />;
};
