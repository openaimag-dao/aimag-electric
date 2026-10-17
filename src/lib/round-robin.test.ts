import { describe, it, expect } from "vitest";
import { roundRobinTake } from "./round-robin";

describe("roundRobinTake", () => {
  it("interleaves across lists instead of draining the first one", () => {
    expect(
      roundRobinTake(
        [
          ["a1", "a2", "a3", "a4"],
          ["b1", "b2"],
        ],
        4
      )
    ).toEqual(["a1", "b1", "a2", "b2"]);
  });
  it("skips exhausted lists and keeps pulling from the rest", () => {
    expect(roundRobinTake([["a1"], ["b1", "b2", "b3"]], 3)).toEqual(["a1", "b1", "b2"]);
  });
  it("returns everything available when total is under the limit", () => {
    expect(roundRobinTake([["a1"], ["b1"]], 10)).toEqual(["a1", "b1"]);
  });
  it("returns [] for no lists or a zero limit", () => {
    expect(roundRobinTake([], 4)).toEqual([]);
    expect(roundRobinTake([["a1"]], 0)).toEqual([]);
  });
});
