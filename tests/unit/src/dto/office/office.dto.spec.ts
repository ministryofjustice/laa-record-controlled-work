import { expect } from "chai";

import { OfficeDto } from "#/dto/office/office.dto.js";
import { getGetAllProviderOfficesResponseMock } from "../../../../mocks/api/pda/fakers/provider-firms-endpoints/provider-firms-endpoints.faker.gen.js";

describe("OfficeDto", () => {
  const mockResponse = getGetAllProviderOfficesResponseMock();
  const office = mockResponse.offices[0];
  const officeList = mockResponse;

  describe("fromPdaOffice", () => {
    it("maps address parts into a comma-separated string", () => {
      const result = OfficeDto.fromPdaOffice(office);

      const expectedParts = [
        office.addressLine1,
        office.addressLine2,
        office.addressLine3,
        office.addressLine4,
        office.city,
        office.postCode,
      ].filter(Boolean);

      expect(result.address).to.equal(expectedParts.join(", "));
    });

    it("maps office code", () => {
      const result = OfficeDto.fromPdaOffice(office);

      expect(result.code).to.equal(office.firmOfficeCode);
    });

    it("sets firmName", () => {
      const result = OfficeDto.fromPdaOffice(office, "Test Firm");

      expect(result.firmName).to.equal("Test Firm");
    });

    it("leaves firmName undefined when not provided", () => {
      const result = OfficeDto.fromPdaOffice(office);

      expect(result.firmName).to.be.undefined;
    });
  });

  describe("mapOffices", () => {
    it("returns a mapped office for each office in the response", () => {
      const result = OfficeDto.mapOffices(officeList);

      expect(result).to.have.length(officeList.offices.length);

      officeList.offices.forEach((sourceOffice, i) => {
        const expectedParts = [
          sourceOffice.addressLine1,
          sourceOffice.addressLine2,
          sourceOffice.addressLine3,
          sourceOffice.addressLine4,
          sourceOffice.city,
          sourceOffice.postCode,
        ].filter(Boolean);

        expect(result[i].address).to.equal(expectedParts.join(", "));
        expect(result[i].code).to.equal(sourceOffice.firmOfficeCode);
        expect(result[i].firmName).to.equal(officeList.firm.firmName);
      });
    });

    it("returns empty array when offices is null", () => {
      const result = OfficeDto.mapOffices({ ...officeList, offices: null });

      expect(result).to.deep.equal([]);
    });

    it("returns empty array when offices is undefined", () => {
      const result = OfficeDto.mapOffices({ ...officeList, offices: undefined });

      expect(result).to.deep.equal([]);
    });
  });
});
