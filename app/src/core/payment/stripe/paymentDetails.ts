import type { SubscriptionStatus } from '../plans';
import { PaymentPlanId } from '../plans';
import { PrismaClient } from '@prisma/client';

export const updateWorkspaceStripePaymentDetails = async (
  { workspaceStripeId, subscriptionPlan, subscriptionStatus, datePaid, numOfCreditsPurchased }: {
    workspaceStripeId: string;
    subscriptionPlan?: PaymentPlanId;
    subscriptionStatus?: SubscriptionStatus;
    numOfCreditsPurchased?: number;
    datePaid?: Date;
  },
  workspaceDelegate: PrismaClient['workspace']
) => {
  // Get current workspace state to track plan changes
  const currentWorkspace = await workspaceDelegate.findUnique({
    where: { paymentProcessorUserId: workspaceStripeId },
    select: { id: true, subscriptionPlan: true },
  });

  // Update workspace
  const updatedWorkspace = await workspaceDelegate.update({
    where: {
      paymentProcessorUserId: workspaceStripeId
    },
    data: {
      paymentProcessorUserId: workspaceStripeId,
      subscriptionPlan,
      subscriptionStatus,
      datePaid,
      credits: numOfCreditsPurchased !== undefined ? { increment: numOfCreditsPurchased } : undefined,
    },
  });

  // Track subscription history if plan changed
  if (currentWorkspace && subscriptionPlan && currentWorkspace.subscriptionPlan !== subscriptionPlan) {
    try {
      const prisma = workspaceDelegate as any;
      const prismaClient = prisma._prisma || prisma;
      
      await prismaClient.workspaceSubscriptionHistory.create({
        data: {
          workspaceId: currentWorkspace.id,
          fromPlan: currentWorkspace.subscriptionPlan,
          toPlan: subscriptionPlan,
          reason: determineConversionReason(currentWorkspace.subscriptionPlan, subscriptionPlan),
          metadata: {
            subscriptionStatus,
            datePaid,
          },
        },
      });
    } catch (error) {
      console.error('[PaymentDetails] Failed to track subscription history:', error);
      // Don't throw - tracking should not break payment processing
    }
  }

  return updatedWorkspace;
};

function determineConversionReason(fromPlan: string | null, toPlan: string): string {
  if (!fromPlan || fromPlan === 'free') {
    return 'upgrade';
  }
  
  const planOrder = { free: 0, hobby: 1, pro: 2 };
  const fromLevel = planOrder[fromPlan as keyof typeof planOrder] ?? 0;
  const toLevel = planOrder[toPlan as keyof typeof planOrder] ?? 0;
  
  if (toLevel > fromLevel) {
    return 'upgrade';
  } else if (toLevel < fromLevel) {
    return 'downgrade';
  }
  
  return 'plan_change';
}
