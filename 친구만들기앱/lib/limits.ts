export const DAILY_REQUEST_LIMIT = 5;

export function remainingRequests(sentToday: number): number {
  return Math.max(0, DAILY_REQUEST_LIMIT - sentToday);
}
