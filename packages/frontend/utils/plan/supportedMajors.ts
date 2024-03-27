import {
  GetSupportedMajorsResponse,
  OptionObject,
  majorNameComparator,
  majorOptionObjectComparator,
} from "@graduate/common";

export const extractSupportedMajorYears = (
  supportedMajorsData?: GetSupportedMajorsResponse
) => {
  return Object.keys(supportedMajorsData?.supportedMajors ?? {});
};

/**
 * Returns a list of the supported majors names as strings for the given catalog year.
 *
 * @param   catalogYear         Catalog year to search for
 * @param   supportedMajorsData Supported major data to extract from
 * @returns                     A list of the supported major names for the
 *   given catalog year
 */
export const extractSupportedMajorNames = (
  catalogYear?: number,
  supportedMajorsData?: GetSupportedMajorsResponse
): string[] => {
  if (!catalogYear) {
    return [];
  }
  const majorMap = supportedMajorsData?.supportedMajors[catalogYear];
  return Object.keys(majorMap ?? {}).sort(majorNameComparator);
};

/**
 * Returns a list of option objects for supported majors (label, value) for the
 * given catalog year.
 *
 * @param   catalogYear         Catalog year to search for
 * @param   supportedMajorsData Supported major data to extract from
 * @returns                     A list of the supported major option objects for
 *   the given catalog year
 */
export const extractSupportedMajorOptions = (
  catalogYear?: number,
  supportedMajorsData?: GetSupportedMajorsResponse
): OptionObject[] => {
  if (!catalogYear) {
    return [];
  }
  const majorMap = supportedMajorsData?.supportedMajors[catalogYear];
  return Object.keys(majorMap ?? {})
    .map((majorName) => {
      return {
        label: majorName + (majorMap?.[majorName].verified ? "" : " [BETA]"),
        value: majorName,
      };
    })
    .sort(majorOptionObjectComparator);
};
