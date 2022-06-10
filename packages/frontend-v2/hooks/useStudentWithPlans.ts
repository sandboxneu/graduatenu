import useSWR, { KeyedMutator, SWRResponse } from "swr";
import { API } from "@graduate/api-client";
import { GetStudentResponse } from "@graduate/common";
import { AxiosError } from "axios";

type StudentResponse = Omit<
  SWRResponse<GetStudentResponse, AxiosError>,
  "data" | "mutate"
>;

type UseStudentReturn = StudentResponse & {
  isLoading: boolean;
  mutateStudent: KeyedMutator<GetStudentResponse>;
  student?: GetStudentResponse;
};

/**
 * Returns the student with plan using SWR.
 * @param jwt JWT for authentication to fetch the data from db.
 * Will later be removed when we switch to cookies.
 */
export function useStudentWithPlans(jwt: string): UseStudentReturn {
  const key = `api/students/me`;

  const { data, mutate, ...rest } = useSWR(
    key,
    async () => await API.student.getMeWithPlan(jwt)
  );

  return {
    ...rest,
    student: data,
    mutateStudent: mutate,
    isLoading: !data && !rest.error,
  };
}
