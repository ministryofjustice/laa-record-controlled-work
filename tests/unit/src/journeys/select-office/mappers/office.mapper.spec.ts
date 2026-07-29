import { expect } from "chai";

import { mapOffices } from "#/journeys/select-office/mappers/office.mapper.js";
import type { OfficeDto } from "#/journeys/select-office/select-office.types.js";

describe("mapOffices", () => {
  it("maps office fields and joins populated address parts", () => {
    const offices: OfficeDto[] = [
      {
        addressLine1: "1 High Street",
        addressLine2: "Floor 3",
        addressLine3: "",
        addressLine4: "West Wing",
        city: "London",
        postCode: "SW1A 1AA",
        firmOfficeCode: "OFF-123",
        officeName: "Central Office",
      },
    ];

    const result = mapOffices(offices);

    expect(result).to.deep.equal([
      {
        address: "1 High Street, Floor 3, West Wing, London, SW1A 1AA",
        code: "OFF-123",
        officeName: "Central Office",
      },
    ]);
  });

  it("falls back to empty strings when office code or name are missing", () => {
    const offices: OfficeDto[] = [
      {
        addressLine1: "100 Market Road",
      },
    ];

    const result = mapOffices(offices);

    expect(result).to.deep.equal([
      {
        address: "100 Market Road",
        code: "",
        officeName: "",
      },
    ]);
  });
});