import type { OptionObject } from "./types";

const UNDECIDED_OPTION: OptionObject = {
  label: "Undecided",
  value: "Undecided",
};

/** Does the given password satisfy our minimum criteria for strength? */
export const isStrongPassword = (password: string): boolean => {
  const containsLettersAndNumbersRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])/;
  return password.length >= 8 && containsLettersAndNumbersRegex.test(password);
};

/**
 * Comparator function for sorting majors by name Criteria: ignores spacing and
 * special characters when sorting
 */
export const majorNameComparator = (a: string, b: string) => {
  const trimmedA = a
    .replace(/[^A-Z0-9]/gi, "")
    .trim()
    .toLowerCase();
  const trimmedB = b
    .replace(/[^A-Z0-9]/gi, "")
    .trim()
    .toLowerCase();
  return trimmedA.localeCompare(trimmedB);
};

/**
 * Comparator function for sorting option objects by value Criteria: ignores
 * spacing and special characters when sorting
 */
export const majorOptionObjectComparator = (
  a: OptionObject,
  b: OptionObject
) => {
  return majorNameComparator(a.value.toString(), b.value.toString());
};

/**
 * Converts a list of strings or numbers into a list of option objects for the
 * Select component.
 *
 * IncludeUndecided: optional parameter specifying whether to include\
 * "Undecided" as an option
 */
export const convertToOptionObjects = (
  options: (string | number)[],
  includeUndecided = false
): OptionObject[] => {
  const optionObjects = options.map((option) => ({
    label: option,
    value: option,
  }));
  if (includeUndecided) {
    optionObjects.unshift(UNDECIDED_OPTION);
  }
  return optionObjects;
};
