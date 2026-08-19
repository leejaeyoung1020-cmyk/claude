import { describe, expect, it } from "vitest";
import { defaultFilters, fromQuery, toQuery } from "../lib/searchParams";

describe("searchParams", () => {
  it("기본 필터 객체는 성별 상관없음, 나이대 19-30이다", () => {
    expect(defaultFilters).toEqual({
      gender: null,
      minAge: 19,
      maxAge: 30,
      department: null,
      tagIds: [],
    });
  });

  it("필터 객체를 쿼리로 바꾼 뒤 다시 객체로 바꾸면 원래 값과 같다", () => {
    const filters = {
      gender: "female" as const,
      minAge: 20,
      maxAge: 25,
      department: "컴퓨터공학과",
      tagIds: ["game", "hiking"],
    };

    const query = toQuery(filters);
    const restored = fromQuery(query);

    expect(restored).toEqual(filters);
  });

  it("빈 쿼리는 기본 필터로 복원된다", () => {
    expect(fromQuery({})).toEqual(defaultFilters);
  });
});
