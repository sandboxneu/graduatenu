import type { NextPage } from "next";
import {
  Box,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { GraduateButtonLink, GraduatePreAuthHeader } from "../components";

type InfoSectionProps = InfoImageProps & InfoTextProps;

interface InfoImageProps {
  imageSource: string;
  altInfo: string;
}

interface InfoTextProps {
  title: string;
  description: string;
}

const LandingPage: NextPage = () => {
  return (
    <Box>
      <GraduatePreAuthHeader />
      <Banner />
      <Info />
    </Box>
  );
};

const Banner = (): JSX.Element => {
  return (
    <Box
      pt={{ desktop: "5rem", laptop: "3rem", tablet: "2.5rem" }}
      pb={{ desktop: "11rem", laptop: "9rem", tablet: "6.25rem" }}
    >
      <HStack
        spacing={{ desktop: "6.25rem", laptop: "5rem", tablet: "3rem" }}
        justifyContent="center"
      >
        <Image
          boxSize={{ desktop: "34.25rem", laptop: "31.25rem", tablet: "25rem" }}
          src="/husky.svg"
          alt="husky"
        />
        <Flex w="35%" flexDirection="column" alignItems="start">
          <Box>
            <Heading
              fontSize={{ desktop: "7xl", laptop: "6xl", tablet: "5xl" }}
              color="primary.red.main"
              fontWeight="normal"
              lineHeight="1"
              mb="0"
            >
              Graduate
            </Heading>
            <Heading
              fontSize={{ desktop: "8xl", laptop: "7xl", tablet: "6xl" }}
              color="primary.blue.dark.main"
              fontWeight="bold"
              lineHeight="1"
            >
              Your Way
            </Heading>
            <Text
              mt="2xl"
              fontSize={{ desktop: "2xl", laptop: "2xl", tablet: "xl" }}
              color="primary.blue.dark.main"
              lineHeight="1.1"
            >
              Navigate the Northeastern graduation requirements and create a
              personalized plan of study.
            </Text>
          </Box>
          <GraduateButtonLink
            href="/signup"
            mr={{ desktop: "7.5rem", laptop: "6.25rem", tablet: "3.25rem" }}
            mt="2xl"
            variant="solid"
            borderRadius="lg"
            px="3xl"
            py="lg"
          >
            Get Started
          </GraduateButtonLink>
        </Flex>
      </HStack>
    </Box>
  );
};

const Info = (): JSX.Element => {
  const infoSectionData = [
    {
      imageSource: "/landing_start.png",
      altInfo: "Start",
      title: "Start",
      description:
        "Select a major and concentration to get started with a multi-year plan.",
    },
    {
      imageSource: "/landing_personalize.svg",
      altInfo: "Personalize",
      title: "Personalize",
      description:
        "Create multiple plans to experiment with different majors, concentrations, and plans of study. Pick the classes you want. We'll take care of NUPath, prerequisites, and everything in between.",
    },
    {
      imageSource: "/landing_graduate.svg",
      altInfo: "Graduate",
      title: "Graduate",
      description:
        "Build a plan of study that lets you graduate faster, with better classes, and a lot less headaches.",
    },
  ];

  return (
    <Box
      pt={{ desktop: "6rem", laptop: "6.25rem", tablet: "5rem" }}
      pb={{ desktop: "7.75rem", laptop: "8rem", tablet: "6.5rem" }}
      backgroundColor="#F5F6F8"
    >
      <VStack>
        <Heading
          mb={{ desktop: "6rem", laptop: "5rem", tablet: "4rem" }}
          size="2xl"
          color="primary.blue.dark.main"
        >
          How It Works
        </Heading>
        <SimpleGrid columns={3} justifyItems="center" pl="5%" pr="5%">
          {infoSectionData.map((info) => (
            <InfoSection
              key={info.title}
              imageSource={info.imageSource}
              altInfo={info.altInfo}
              title={info.title}
              description={info.description}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

const InfoSection = ({
  imageSource,
  altInfo,
  title,
  description,
}: InfoSectionProps): JSX.Element => {
  return (
    <Flex flexDirection="column" w="55%">
      <InfoImage imageSource={imageSource} altInfo={altInfo} />
      <InfoText title={title} description={description} />
    </Flex>
  );
};

const InfoImage = ({ imageSource, altInfo }: InfoImageProps): JSX.Element => {
  return (
    <Image
      boxSize={{ desktop: "15.5rem", laptop: "12.5rem", tablet: "9.5rem" }}
      pt="5%"
      pb="5%"
      src={imageSource}
      alt={altInfo}
      objectFit="contain"
    />
  );
};

const InfoText = ({ title, description }: InfoTextProps): JSX.Element => {
  return (
    <Box>
      <Heading
        pt="10%"
        fontSize={{ desktop: "3xl", laptop: "2xl", tablet: "xl" }}
        color="primary.blue.dark.main"
        textAlign="center"
      >
        {title}
      </Heading>
      <Text pt="3%" textAlign="center">
        {description}
      </Text>
    </Box>
  );
};

export default LandingPage;
