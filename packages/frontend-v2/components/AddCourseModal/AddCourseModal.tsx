import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
} from "@chakra-ui/react";
import { ScheduleCourse2 } from "@graduate/common";
import { useRouter } from "next/router";
import { useState } from "react";
import { useSearchCourses } from "../../hooks/useSearchCourses";
import {
  isEqualCourses,
  getCourseDisplayString,
  getRequiredCourseCoreqs,
} from "../../utils";
import { SearchCoursesInput } from "./SearchCoursesInput";
import { SearchResult } from "./SearchResult";
import { SelectedCourse } from "./SelectedCourse";

interface AddCourseModalProps {
  isOpen: boolean;
  /** Function to close the modal UX, returned from the useDisclosure chakra hook */
  closeModalDisplay: () => void;

  /** Function to check if the given course exists in the plan being displayed. */
  isCourseInCurrTerm: (course: ScheduleCourse2<unknown>) => boolean;

  /** Function to add classes to the curr term in the plan being displayed. */
  addClassesToCurrTerm: (courses: ScheduleCourse2<null>[]) => void;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  isOpen,
  closeModalDisplay,
  isCourseInCurrTerm,
  addClassesToCurrTerm,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<
    ScheduleCourse2<null>[]
  >([]);

  const {
    courses,
    isLoading: isCoursesLoading,
    error,
  } = useSearchCourses(searchQuery);

  const addSelectedCourse = async (course: ScheduleCourse2<null>) => {
    // don't allow courses to be selected multiple times
    if (isCourseAlreadySelected(course)) {
      return;
    }

    const updatedSelectedCourses = [...selectedCourses];

    // grab any coreqs of the course that haven't already been selected/added to the term
    const coreqs = (await getRequiredCourseCoreqs(course)).filter((coreq) => {
      const isAlreadySelected = selectedCourses.find((selectedCourse) =>
        isEqualCourses(selectedCourse, coreq)
      );
      const isAlreadyAdded = isCourseInCurrTerm(coreq);
      return !(isAlreadyAdded || isAlreadySelected);
    });

    updatedSelectedCourses.push(course, ...coreqs);

    setSelectedCourses(updatedSelectedCourses);
  };

  const removeSelectedCourse = (course: ScheduleCourse2<null>) => {
    const updatedSelectedCourses = selectedCourses.filter(
      (selectedCourse) => !isEqualCourses(selectedCourse, course)
    );

    setSelectedCourses(updatedSelectedCourses);
  };

  const isCourseAlreadySelected = (course: ScheduleCourse2<null>) => {
    return selectedCourses.some((selectedCourse) =>
      isEqualCourses(selectedCourse, course)
    );
  };

  const addClassesOnClick = async () => {
    addClassesToCurrTerm(selectedCourses);
    onClose();
  };

  const onClose = () => {
    setSelectedCourses([]);
    closeModalDisplay();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Courses</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SearchCoursesInput setSearchQuery={setSearchQuery} />
          <VStack
            height="200px"
            mt="md"
            overflow="scroll"
            alignItems="left"
            gap="2xs"
          >
            {error && (
              <Text fontWeight="semibold" textAlign="center">
                Error searching courses
              </Text>
            )}
            {courses &&
              courses.map((searchResult) => (
                <SearchResult
                  key={getCourseDisplayString(searchResult)}
                  searchResult={searchResult}
                  addSelectedCourse={addSelectedCourse}
                  isResultAlreadyInTerm={isCourseInCurrTerm(searchResult)}
                  isResultAlreadySelected={isCourseAlreadySelected(
                    searchResult
                  )}
                />
              ))}
          </VStack>
          <VStack maxHeight="200px" mt="md" overflow="scroll" pb="xs">
            {selectedCourses.map((selectedCourse) => (
              <SelectedCourse
                key={getCourseDisplayString(selectedCourse)}
                selectedCourse={selectedCourse}
                removeSelectedCourse={removeSelectedCourse}
              />
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="solid"
            fontWeight="bold"
            color="primary.blue.light.main"
            colorScheme="neutral"
            backgroundColor="neutral.main"
            border="none"
            mr={3}
            onClick={addClassesOnClick}
            textTransform="uppercase"
            isLoading={isCoursesLoading}
          >
            Add
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
