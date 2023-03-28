import {
  useDisclosure,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  Flex,
} from "@chakra-ui/react";
import { API } from "@graduate/api-client";
import { handleApiClientError, toast } from "../../utils";
import axios from "axios";
import { ChangePasswordDto, isStrongPassword } from "@graduate/common";
import { useForm } from "react-hook-form";
import { GraduateInput } from "../Form";
import { useRouter } from "next/router";

export const ChangePassword: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger,
  } = useForm<ChangePasswordDto>({
    mode: "onTouched",
    shouldFocusError: true,
  });

  // Need this for validation
  const password = watch("newPassword", "");

  const closeModal = () => {
    onClose();
  };

  const onSubmitHandler = async (payload: ChangePasswordDto) => {
    try {
      await API.student.changePassword(payload);
      toast.success("Password has been changed!");
      closeModal();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          `${error.response?.data.message}. Please check your inputs and try again.`
        );
      } else {
        handleApiClientError(error as Error, router);
      }
    }
  };

  return (
    <>
      <Text onClick={onOpen}>Change password</Text>
      <Modal isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmitHandler)}>
          <ModalHeader>
            <Text textAlign="center" fontWeight="bold">
              Change Password
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex rowGap="lg" direction="column">
              <GraduateInput
                error={errors.currentPassword}
                formLabel="Current Password"
                type="password"
                id="currentPassword"
                placeholder="Current Password"
                {...register("currentPassword", {
                  required: "Current password is required",
                })}
              />
              <GraduateInput
                error={errors.newPassword}
                formLabel="New Password"
                type="password"
                id="newPassword"
                placeholder="New Password"
                {...register("newPassword", {
                  onBlur: () => trigger("newPasswordConfirm"),
                  validate: (pass) =>
                    isStrongPassword(pass) ||
                    "A password should be at least 8 characters with digits and letters.",
                  required: "New Password is required",
                })}
              />
              <GraduateInput
                error={errors.newPasswordConfirm}
                formLabel="Confirm New Password"
                type="password"
                id="newPasswordConfirm"
                placeholder="Confirm Password"
                {...register("newPasswordConfirm", {
                  validate: (confirmPass) =>
                    confirmPass === password || "Passwords do not match!",
                  required: "Confirm password is required",
                })}
              />
            </Flex>
          </ModalBody>

          <ModalFooter justifyContent="center">
            <Flex columnGap="sm">
              <Button
                variant="solidWhite"
                size="md"
                borderRadius="lg"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                size="md"
                borderRadius="lg"
                type="submit"
                isLoading={isSubmitting}
                isDisabled={Object.keys(errors).length > 0}
              >
                Save
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
