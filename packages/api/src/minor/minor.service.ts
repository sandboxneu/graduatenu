import { Injectable, Logger } from "@nestjs/common";
import { formatServiceCtx } from "src/utils";
import { MINOR_YEARS, MINORS } from "./minor-collator";
import { Minor, SupportedMinors } from "@graduate/common";

@Injectable()
export class MinorService {
  private readonly logger: Logger = new Logger();
  findByMinorAndYear(minorName: string, catalogYear: number): Minor | null {
    if (!MINOR_YEARS.has(String(catalogYear))) {
      this.logger.debug(
        { message: "Minor year not found", catalogYear },
        MinorService.formatMinorServiceCtx("findByMinorAndYear")
      );
      return null;
    }

    if (!MINORS[catalogYear][minorName]) {
      this.logger.debug(
        { message: "Minor within year not found", minorName, catalogYear },
        MinorService.formatMinorServiceCtx("findByMinorAndYear")
      );
      return null;
    }
    return MINORS[catalogYear][minorName];
  }

  getSupportedMinors(): SupportedMinors {
    //const supportedMinors: SupportedMinors = MINORS;
    //MINOR_YEARS.forEach((year) => {
    //const supportedMinorNames = Object.keys(MINORS[year]);

    //const supportedMinorForYear: SupportedMinorsForYear = {};
    //supportedMinorNames.forEach((name) => {
    ////no concentration for minors???
    ////supportedMinorForYear[minorName] = this.getConcentrationsInfoForMinor(
    ////minorName,
    ////parseInt(year)
    ////);
    //});
    //supportedMinors[year] = supportedMinorForYear;
    //});
    return MINORS;
  }

  private static formatMinorServiceCtx(methodName: string): string {
    return formatServiceCtx(MinorService.name, methodName);
  }
}
