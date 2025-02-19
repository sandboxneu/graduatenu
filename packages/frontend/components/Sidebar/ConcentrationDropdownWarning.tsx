import React from "react";
import { InfoIcon } from "@chakra-ui/icons";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Text,
} from "@chakra-ui/react";

const ConcentrationDropdownWarning = () => {
  return (
    <Accordion pb="sm" allowToggle>
      <AccordionItem
        borderRadius="lg"
        backgroundColor="red.100"
        border="1px #e63433 solid"
      >
        <AccordionButton>
          <InfoIcon mr="xs" color="red.400" />
          <Text fontWeight="semibold" textAlign="left" fontSize="md" flex="1">
            Missing Concentration!
          </Text>
          <AccordionIcon color="red.400" />
        </AccordionButton>
        <AccordionPanel>
          <Text fontSize="sm">
            A concentration is required for this major. Go to &apos;Edit
            plan&apos; and select your desired concentration from the drop-down
            menu.
          </Text>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

export default ConcentrationDropdownWarning;
