export const CREDIT_COSTS = {
  image: 4,
  videoSecond: 10,
} as const;

export const PLAN_CREDIT_ALLOWANCES = {
  free: 10,
  starter: 250,
  growth: 500,
  pro: 2000,
} as const;

export type CreditPlan = keyof typeof PLAN_CREDIT_ALLOWANCES;

export function getVideoCreditCost(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error("Video duration must be a positive number of seconds.");
  }

  return Math.ceil(seconds) * CREDIT_COSTS.videoSecond;
}
