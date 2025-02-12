import useSWR, { SWRResponse } from "swr";
import { API } from "@graduate/api-client";
import { GetSupportedMinorsResponse } from "@graduate/common";
import { AxiosError } from "axios";

type SupportedMinorsResponse = Omit<
  SWRResponse<GetSupportedMinorsResponse, AxiosError | Error>,
  "data" | "mutate"
>;

type SupportedMinorsReturn = SupportedMinorsResponse & {
  supportedMinorsData?: GetSupportedMinorsResponse;
  isLoading: boolean;
};

/** Gets the majors we support, by year and name. */
export function useSupportedMinors(): SupportedMinorsReturn {
  const key = `api/minors/supportedMinors`;

  const { data, ...rest } = useSWR(
    key,
    async () => await API.minors.getSupportedMinors()
  );

  return {
    ...rest,
    supportedMinorsData: data,
    isLoading: !data && !rest.error,
  };
}
