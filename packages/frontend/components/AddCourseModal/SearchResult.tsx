import { AddIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { NUPathEnum, ScheduleCourse2, SeasonEnum } from "@graduate/common";
import { getCourseDisplayString } from "../../utils/";
import { GraduateToolTip } from "../GraduateTooltip";
import { NUPathLabel } from "./NUPathLabel";
import { getSearchLink } from "../ScheduleCourse";
import { UpTriangle, DownTriangle } from "./DropdownTriangle";

interface SearchResultProps {
  course: ScheduleCourse2<null>;
  year: number | undefined;
  season: SeasonEnum;
  addSelectedCourse: (course: ScheduleCourse2<null>) => Promise<void>;
  isResultAlreadySelected: boolean;
  isResultAlreadyAdded: boolean;
  /** Another course is currently in the process of being selected. */
  isSelectingAnotherCourse?: boolean;
  selectedNUPaths: NUPathEnum[];
  coreq?: boolean;
  opened?: boolean;
  toggleCoreq?: () => void;
}

export const SearchResult: React.FC<SearchResultProps> = ({
  course,
  year,
  season,
  addSelectedCourse,
  isResultAlreadySelected,
  isResultAlreadyAdded,
  isSelectingAnotherCourse,
  selectedNUPaths: filteredPaths,
  coreq,
  opened,
  toggleCoreq,
}) => {
  const isAddButtonDisabled = isResultAlreadyAdded || isResultAlreadySelected;
  const addButtonTooltip = isResultAlreadyAdded
    ? "This course has already been added."
    : isResultAlreadySelected
    ? "This course is already selected."
    : undefined;

  return (
    <Box>
      <Flex
        justifyContent="space-between"
        alignItems="end"
        padding="2xs"
        paddingY="xs"
      >
        <Flex width="100%" mr="md" alignItems="center" minH="25px">
          <Box lineHeight="1.2">
            <Flex alignItems="center">
              <Text as="span" fontSize="sm" fontWeight="bold" marginRight="sm">
                {getCourseDisplayString(course)}
              </Text>
              <Text as="span" fontSize="sm">
                {course.name}
              </Text>
              {coreq &&
                (opened ? (
                  <UpTriangle boxSize="12px" onClick={toggleCoreq} />
                ) : (
                  <DownTriangle boxSize="12px" onClick={toggleCoreq} />
                ))}
            </Flex>
          </Box>
          <Box ml="auto" mr="sm"></Box>
          <GraduateToolTip
            label={`Search for ${getCourseDisplayString(course)} on SearchNEU`}
          >
            <a
              href={getSearchLink(year ?? 2022, season, course)}
              target="_blank"
              rel="noreferrer"
            >
              <IconButton
                aria-label="Search course information"
                icon={<InfoOutlineIcon />}
                color="primary.blue.light.main"
                border={0}
                colorScheme="primary.blue.light.main"
                isRound
                size="md"
                isLoading={isSelectingAnotherCourse}
                isDisabled={isResultAlreadyAdded || isResultAlreadySelected}
                alignSelf="center"
              />
            </a>
          </GraduateToolTip>
          <NUPathLabel
            nuPaths={course.nupaths ? course.nupaths : []}
            filteredPaths={filteredPaths}
          />
        </Flex>

        <GraduateToolTip
          label={addButtonTooltip}
          isDisabled={!isAddButtonDisabled}
        >
          <IconButton
            aria-label="Add class"
            icon={<AddIcon />}
            color="primary.blue.light.main"
            borderColor="primary.blue.light.main"
            colorScheme="primary.blue.light.main"
            isRound
            size="xs"
            mr="sm"
            onClick={() => addSelectedCourse(course)}
            isLoading={isSelectingAnotherCourse}
            isDisabled={isResultAlreadyAdded || isResultAlreadySelected}
            alignSelf="center"
          />
        </GraduateToolTip>
      </Flex>
    </Box>
  );
};
