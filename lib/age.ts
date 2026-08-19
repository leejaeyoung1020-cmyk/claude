/**
 * 출생연도로 나이를 계산한다.
 *
 * DB 에는 birth_year 만 저장하고 나이는 화면에서 계산한다.
 * 나이를 저장하면 해가 바뀔 때 전부 틀린 값이 되기 때문이다.
 *
 * 생일까지는 받지 않으므로 "연도 차이"로만 계산한 근삿값이다.
 * 나이는 자격 요건이 아니라 표시·필터용이므로 이 정도로 충분하다 (SPEC 4.1).
 */
export function ageFromBirthYear(
  birthYear: number,
  currentYear: number = new Date().getFullYear(),
): number {
  return currentYear - birthYear
}

/** 나이 범위를 출생연도 범위로 뒤집는다 (검색 필터에서 쓴다) */
export function birthYearRange(
  minAge: number,
  maxAge: number,
  currentYear: number = new Date().getFullYear(),
): { from: number; to: number } {
  return { from: currentYear - maxAge, to: currentYear - minAge }
}

export const MIN_AGE = 19
export const MAX_AGE = 30
