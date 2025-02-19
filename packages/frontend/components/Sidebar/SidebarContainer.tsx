import { Box, Flex, Badge, Heading, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { BETA_MAJOR_TOOLTIP_MSG } from "../../utils";
import { HelperToolTip } from "../Help";
import { DraggableScheduleCourse } from "../ScheduleCourse";
import DropdownWarning from "./DropdownWarning";
import ConcentrationDropdownWarning from "./ConcentrationDropdownWarning";
import { COOP_BLOCK } from "./Sidebar";
import { SandboxArea } from "./SandboxArea";
import { UNDECIDED_CONCENTRATION } from "@graduate/common";

interface SidebarContainerProps {
  title: string;
  subtitle?: string;
  creditsTaken?: number;
  creditsToTake?: number;
  renderCoopBlock?: boolean;
  renderBetaMajorBlock?: boolean;
  renderDropdownWarning?: boolean;
  planId?: string | number;
}

const SidebarContainer: React.FC<PropsWithChildren<SidebarContainerProps>> = ({
  title,
  subtitle,
  creditsTaken,
  creditsToTake,
  renderCoopBlock,
  renderBetaMajorBlock,
  renderDropdownWarning = true,
  planId,
  children,
}) => {
  return (
    <Box pt="xl" borderRight="1px" borderRightColor="neutral.200" minH="100%">
      <Box px="md" pb="md">
        <Box pb="sm">
          {renderBetaMajorBlock && (
            <Flex alignItems="center" pb="sm">
              <Badge
                borderColor="red"
                borderWidth="1px"
                variant="outline"
                colorScheme="red"
                fontWeight="bold"
                fontSize="sm"
                borderRadius="md"
                mr="sm"
              >
                BETA MAJOR
              </Badge>
              <HelperToolTip label={BETA_MAJOR_TOOLTIP_MSG} />
            </Flex>
          )}
          <Flex alignItems="center" columnGap="2xs">
            <Heading
              as="h1"
              fontSize="2xl"
              color="primary.blue.dark.main"
              fontWeight="bold"
            >
              {title}
            </Heading>
          </Flex>
          {subtitle && (
            <Text
              fontSize="sm"
              color={
                subtitle === UNDECIDED_CONCENTRATION
                  ? "red.500"
                  : "primary.blue.dark.main"
              }
              fontStyle={
                subtitle === UNDECIDED_CONCENTRATION ? "italic" : "normal"
              }
            >
              {subtitle}
            </Text>
          )}
        </Box>
        {subtitle === "Concentration Undecided" && (
          <ConcentrationDropdownWarning />
        )}
        {renderDropdownWarning && <DropdownWarning />}
        {creditsTaken !== undefined && (
          <Flex mb="sm" alignItems="baseline" columnGap="xs">
            <Text
              fontSize="2xl"
              color="primary.blue.dark.main"
              fontWeight="bold"
            >
              {creditsTaken}
              {creditsToTake !== undefined && `/${creditsToTake}`}
            </Text>
            <Text color="primary.blue.dark.main">Credits Completed</Text>
          </Flex>
        )}
        {renderCoopBlock && (
          <DraggableScheduleCourse
            scheduleCourse={COOP_BLOCK}
            isDisabled={false}
          />
        )}
      </Box>

      {children}

      {planId && <SandboxArea planId={planId} />}
    </Box>
  );
};
export default SidebarContainer;
