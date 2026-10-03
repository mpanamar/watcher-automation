import { describe, expect, it } from "vitest";
import { mapCaseRow } from "../../src/domain/case-mapper";

const fullRow = {
  id: "W-99",
  still: "W-99/still.png",
  still_alt: "Alt text",
  source: "Film (2020)",
  subject: "Actor",
  frame: "00:01:00",
  question: "Which watch?",
  options: [
    { key: "A", label: "One" },
    { key: "B", label: "Two" },
  ],
  answer: "One",
  aliases: ["one"],
  hint: "Pick one",
  title: "Watch One",
  ref: "REF",
  history: "History",
  buy_new: "https://example.com/new",
  buy_used: "https://example.com/used",
};

describe("mapCaseRow", () => {
  it("maps a full snake_case row", () => {
    const mapped = mapCaseRow(fullRow);
    expect(mapped?.id).toBe("W-99");
    expect(mapped?.stillAlt).toBe("Alt text");
    expect(mapped?.buyNew).toBe("https://example.com/new");
    expect(mapped?.options).toHaveLength(2);
  });

  it("returns undefined when answer is missing", () => {
    const { answer: _answer, ...withoutAnswer } = fullRow;
    expect(mapCaseRow(withoutAnswer)).toBeUndefined();
  });

  it("returns undefined when options jsonb is not an array", () => {
    expect(mapCaseRow({ ...fullRow, options: { key: "A" } })).toBeUndefined();
  });

  it("returns undefined when aliases are not strings", () => {
    expect(mapCaseRow({ ...fullRow, aliases: [1, 2] })).toBeUndefined();
  });
});
