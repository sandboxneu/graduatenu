import {
  Major2,
  SupportedMajorsForYear,
  SupportedMajors,
  SupportedConcentrations,
  UNDECIDED_STRING,
} from "@graduate/common";
import { Injectable, Logger } from "@nestjs/common";
import { formatServiceCtx } from "../utils";
import { MAJOR_YEARS, MAJORS } from "./major-collator";

@Injectable()
export class MajorService {
  private readonly logger: Logger = new Logger();

  findByMajorAndYear(majorName: string, catalogYear: number): Major2 | null {
    if (!MAJOR_YEARS.has(String(catalogYear))) {
      this.logger.debug(
        { mesage: "Major year not found", catalogYear },
        MajorService.formatMajorServiceCtx("findByMajorAndYear")
      );
      return null;
    }

    if (!MAJORS[catalogYear][majorName]) {
      this.logger.debug(
        { mesage: "Major within year not found", majorName, catalogYear },
        MajorService.formatMajorServiceCtx("findByMajorAndYear")
      );
      return null;
    }

    return MAJORS[catalogYear][majorName];
  }

  getSupportedMajors(): SupportedMajors {
    const supportedMajors: SupportedMajors = {};
    MAJOR_YEARS.forEach((year) => {
      const supportedMajorNames = Object.keys(MAJORS[year]);

      const supportedMajorForYear: SupportedMajorsForYear = {};
      supportedMajorNames.forEach((majorName) => {
        const supportedConcentrations = this.getConcentrationsInfoForMajor(
          majorName,
          parseInt(year)
        );
        supportedMajorForYear[majorName] = supportedConcentrations;
      });

      supportedMajors[year] = supportedMajorForYear;
    });

    return supportedMajors;
  }

  getConcentrationsInfoForMajor(
    majorName: string,
    catalogYear: number
  ): SupportedConcentrations | null {
    const major = this.findByMajorAndYear(majorName, catalogYear);
    if (!major) {
      return null;
    }

    const concentrations =
      major.concentrations?.concentrationOptions.map(
        (concentration) => concentration.title
      ) ?? [];

    return {
      concentrations,
      minRequiredConcentrations: major.concentrations?.minOptions ?? 0,
      verified: major.metadata?.verified ?? false,
    };
  }

  isValidConcentrationForMajor(
    majorName: string,
    catalogYear: number,
    concentrationName: string
  ): boolean {
    const concentrationsInfo = this.getConcentrationsInfoForMajor(
      majorName,
      catalogYear
    );

    if (!concentrationsInfo) {
      this.logger.debug(
        {
          message: "Concentration info for major not found.",
          majorName,
          catalogYear,
          concentrationName,
        },
        MajorService.formatMajorServiceCtx("isValidConcentrationForMajor")
      );

      return false;
    }

    const { concentrations, minRequiredConcentrations } = concentrationsInfo;

    // major doesn't have any concentrations
    if (concentrations.length === 0) {
      return concentrationName === "";
    }

    if (minRequiredConcentrations > 0 && !concentrationName) {
      this.logger.debug(
        {
          message:
            "Concentration not provided for major with a required concentration.",
          majorName,
          catalogYear,
          concentrationName,
          minRequiredConcentrations,
        },
        MajorService.formatMajorServiceCtx("isValidConcentrationForMajor")
      );

      return false;
    }

    const isValidConcentrationName =
      concentrations.includes(concentrationName) ||
      concentrationName === UNDECIDED_STRING;

    if (!isValidConcentrationName) {
      this.logger.debug(
        {
          message: "Invalid concentration name for major.",
          majorName,
          catalogYear,
          concentrationName,
        },
        MajorService.formatMajorServiceCtx("isValidConcentrationForMajor")
      );
      return false;
    }
    return true;
  }

  isValidCatalogueYear(
    majorName: string,
    catalogYear: number,
    concentrationName: string
  ): boolean {
    const majorsByCatalogue = this.findByMajorAndYear(majorName, catalogYear);

    if (!majorsByCatalogue) {
      this.logger.debug(
        {
          message: "Invalid catalogue year for major",
          majorName,
          catalogYear,
          concentrationName,
        },
        MajorService.formatMajorServiceCtx("isValidCatalogueYear")
      );
      return false;
    }
    return true;
  }

  private static formatMajorServiceCtx(methodName: string) {
    return formatServiceCtx(MajorService.name, methodName);
  }
}
