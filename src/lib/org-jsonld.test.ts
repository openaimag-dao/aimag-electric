import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd } from "@/lib/org-jsonld";
import { siteConfig } from "@/config/site";

describe("buildOrganizationJsonLd", () => {
  it("publishes a real, absolute logo URL and the site search action", () => {
    const { organization, website } = buildOrganizationJsonLd();

    expect(organization.logo).toBe(`${siteConfig.url}/apple-icon.png`);
    expect(organization["@type"]).toBe("Organization");
    expect(website.potentialAction.target.urlTemplate).toContain(siteConfig.url);
  });

  it("publishes a LocalBusiness entity with the real address and working hours", () => {
    const { localBusiness } = buildOrganizationJsonLd();

    expect(localBusiness["@type"]).toBe("LocalBusiness");
    expect(localBusiness.address.streetAddress).toBe(siteConfig.contacts.address.streetAddress);
    expect(localBusiness.openingHoursSpecification.opens).toBe("09:00");
    expect(localBusiness.openingHoursSpecification.closes).toBe("18:00");
  });
});
