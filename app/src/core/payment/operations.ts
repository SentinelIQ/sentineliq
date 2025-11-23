import * as z from 'zod';
import type { GenerateCheckoutSession, GetCustomerPortalUrl, GetStripeInvoices } from 'wasp/server/operations';
import { PaymentPlanId, paymentPlans } from './plans';
import { paymentProcessor } from './paymentProcessor';
import { HttpError } from 'wasp/server';
import { ensureArgsSchemaOrThrowHttpError } from '../../server/validation';
import { stripe } from './stripe/stripeClient';

export type CheckoutSession = {
  sessionUrl: string | null;
  sessionId: string;
};

const generateCheckoutSessionSchema = z.nativeEnum(PaymentPlanId);

type GenerateCheckoutSessionInput = z.infer<typeof generateCheckoutSessionSchema>;

export const generateCheckoutSession: GenerateCheckoutSession<
  GenerateCheckoutSessionInput,
  CheckoutSession
> = async (rawPaymentPlanId, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  const paymentPlanId = ensureArgsSchemaOrThrowHttpError(generateCheckoutSessionSchema, rawPaymentPlanId);
  const userId = context.user.id;
  const userEmail = context.user.email;
  if (!userEmail) {
    // If using the usernameAndPassword Auth method, switch to an Auth method that provides an email.
    throw new HttpError(403, 'User needs an email to make a payment.');
  }

  const paymentPlan = paymentPlans[paymentPlanId];
  const { session } = await paymentProcessor.createCheckoutSession({
    userId,
    userEmail,
    paymentPlan,
    prismaUserDelegate: context.entities.User,
  });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
};

export const getCustomerPortalUrl: GetCustomerPortalUrl<void, string | null> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  return paymentProcessor.fetchCustomerPortalUrl({
    userId: context.user.id,
    prismaUserDelegate: context.entities.User,
  });
};

export type StripeInvoice = Record<string, any> & {
  id: string;
  created: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  number: string | null;
  period_start: number;
  period_end: number;
  subscription: string | null;
};

export const getStripeInvoices: GetStripeInvoices<void, StripeInvoice[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  // Get current workspace
  const currentWorkspace = await context.entities.Workspace.findUnique({
    where: { id: context.user.currentWorkspaceId || '' },
  });

  if (!currentWorkspace) {
    return [];
  }

  const stripeCustomerId = currentWorkspace.paymentProcessorUserId;

  if (!stripeCustomerId) {
    return []; // No payment processor account
  }

  try {
    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 20, // Last 20 invoices
    });

    return invoices.data.map((invoice): StripeInvoice => ({
      id: invoice.id || '',
      created: invoice.created || 0,
      amount_paid: invoice.amount_paid || 0,
      amount_due: invoice.amount_due || 0,
      currency: invoice.currency || 'usd',
      status: invoice.status || 'unknown',
      invoice_pdf: invoice.invoice_pdf || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
      number: invoice.number || null,
      period_start: invoice.period_start || 0,
      period_end: invoice.period_end || 0,
      subscription: (invoice as any).subscription || null,
    }));
  } catch (error: any) {
    console.error('Failed to fetch Stripe invoices:', error);
    throw new HttpError(500, 'Failed to fetch invoice history');
  }
};

/**
 * Admin-only: Get all subscriptions across all workspaces
 */
export const getAllSubscriptions = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const workspaces = await context.entities.Workspace.findMany({
    where: {
      paymentProcessorUserId: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      paymentProcessorUserId: true,
      createdAt: true,
      datePaid: true,
      members: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return workspaces.map((workspace: any) => ({
    ...workspace,
    memberCount: workspace.members.length,
    mrr: workspace.subscriptionPlan === 'free' ? 0 : 
         workspace.subscriptionPlan === 'hobby' ? 9.99 : 
         workspace.subscriptionPlan === 'pro' ? 29.99 : 0,
  }));
};

/**
 * Admin-only: Get payment history across all workspaces
 */
const getPaymentHistorySchema = z.object({
  limit: z.number().positive().optional().default(50),
  workspaceId: z.string().optional(),
});

export const getPaymentHistory = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { limit, workspaceId } = ensureArgsSchemaOrThrowHttpError(getPaymentHistorySchema, rawArgs);

  // Get workspaces with payment processor IDs
  const whereClause: any = {
    paymentProcessorUserId: {
      not: null,
    },
  };

  if (workspaceId) {
    whereClause.id = workspaceId;
  }

  const workspaces = await context.entities.Workspace.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      paymentProcessorUserId: true,
    },
  });

  // Fetch invoices from Stripe for all workspaces
  const allInvoices: any[] = [];

  for (const workspace of workspaces) {
    if (!workspace.paymentProcessorUserId) continue;

    try {
      const invoices = await stripe.invoices.list({
        customer: workspace.paymentProcessorUserId,
        limit: 10,
      });

      for (const invoice of invoices.data) {
        allInvoices.push({
          id: invoice.id,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          amount: invoice.amount_paid / 100, // Convert cents to dollars
          currency: invoice.currency,
          status: invoice.status,
          created: invoice.created,
          invoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
        });
      }
    } catch (error: any) {
      console.error(`Failed to fetch invoices for workspace ${workspace.id}:`, error);
    }
  }

  // Sort by creation date and limit
  return allInvoices
    .sort((a, b) => b.created - a.created)
    .slice(0, limit);
};

/**
 * Admin-only: Process refund for a payment
 */
const processRefundSchema = z.object({
  invoiceId: z.string().nonempty(),
  amount: z.number().positive().optional(), // Optional - full refund if not provided
  reason: z.string().optional(),
});

export const processRefund = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { invoiceId, amount, reason } = ensureArgsSchemaOrThrowHttpError(processRefundSchema, rawArgs);

  try {
    // Get the invoice to find the payment intent
    const invoice: any = await stripe.invoices.retrieve(invoiceId, {
      expand: ['payment_intent'],
    });
    
    // Extract payment intent ID from invoice (handle both string and object)
    let paymentIntentId: string | undefined;
    const pi = invoice.payment_intent;
    if (typeof pi === 'string') {
      paymentIntentId = pi;
    } else if (pi && typeof pi === 'object' && pi.id) {
      paymentIntentId = pi.id;
    }
    
    if (!paymentIntentId) {
      throw new HttpError(400, 'Invoice has no valid payment intent');
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
      reason: reason as any || 'requested_by_customer',
    });

    // Log the refund
    await context.entities.SystemLog.create({
      data: {
        level: 'INFO',
        message: 'Admin processed refund',
        component: 'payment-admin',
        metadata: {
          action: 'ADMIN_PROCESS_REFUND',
          adminId: context.user.id,
          adminEmail: context.user.email,
          invoiceId,
          refundId: refund.id,
          amount: refund.amount / 100,
          currency: refund.currency,
          reason,
        },
      },
    });

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    };
  } catch (error: any) {
    console.error('Failed to process refund:', error);
    throw new HttpError(500, error.message || 'Failed to process refund');
  }
};

/**
 * Admin-only: Override workspace subscription plan
 */
const overrideSubscriptionSchema = z.object({
  workspaceId: z.string().nonempty(),
  newPlan: z.enum(['free', 'hobby', 'pro']),
  reason: z.string().optional(),
});

export const overrideSubscription = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { workspaceId, newPlan, reason } = ensureArgsSchemaOrThrowHttpError(overrideSubscriptionSchema, rawArgs);

  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const previousPlan = workspace.subscriptionPlan;

  // Update the workspace subscription
  const updatedWorkspace = await context.entities.Workspace.update({
    where: { id: workspaceId },
    data: {
      subscriptionPlan: newPlan,
      subscriptionStatus: 'active',
    },
  });

  // Log the override
  await context.entities.SystemLog.create({
    data: {
      level: 'INFO',
      message: 'Admin overrode workspace subscription plan',
      component: 'payment-admin',
      metadata: {
        action: 'ADMIN_OVERRIDE_SUBSCRIPTION',
        adminId: context.user.id,
        adminEmail: context.user.email,
        workspaceId,
        workspaceName: workspace.name,
        previousPlan,
        newPlan,
        reason: reason || 'No reason provided',
      },
    },
  });

  return updatedWorkspace;
};

/**
 * Admin-only: Get failed payments across all workspaces
 */
export const getFailedPayments = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const workspaces = await context.entities.Workspace.findMany({
    where: {
      paymentProcessorUserId: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      paymentProcessorUserId: true,
      subscriptionStatus: true,
    },
  });

  const failedPayments: any[] = [];

  for (const workspace of workspaces) {
    if (!workspace.paymentProcessorUserId) continue;

    try {
      // Get failed invoices from Stripe
      const invoices = await stripe.invoices.list({
        customer: workspace.paymentProcessorUserId,
        status: 'open', // Failed/unpaid invoices
        limit: 5,
      });

      for (const invoice of invoices.data) {
        if (invoice.attempt_count && invoice.attempt_count > 0) {
          failedPayments.push({
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            invoiceId: invoice.id,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            attemptCount: invoice.attempt_count,
            nextAttempt: invoice.next_payment_attempt,
            dueDate: invoice.due_date,
            created: invoice.created,
            invoiceUrl: invoice.hosted_invoice_url,
          });
        }
      }
    } catch (error: any) {
      console.error(`Failed to fetch failed payments for workspace ${workspace.id}:`, error);
    }
  }

  return failedPayments.sort((a, b) => b.created - a.created);
};
