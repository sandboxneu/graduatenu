import { AddIcon } from "@chakra-ui/icons";
import {
  Text,
  Stack,
  Button,
  Checkbox,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
  useDisclosure,
  Tooltip,
} from "@chakra-ui/react";
import { API } from "@graduate/api-client";
import {
  CreatePlanDto,
  CreatePlanDtoWithoutSchedule,
  PlanModel,
  convertToOptionObjects,
} from "@graduate/common";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { mutate } from "swr";
import {
  useSupportedMajors,
  //useSupportedMinors,
  USE_STUDENT_WITH_PLANS_SWR_KEY,
  useStudentWithPlans,
  useSupportedMinors,
} from "../../hooks";
import {
  cleanDndIdsFromStudent,
  createEmptySchedule,
  extractSupportedMajorOptions,
  extractSupportedMinorOptions,
  extractSupportedMajorYears,
  handleApiClientError,
  noLeadOrTrailWhitespacePattern,
} from "../../utils";
import { BlueButton } from "../Button";
import { PlanInput, PlanSelect } from "../Form";
import { HelperToolTip } from "../Help";
import { IsGuestContext } from "../../pages/_app";
import { GraduateToolTip } from "../GraduateTooltip";
import { getLocalPlansLength } from "../../utils/plan/getLocalPlansLength";

interface AddPlanModalProps {
  setSelectedPlanId: Dispatch<SetStateAction<number | undefined | null>>;
  selectedPlanId: number | undefined | null;
}

export const AddPlanModal: React.FC<AddPlanModalProps> = ({
  setSelectedPlanId,
  selectedPlanId,
}) => {
  const router = useRouter();
  const { onOpen, onClose: onCloseDisplay, isOpen } = useDisclosure();
  const { supportedMajorsData, error: supportedMajorsError } =
    useSupportedMajors();
  const { supportedMinorsData, error: supportedMinorsError } =
    useSupportedMinors();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setValue,
    control,
  } = useForm<CreatePlanDtoWithoutSchedule>({
    mode: "onTouched",
    shouldFocusError: true,
  });
  const [isNoMajorSelected, setIsNoMajorSelected] = useState(false);
  const [isNoMinorSelected, setIsNoMinorSelected] = useState(false);
  const { isGuest } = useContext(IsGuestContext);
  const { student } = useStudentWithPlans();

  if (!student) {
    return <></>;
  }

  if (supportedMajorsError) {
    handleApiClientError(supportedMajorsError, router);
  }
  if (supportedMinorsError) {
    handleApiClientError(supportedMinorsError, router);
  }
  //if (supportedMinorsError) {
  //handleApiClientError(supportedMinorsError, router);
  //}

  const onSubmitHandler = async (payload: CreatePlanDtoWithoutSchedule) => {
    const schedule = createEmptySchedule();
    const newPlan: CreatePlanDto = {
      name: payload.name,
      catalogYear: isNoMajorSelected ? undefined : payload.catalogYear,
      major: isNoMajorSelected ? undefined : payload.major,
      minor: isNoMinorSelected ? undefined : payload.minor,
      concentration: isNoMajorSelected ? undefined : payload.concentration,
      schedule,
    };

    // create the new plan
    let createdPlanId: number;
    if (isGuest) {
      createdPlanId = student.plans.length + 1;
      // Create plan in local storage
      const planInLocalStorage: PlanModel<null> = {
        ...newPlan,
        id: createdPlanId,
        createdAt: new Date(),
        updatedAt: new Date(),
        student: cleanDndIdsFromStudent(student),
      } as PlanModel<null>;

      window.localStorage.setItem(
        "student",
        JSON.stringify({
          ...student,
          plans: [...student.plans, planInLocalStorage],
        })
      );
    } else {
      try {
        const createdPlan = await API.plans.create(newPlan);
        createdPlanId = createdPlan.id;
      } catch (error) {
        handleApiClientError(error as Error, router);

        // don't proceed further if POST failed
        return;
      }
    }

    // refresh the cache and close the modal
    mutate(USE_STUDENT_WITH_PLANS_SWR_KEY);
    onCloseAddPlanModal();
    setSelectedPlanId(createdPlanId);
  };

  const onCloseAddPlanModal = () => {
    reset();
    setIsNoMajorSelected(false);
    setIsNoMinorSelected(false);
    onCloseDisplay();
  };

  const title = watch("name");
  const catalogYear = watch("catalogYear");
  const majorName = watch("major");
  //const minorName = watch("minor");
  const concentration = watch("concentration");
  const agreeToBetaMajor = watch("agreeToBetaMajor");

  const yearSupportedMajors =
    supportedMajorsData?.supportedMajors[catalogYear ?? 0];

  const noConcentrations = { concentrations: [], minRequiredConcentrations: 0 };

  const majorConcentrations =
    yearSupportedMajors?.[majorName ?? ""] ?? noConcentrations;

  const isConcentrationRequired =
    majorConcentrations.minRequiredConcentrations > 0;

  const majorHasConcentrations = majorConcentrations.concentrations.length > 0;

  const isValidatedMajor =
    yearSupportedMajors?.[majorName ?? ""]?.verified ?? false;

  const isValidForm =
    (title &&
      catalogYear &&
      majorName &&
      (!isConcentrationRequired || concentration) &&
      (!isValidatedMajor ? agreeToBetaMajor : true)) ||
    // Valid plan for no major selected
    (title && isNoMajorSelected);

  const noMajorHelperLabel = (
    <Stack>
      <Text>
        You can opt out of selecting a major for this plan if you are unsure or
        if we do not support your major.
      </Text>
      <Text>
        Without a selected major, we won&apos;t be able to display the major
        requirements.
      </Text>
    </Stack>
  );

  const disableButton = isGuest && getLocalPlansLength() > 4;
  const showCoachMark = !selectedPlanId && !isOpen;

  return (
    <>
      <GraduateToolTip
        label="Maximum number of plans reached on guest mode. Delete an existing plan or create an account."
        shouldWrapChildren
        isDisabled={!disableButton}
      >
        <Tooltip
          shouldWrapChildren
          label="Click here to start!"
          hasArrow
          fontSize="md"
          borderRadius="sm"
          shadow="lg"
          isDisabled
          isOpen={showCoachMark}
        >
          <BlueButton
            leftIcon={<AddIcon />}
            onClick={onOpen}
            ml="xs"
            size="md"
            disabled={disableButton}
          >
            New Plan
          </BlueButton>
        </Tooltip>
      </GraduateToolTip>
      <Modal isOpen={isOpen} onClose={() => onCloseAddPlanModal()} size="md">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmitHandler)}>
            <ModalCloseButton />
            <ModalHeader color="primary.blue.dark.main" textAlign="center">
              New Plan
            </ModalHeader>
            <ModalBody>
              <VStack spacing="sm" alignItems="start">
                <PlanInput
                  label="Title"
                  id="name"
                  type="text"
                  placeholder="My Plan"
                  error={errors.name}
                  {...register("name", {
                    required: "Title is required",
                    pattern: noLeadOrTrailWhitespacePattern,
                  })}
                />
                <Flex alignItems="center">
                  <Checkbox
                    mb="0"
                    mr="xs"
                    borderColor="primary.blue.dark.main"
                    isChecked={isNoMajorSelected}
                    onChange={() => setIsNoMajorSelected(!isNoMajorSelected)}
                  />
                  <Text
                    color="primary.blue.dark.main"
                    size="md"
                    fontWeight="medium"
                    mb="0"
                    mr="2xs"
                  >
                    No Major
                  </Text>
                  <HelperToolTip label={noMajorHelperLabel} />
                </Flex>
                {!isNoMajorSelected && (
                  <>
                    <PlanSelect
                      label="Catalog Year"
                      placeholder="Select a Catalog Year"
                      name="catalogYear"
                      control={control}
                      options={convertToOptionObjects(
                        extractSupportedMajorYears(supportedMajorsData)
                      )}
                      onChangeSideEffect={(val: string | null) => {
                        const newYear = val ? parseInt(val, 10) : null;
                        if (newYear !== catalogYear) {
                          if (
                            val &&
                            majorName &&
                            supportedMajorsData?.supportedMajors?.[val]?.[
                              majorName
                            ]
                          ) {
                            // we can keep the major, but we should check the concentration
                            if (
                              majorName &&
                              !supportedMajorsData?.supportedMajors?.[val]?.[
                                majorName
                              ]?.concentrations?.includes(concentration ?? "")
                            ) {
                              setValue("concentration", "");
                            }
                          } else {
                            setValue("major", "");
                          }
                        }
                      }}
                      rules={{ required: "Catalog year is required." }}
                      isNumeric
                    />
                    <PlanSelect
                      label="Major"
                      placeholder="Select a Major"
                      name="major"
                      control={control}
                      options={extractSupportedMajorOptions(
                        catalogYear,
                        supportedMajorsData
                      )}
                      onChangeSideEffect={() => {
                        setValue("concentration", "");
                      }}
                      rules={{ required: "Major is required." }}
                      isDisabled={!catalogYear}
                      isSearchable
                      useFuzzySearch
                    />

                    {majorHasConcentrations && (
                      <PlanSelect
                        label="Concentrations"
                        name="concentration"
                        placeholder="Select a Concentration"
                        options={convertToOptionObjects(
                          majorConcentrations.concentrations
                        )}
                        control={control}
                        rules={{
                          required:
                            isConcentrationRequired &&
                            "Concentration is required",
                        }}
                        isSearchable
                        useFuzzySearch
                      />
                    )}
                    <PlanSelect
                      label="Minor"
                      placeholder="Select a Minor"
                      name="minor"
                      control={control}
                      options={extractSupportedMinorOptions(
                        catalogYear,
                        supportedMinorsData
                      )}
                      //rules={{ required: "Minor is required." }}
                      isDisabled={!catalogYear}
                      isSearchable
                      useFuzzySearch
                    />
                    <Flex align="center">
                      <Text size="xs" mr="xs">
                        Can&apos;t find your major / minor?
                      </Text>
                      <HelperToolTip label="We are working to support all majors, but in the meantime, you can submit feedback requesting your major and select 'No Major' so that you can still use our planner!" />
                    </Flex>
                    {majorName && !isValidatedMajor && (
                      <Flex alignItems="center">
                        <Checkbox
                          mr="md"
                          borderColor="primary.blue.dark.main"
                          {...register("agreeToBetaMajor", {
                            required: "You must agree to continue",
                          })}
                        />
                        <Text>
                          I understand that I am selecting a beta major and that
                          the requirements may not be accurate.
                        </Text>
                      </Flex>
                    )}
                  </>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter justifyContent="center">
              <Flex columnGap="sm">
                <Button
                  variant="solidWhite"
                  size="md"
                  borderRadius="lg"
                  onClick={onCloseAddPlanModal}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  isLoading={isSubmitting}
                  isDisabled={!isValidForm}
                  size="md"
                  borderRadius="lg"
                  type="submit"
                >
                  Create Plan
                </Button>
              </Flex>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
