import type { CaseListContext } from "#/journeys/your-cases/your-cases.types.js";

export const setSelectedOffice = () => (context: CaseListContext) => {
  const selectedOffice = {
    address: "123 Fake Street",
    code: "A123456",
    displayName: "London Office",
  };

  context.setData("selectedOffice", selectedOffice);
};
