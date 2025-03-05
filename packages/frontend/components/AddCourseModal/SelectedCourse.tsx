import { MinusIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { NUPathEnum, ScheduleCourse2 } from "@graduate/common";
import { getCourseDisplayString } from "../../utils/";
import { NUPathLabel } from "./NUPathLabel";

interface SelectedCourseProps {
  selectedCourse: ScheduleCourse2<null>;
  selectedNUPaths?: NUPathEnum[];
  removeSelectedCourse: (course: ScheduleCourse2<null>) => void;
}

export const SelectedCourse: React.FC<SelectedCourseProps> = ({
  selectedCourse,
  removeSelectedCourse,
  selectedNUPaths: filteredPaths,
}) => {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      padding="xs"
      px="sm"
      py="sm"
      borderRadius="xl"
      border="1px"
      borderColor="neutral.200"
    >
      <Box lineHeight="1">
        <Text fontSize="sm">
          <Text as="span" fontWeight="bold" marginRight="2">
            {getCourseDisplayString(selectedCourse)}
          </Text>
          <Text as="span">{selectedCourse.name}</Text>
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
        onClick={() => removeSelectedCourse(selectedCourse)}
        alignSelf="center"
        ml="sm"
      />
    </Flex>
  );
};
