import { buildTermOptions, normalizeSectionCode } from "./courseOfferingsUtils";

describe("courseOfferingsUtils", () => {
  test("normalizeSectionCode trims and uppercases values", () => {
    expect(normalizeSectionCode(" a1 ")).toBe("A1");
    expect(normalizeSectionCode("")).toBe("");
  });

  test("buildTermOptions returns season options for a single year", () => {
    const options = buildTermOptions(2025, 1);
    expect(options).toHaveLength(3);
    expect(options[0]).toEqual({ id: "2025-spring", label: "Spring 2025" });
    expect(options[2]).toEqual({ id: "2025-fall", label: "Fall 2025" });
  });

  test("buildTermOptions returns multiple years", () => {
    const options = buildTermOptions(2024, 2);
    expect(options).toHaveLength(6);
    expect(options[3]).toEqual({ id: "2025-spring", label: "Spring 2025" });
  });
});
