/**
 * 하루 친구 신청 상한 (SPEC 4.4).
 *
 * 이 상수는 화면에 "오늘 2/5" 처럼 표시하기 위한 것이다.
 * 실제 판정은 DB 함수 send_friend_request() 가 한다.
 * 화면에서 세어서 막으면 두 곳의 숫자가 어긋난다.
 */
export const DAILY_REQUEST_LIMIT = 5

export function remainingRequests(sentToday: number): number {
  if (!Number.isFinite(sentToday) || sentToday < 0) return DAILY_REQUEST_LIMIT
  return Math.max(0, DAILY_REQUEST_LIMIT - Math.floor(sentToday))
}
