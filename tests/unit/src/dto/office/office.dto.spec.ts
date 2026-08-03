import { expect } from "chai";

import { Office } from "#/dto/office/office.dto.js";
import { getGetAllProviderOfficesResponseMock } from "../../../../mocks/api/pda/fakers/provider-firms-endpoints/provider-firms-endpoints.faker.gen.js";

describe("Office", () => {
  const mockResponse = getGetAllProviderOfficesResponseMock();
  const office = mockResponse.offices[0];
  const officeList = mockResponse;

  describe("fromPdaOffice", () => {
    it("maps address parts into a comma-separated string", () => {
      const result = Office.fromPdaOffice(office);

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
      const result = Office.fromPdaOffice(office);

      expect(result.code).to.equal(office.firmOfficeCode);
    });

    it("sets firmName", () => {
      const result = Office.fromPdaOffice(office, "Test Firm");

      expect(result.firmName).to.equal("Test Firm");
    });

    it("leaves firmName undefined when not provided", () => {
      const result = Office.fromPdaOffice(office);

      expect(result.firmName).to.be.undefined;
    });
  });

  describe("fromPdaOfficeList", () => {
    it("returns a mapped office for each office in the response", () => {
      const result = Office.fromPdaOfficeList(officeList);

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
      const result = Office.fromPdaOfficeList({ ...officeList, offices: null });

      expect(result).to.deep.equal([]);
    });

    it("returns empty array when offices is undefined", () => {
      const result = Office.fromPdaOfficeList({
        ...officeList,
        offices: undefined,
      });

      expect(result).to.deep.equal([]);
    });
  });
});
