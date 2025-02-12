import { EditIcon } from "@chakra-ui/icons";
import {
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
  Stack,
  useDisclosure,
  VStack,
  Text,
} from "@chakra-ui/react";
import { API } from "@graduate/api-client";
import {
  PlanModel,
  UpdatePlanDto,
  convertToOptionObjects,
} from "@graduate/common";
import { useRouter } from "next/router";
import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSWRConfig } from "swr";
import {
  USE_STUDENT_WITH_PLANS_SWR_KEY,
  useStudentWithPlans,
  useSupportedMajors,
  useSupportedMinors,
} from "../../hooks";
import {
  extractSupportedMajorOptions,
  extractSupportedMinorOptions,
  extractSupportedMajorYears,
  handleApiClientError,
  noLeadOrTrailWhitespacePattern,
} from "../../utils";
import { toast } from "../../utils";
import { BlueButton } from "../Button";
import { PlanInput, PlanSelect } from "../Form";
import { HelperToolTip } from "../Help";
import { IsGuestContext } from "../../pages/_app";

type EditPlanModalProps = {
  plan: PlanModel<string>;
};

type EditPlanInput = {
  name: string;
  major: string;
  minor?: string;
  catalogYear: number;
  concentration: string;
  agreeToBetaMajor: boolean;
};

export const EditPlanModal: React.FC<EditPlanModalProps> = ({ plan }) => {
  const { supportedMajorsData, error: supportedMajorsError } =
    useSupportedMajors();
  const { supportedMinorsData, error: supportedMinorsError } =
    useSupportedMinors();
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const { onOpen, onClose: onCloseDisplay, isOpen } = useDisclosure();
  const [isNoMajorSelected, setIsNoMajorSelected] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isDirty, errors, isSubmitting },
    watch,
    reset,
    setValue,
    control,
  } = useForm<EditPlanInput>({
    mode: "onTouched",
    shouldFocusError: true,
  });
  const { student } = useStudentWithPlans();
  const { isGuest } = useContext(IsGuestContext);

  const resetValuesToCurrPlan = useCallback(() => {
    if (!plan) {
      return;
    }

    // Change the default field to the corresponding plan when a plan is selected/edited
    reset({
      name: plan.name,
      catalogYear: plan.catalogYear,
      major: plan.major,
      minor: plan.minor,
      concentration: plan.concentration,
    });

    if (!plan.major) {
      setIsNoMajorSelected(true);
    } else {
      setIsNoMajorSelected(false);
    }
  }, [plan, reset, setIsNoMajorSelected]);

  useEffect(() => {
    resetValuesToCurrPlan();
  }, [resetValuesToCurrPlan]);

  if (supportedMajorsError) {
    handleApiClientError(supportedMajorsError, router);
  }
  if (supportedMinorsError) {
    handleApiClientError(supportedMinorsError, router);
  }

  if (!student) {
    return <></>;
  }

  const title = watch("name");
  const catalogYear = watch("catalogYear");
  const majorName = watch("major");
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

  const onSubmitHandler = async (payload: UpdatePlanDto) => {
    // no submitting till the curr plan has been fetched
    if (!plan) {
      return;
    }

    const isNoMajorSelectedPrev = !plan.major;

    // If no field has been changed, don't send an update request
    if (!isDirty && isNoMajorSelectedPrev === isNoMajorSelected) {
      toast.info("No fields have been updated.");
      return;
    }

    const newPlan: UpdatePlanDto = {
      name: payload.name,
      catalogYear: isNoMajorSelected ? undefined : payload.catalogYear,
      major: isNoMajorSelected ? undefined : payload.major,
      concentration: isNoMajorSelected ? undefined : payload.concentration,
      minor: payload.minor,
    };

    if (isGuest) {
      const newTempPlan = {
        ...plan,
        ...newPlan,
      };

      window.localStorage.setItem(
        "student",
        JSON.stringify({
          ...student,
          plans: student.plans.map((cur) =>
            cur.id === plan.id ? newTempPlan : cur
          ),
        })
      );
    } else {
      try {
        console.log("Updating plan", plan.id, newPlan);
        await API.plans.update(plan.id, newPlan);
      } catch (error) {
        handleApiClientError(error as Error, router);
        return;
      }
    }

    mutate(USE_STUDENT_WITH_PLANS_SWR_KEY);
    toast.success("Plan updated successfully.");
    onCloseModal();
  };

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

  const onCloseModal = () => {
    resetValuesToCurrPlan();
    onCloseDisplay();
  };

  return (
    <>
      <BlueButton leftIcon={<EditIcon />} onClick={onOpen} ml="xs" size="md">
        Edit Plan
      </BlueButton>

      <Modal isOpen={isOpen} onClose={onCloseModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmitHandler)}>
            <ModalCloseButton />
            <ModalHeader color="primary.blue.dark.main" textAlign="center">
              Edit Plan
            </ModalHeader>
            <ModalBody>
              <VStack spacing="sm" alignItems="start">
                <PlanInput
                  error={errors.name}
                  label="Title"
                  type="text"
                  id="name"
                  placeholder="My Plan"
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
                            supportedMajorsData?.supportedMajors?.[val]?.[
                              majorName
                            ]
                          ) {
                            // we can keep the major, but we should check the concentration
                            if (
                              !supportedMajorsData?.supportedMajors?.[val]?.[
                                majorName
                              ]?.concentrations?.includes(concentration)
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
                      isSearchable
                      useFuzzySearch
                      isDisabled={!catalogYear}
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
                      isDisabled={!catalogYear}
                      isSearchable
                      useFuzzySearch
                    />
                    {majorName && !isValidatedMajor && (
                      <Flex alignItems="center">
                        <Checkbox
                          mr="md"
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
                  onClick={onCloseModal}
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
                  Save
                </Button>
              </Flex>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
