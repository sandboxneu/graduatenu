import {
  GetSupportedMinorsResponse,
  OptionObject,
  majorNameComparator,
  majorOptionObjectComparator,
} from "@graduate/common";

export const extractSupportedMinorYears = (
  supportedMinorsData?: GetSupportedMinorsResponse
) => {
  return Object.keys(supportedMinorsData?.supportedMinors ?? {});
};

/**
 * Returns a list of the supported majors names as strings for the given catalog year.
 *
 * @param   catalogYear         Catalog year to search for
 * @param   supportedMinorsData Supported major data to extract from
 * @returns                     A list of the supported major names for the
 *   given catalog year
 */
export const extractSupportedMinorNames = (
  catalogYear?: number,
  supportedMinorsData?: GetSupportedMinorsResponse
): string[] => {
  if (!catalogYear) {
    return [];
  }
  const minorMap = supportedMinorsData?.supportedMinors[catalogYear];
  return Object.keys(minorMap ?? {}).sort(majorNameComparator);
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
export const extractSupportedMinorOptions = (
  catalogYear?: number,
  supportedMinorsData?: GetSupportedMinorsResponse
): OptionObject[] => {
  if (!catalogYear) {
    return [];
  }
  const minorMap = supportedMinorsData?.supportedMinors[catalogYear];
  return Object.keys(minorMap ?? {})
    .map((minorName) => {
      return {
        //label: (minorMap?.[minorName].verified ? "" : "[BETA] ") + majorName,
        label: "[BETA]" + minorName,
        value: minorName,
      };
    })
    .sort(majorOptionObjectComparator);
};
