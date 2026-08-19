import { describe, expect, it } from "vitest";
import { remainingRequests } from "../lib/limits";

describe("remainingRequests", () => {
  it("오늘 0건 보냈으면 5건 남는다", () => {
    expect(remainingRequests(0)).toBe(5);
  });

  it("오늘 5건 보냈으면 0건 남는다", () => {
    expect(remainingRequests(5)).toBe(0);
  });

  it("오늘 5건 넘게 보냈어도 음수가 아니라 0건이다", () => {
    expect(remainingRequests(7)).toBe(0);
  });
});
