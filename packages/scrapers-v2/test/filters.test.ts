import { filterCatalogByTypes } from "../src/filters/filters";
import { CatalogEntryType } from "../src/filters/types";
import { ACCELERATED_DEGREE_PROGRAM, ACCOUNTING_MINOR, AEROSPACE_MINOR, ARCHITECTURE_MINOR, BSCS, BUSINESS, CHEMICAL_ENG, CS_GAME_DEV, CS_HISTORY, CS_MUSIC_WITH_TECH_MAJOR, FINTECH_CONCENTRATION, MEDIA_SCREEN_STUDIES_HISTORY, WOMEN_GENDER_SEXUALITY_MINOR } from "./testUrls";

const inputs = [BSCS, CS_HISTORY, MEDIA_SCREEN_STUDIES_HISTORY, ACCOUNTING_MINOR, ARCHITECTURE_MINOR, FINTECH_CONCENTRATION, AEROSPACE_MINOR, ACCELERATED_DEGREE_PROGRAM, CS_MUSIC_WITH_TECH_MAJOR, WOMEN_GENDER_SEXUALITY_MINOR];
describe("Filters work", () => {
  test("Filtered majors match snapshot", async () => {
    const inputUrls = inputs.map(input => ({ url: input }));
    expect(await filterCatalogByTypes(
      inputUrls, [CatalogEntryType.Minor]
    )).toMatchSnapshot();
  });
});
