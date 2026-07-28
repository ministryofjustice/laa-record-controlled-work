import type {
  CaseListContext,
} from "#/journeys/your-cases/your-cases.types.js";

export const setSelectedOffice =
  () => (context: CaseListContext) => {

    const selectedOffice = {
        displayName: "London Office",
        code: "A123456",
        address: "123 Fake Street",
    }

    context.setData("selectedOffice", selectedOffice);
  };
