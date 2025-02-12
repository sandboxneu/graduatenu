import useSWR, { SWRResponse } from "swr";
import { API } from "@graduate/api-client";
import { Minor } from "@graduate/common";
import { AxiosError } from "axios";

type MinorResponse = Omit<
  SWRResponse<Minor, AxiosError | Error>,
  "data" | "mutate"
>;

type MinorReturn = MinorResponse & {
  minor?: Minor;
  isLoading: boolean;
};

/**
 * Gets the major by the major name and year.
 *
 * @param catalogYear
 * @param minorName   The name of the major, ex: "Computer Science, BSCS".
 */
export function useMinor(catalogYear: number, minorName: string): MinorReturn {
  const key = `api/minor/${catalogYear}/${minorName}`;

  const { data, ...rest } = useSWR(
    key,
    async () => await API.minors.get(catalogYear, minorName)
  );

  return {
    ...rest,
    minor: data,
    isLoading: !data && !rest.error,
  };
}
