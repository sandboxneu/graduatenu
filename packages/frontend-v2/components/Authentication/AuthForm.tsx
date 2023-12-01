import { Flex, Heading } from "@chakra-ui/react";
import { FormEventHandler, ReactNode } from "react";

type NewType = ReactNode;

interface AuthFormProps {
  onSubmit?: FormEventHandler<HTMLDivElement>;
  headingText: string;
  inputs: ReactNode;
  footer: NewType;
}
export const AuthForm: React.FC<AuthFormProps> = ({
  onSubmit,
  headingText,
  inputs,
  footer,
}) => {
  return (
    <Flex
      as="form"
      onSubmit={onSubmit}
      justifyContent="center"
      alignItems="center"
      height="100%"
      direction="column"
      rowGap="2xl"
      mx="auto"
      w="80%"
      maxW="450px"
    >
      <Heading as="h1" size="xl">
        {headingText}
      </Heading>
      <Flex direction="column" rowGap="md" width="100%">
        {inputs}
      </Flex>
      {footer}
    </Flex>
  );
};
