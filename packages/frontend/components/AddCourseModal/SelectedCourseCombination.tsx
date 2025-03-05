import { MinusIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton, Text, Collapse } from "@chakra-ui/react";
import { NUPathEnum, ScheduleCourse2 } from "@graduate/common";
import { getCourseDisplayString } from "../../utils/";
import { NUPathLabel } from "./NUPathLabel";
import { useState } from "react";
import { UpTriangle, DownTriangle } from "./DropdownTriangle";

interface SelectedCourseCombinationProps {
  selectedCourse: ScheduleCourse2<null>;
  selectedCourseCoreq: ScheduleCourse2<null>;
  selectedNUPaths?: NUPathEnum[];
  removeSelectedCourses: (courses: ScheduleCourse2<null>[]) => void;
}

export const SelectedCourseCombination: React.FC<
  SelectedCourseCombinationProps
> = ({
  selectedCourse,
  selectedCourseCoreq,
  removeSelectedCourses,
  selectedNUPaths: filteredPaths,
}) => {
  const [opened, setOpened] = useState(true);

  return (
    <Flex
      direction="column"
      borderRadius="xl"
      border="1px"
      borderColor="neutral.200"
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        padding="xs"
        px="sm"
        py="sm"
      >
        <Box lineHeight="1">
          <Text fontSize="sm">
            <Text as="span" fontWeight="bold" marginRight="2">
              {getCourseDisplayString(selectedCourse)}
            </Text>
            <Text as="span">{selectedCourse.name}</Text>
            <Box as="span" display="inline-block">
              {opened ? (
                <UpTriangle boxSize="12px" onClick={() => setOpened(false)} />
              ) : (
                <DownTriangle boxSize="12px" onClick={() => setOpened(true)} />
              )}
            </Box>
          </Text>
        </Box>
        <NUPathLabel
          nuPaths={selectedCourse.nupaths == null ? [] : selectedCourse.nupaths}
          filteredPaths={filteredPaths ? filteredPaths : []}
        />
        <IconButton
          aria-label="Delete course"
          icon={<MinusIcon />}
          color="primary.red.main"
          borderColor="primary.red.main"
          colorScheme="primary.red.main"
          isRound
          size="xs"
          onClick={() =>
            removeSelectedCourses([selectedCourse, selectedCourseCoreq])
          }
          alignSelf="center"
          ml="sm"
        />
      </Flex>
      <Collapse in={opened} animateOpacity>
        <div
          style={{
            width: "96%",
            height: "1px",
            backgroundColor: "#F4F6F9",
            margin: "0 auto",
          }}
        ></div>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          padding="xs"
          px="sm"
          py="sm"
        >
          <Box lineHeight="1">
            <Text fontSize="sm" marginLeft="lg">
              <Text as="span" fontWeight="bold" marginRight="2">
                {getCourseDisplayString(selectedCourseCoreq)}
              </Text>
              <Text as="span">{selectedCourseCoreq.name}</Text>
            </Text>
          </Box>
          <NUPathLabel
            nuPaths={
              selectedCourseCoreq.nupaths == null
                ? []
                : selectedCourseCoreq.nupaths
            }
            filteredPaths={filteredPaths ? filteredPaths : []}
          />
          <IconButton
            aria-label="Delete course"
            icon={<MinusIcon />}
            color="primary.red.main"
            borderColor="primary.red.main"
            colorScheme="primary.red.main"
            isRound
            size="xs"
            isDisabled={true}
            onClick={() => removeSelectedCourses([selectedCourseCoreq])}
            alignSelf="center"
            ml="sm"
          />
        </Flex>
      </Collapse>
    </Flex>
  );
};
