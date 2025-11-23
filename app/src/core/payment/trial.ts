import { HttpError } from 'wasp/server';

/**
 * Trial configuration
 */
export const TRIAL_CONFIG = {
  DURATION_DAYS: 14,
  PLAN: 'pro', // Trial gives access to Pro features
};

/**
 * Calculate trial end date
 */
export function calculateTrialEndDate(): Date {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + TRIAL_CONFIG.DURATION_DAYS);
  return endDate;
}

/**
 * Check if trial is active
 */
export function isTrialActive(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return new Date() < trialEndsAt;
}

/**
 * Check if trial is expired
 */
export function isTrialExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return new Date() >= trialEndsAt;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const now = new Date();
  const diff = trialEndsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Coupon validation
 */
export interface Coupon {
  code: string;
  discountPercent: number;
  validUntil: Date | null;
  maxUses: number;
  usedCount: number;
  plans: string[]; // Which plans this coupon applies to
}

// In-memory coupon store (in production, use database)
const COUPONS: Record<string, Coupon> = {
  'LAUNCH50': {
    code: 'LAUNCH50',
    discountPercent: 50,
    validUntil: new Date('2025-12-31'),
    maxUses: 100,
    usedCount: 0,
    plans: ['hobby', 'pro'],
  },
  'FIRSTMONTH': {
    code: 'FIRSTMONTH',
    discountPercent: 30,
    validUntil: null, // No expiration
    maxUses: -1, // Unlimited
    usedCount: 0,
    plans: ['hobby', 'pro'],
  },
};

/**
 * Validate coupon code
 */
export function validateCoupon(code: string, plan: string): Coupon {
  const coupon = COUPONS[code.toUpperCase()];
  
  if (!coupon) {
    throw new HttpError(404, 'Coupon not found');
  }
  
  if (coupon.validUntil && new Date() > coupon.validUntil) {
    throw new HttpError(400, 'Coupon has expired');
  }
  
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    throw new HttpError(400, 'Coupon has reached maximum uses');
  }
  
  if (!coupon.plans.includes(plan)) {
    throw new HttpError(400, `Coupon not valid for ${plan} plan`);
  }
  
  return coupon;
}

/**
 * Apply coupon (increment use count)
 */
export function applyCoupon(code: string): void {
  const coupon = COUPONS[code.toUpperCase()];
  if (coupon && coupon.maxUses > 0) {
    coupon.usedCount++;
  }
}

/**
 * Get effective plan for workspace (considering trial)
 */
export function getEffectivePlan(workspace: any): string {
  // If trial is active, return trial plan (pro)
  if (workspace.trialEndsAt && isTrialActive(workspace.trialEndsAt)) {
    return TRIAL_CONFIG.PLAN;
  }
  
  // Otherwise return actual subscription plan or free
  return workspace.subscriptionPlan || 'free';
}
