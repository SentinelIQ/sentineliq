import { type MiddlewareConfigFn, HttpError } from 'wasp/server';
import { type PaymentsWebhook } from 'wasp/server/api';
import { type PrismaClient } from '@prisma/client';
import express from 'express';
import type { Stripe } from 'stripe';
import { stripe } from './stripeClient';
import { paymentPlans, PaymentPlanId, SubscriptionStatus, type PaymentPlanEffect } from '../plans';
import { updateWorkspaceStripePaymentDetails } from './paymentDetails';
import { emailSender } from 'wasp/server/email';
import { assertUnreachable } from '../../../shared/utils';
import { requireNodeEnvVar } from '../../../server/utils';
import { reevaluateWorkspaceFeatures } from '../planLimits';
import {
  parseWebhookPayload,
  type InvoicePaidData,
  type SessionCompletedData,
  type SubscriptionDeletedData,
  type SubscriptionUpdatedData,
} from './webhookPayload';
import { UnhandledWebhookEventError } from '../errors';
import { workspaceEventBus } from '../../audit/auditBus';
import { sendEmail, EmailTemplate } from '../../email';

export const stripeWebhook: PaymentsWebhook = async (request, response, context) => {
  try {
    const rawStripeEvent = constructStripeEvent(request);
    const { eventName, data } = await parseWebhookPayload(rawStripeEvent);
    const prismaWorkspaceDelegate = context.entities.Workspace;
    switch (eventName) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data, prismaWorkspaceDelegate);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(data, prismaWorkspaceDelegate);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(data, prismaWorkspaceDelegate);
        break;
      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(data, prismaWorkspaceDelegate);
        break;
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(data, prismaWorkspaceDelegate);
        break;
      default:
        // If you'd like to handle more events, you can add more cases above.
        // When deploying your app, you configure your webhook in the Stripe dashboard to only send the events that you're
        // handling above and that are necessary for the functioning of your app. See: https://docs.opensaas.sh/guides/deploying/#setting-up-your-stripe-webhook
        // In development, it is likely that you will receive other events that you are not handling, and that's fine. These can be ignored without any issues.
        assertUnreachable(eventName);
    }
    return response.json({ received: true }); // Stripe expects a 200 response to acknowledge receipt of the webhook
  } catch (err) {
    if (err instanceof UnhandledWebhookEventError) {
      console.error(err.message);
      return response.status(422).json({ error: err.message });
    }

    console.error('Webhook error:', err);
    if (err instanceof HttpError) {
      return response.status(err.statusCode).json({ error: err.message });
    } else {
      return response.status(400).json({ error: 'Error processing Stripe webhook event' });
    }
  }
};

function constructStripeEvent(request: express.Request): Stripe.Event {
  try {
    const secret = requireNodeEnvVar('STRIPE_WEBHOOK_SECRET');
    const sig = request.headers['stripe-signature'];
    if (!sig) {
      throw new HttpError(400, 'Stripe webhook signature not provided');
    }
    return stripe.webhooks.constructEvent(request.body, sig, secret);
  } catch (err) {
    throw new HttpError(500, 'Error constructing Stripe webhook event');
  }
}

export const stripeMiddlewareConfigFn: MiddlewareConfigFn = (middlewareConfig) => {
  // We need to delete the default 'express.json' middleware and replace it with 'express.raw' middleware
  // because webhook data in the body of the request as raw JSON, not as JSON in the body of the request.
  middlewareConfig.delete('express.json');
  middlewareConfig.set('express.raw', express.raw({ type: 'application/json' }));
  return middlewareConfig;
};

// Here we only update the user's payment details, and confirm credits because Stripe does not send invoices for one-time payments.
// NOTE: If you're accepting async payment methods like bank transfers or SEPA and not just card payments
// which are synchronous, checkout session completed could potentially result in a pending payment.
// If so, use the checkout.session.async_payment_succeeded event to confirm the payment.
async function handleCheckoutSessionCompleted(
  session: SessionCompletedData,
  prismaWorkspaceDelegate: PrismaClient['workspace']
) {
  const isSuccessfulOneTimePayment = session.mode === 'payment' && session.payment_status === 'paid';
  if (isSuccessfulOneTimePayment) {
    await saveSuccessfulOneTimePayment(session, prismaWorkspaceDelegate);
  }
}

async function saveSuccessfulOneTimePayment(
  session: SessionCompletedData,
  prismaWorkspaceDelegate: PrismaClient['workspace']
) {
  const workspaceStripeId = session.customer;
  const lineItems = await getCheckoutLineItemsBySessionId(session.id);
  const lineItemPriceId = extractPriceId(lineItems);
  const planId = getPlanIdByPriceId(lineItemPriceId);
  const plan = paymentPlans[planId];
  const { numOfCreditsPurchased } = getPlanEffectPaymentDetails({ planId, planEffect: plan.effect });
  return updateWorkspaceStripePaymentDetails(
    { workspaceStripeId, numOfCreditsPurchased, datePaid: new Date() },
    prismaWorkspaceDelegate
  );
}

// This is called when a subscription is successfully purchased or renewed and payment succeeds.
// Invoices are not created for one-time payments, so we handle them above.
async function handleInvoicePaid(invoice: InvoicePaidData, prismaWorkspaceDelegate: PrismaClient['workspace']) {
  await saveActiveSubscription(invoice, prismaWorkspaceDelegate);
}

async function saveActiveSubscription(invoice: InvoicePaidData, prismaWorkspaceDelegate: PrismaClient['workspace']) {
  const workspaceStripeId = invoice.customer;
  const datePaid = new Date(invoice.period_start * 1000);
  const priceId = extractPriceId(invoice.lines);
  const subscriptionPlan = getPlanIdByPriceId(priceId);
  
  const workspace = await updateWorkspaceStripePaymentDetails(
    { workspaceStripeId, datePaid, subscriptionPlan, subscriptionStatus: SubscriptionStatus.Active },
    prismaWorkspaceDelegate
  );

  // ✅ Emit event for audit log and notifications
  try {
    await workspaceEventBus.emit({
      workspaceId: workspace.id,
      eventType: 'payment_succeeded',
      data: {
        subscriptionPlan,
        datePaid: datePaid.toISOString(),
      },
      audit: {
        action: 'PAYMENT_SUCCEEDED',
        resource: 'payment',
        resourceId: invoice.id,
        description: `Payment successful for ${subscriptionPlan} plan`,
        metadata: {
          subscriptionPlan,
          datePaid: datePaid.toISOString(),
          invoiceId: invoice.id,
        },
      },
      notificationData: {
        type: 'SUCCESS',
        title: 'Payment Successful',
        message: `Your ${subscriptionPlan} subscription has been renewed successfully`,
        link: `/workspace/settings`,
      },
    });
  } catch (error) {
    console.error('Failed to emit payment event:', error);
  }

  return workspace;
}

// ✅ Handle failed payment attempts
async function handleInvoicePaymentFailed(invoice: InvoicePaidData, prismaWorkspaceDelegate: PrismaClient['workspace']) {
  const workspaceStripeId = invoice.customer;
  
  try {
    const workspace = await prismaWorkspaceDelegate.findUnique({
      where: { paymentProcessorUserId: workspaceStripeId },
      include: { owner: true },
    });

    if (!workspace) {
      console.error(`Workspace not found for Stripe customer: ${workspaceStripeId}`);
      return;
    }

    // Update subscription status to past_due
    await updateWorkspaceStripePaymentDetails(
      { workspaceStripeId, subscriptionStatus: SubscriptionStatus.PastDue },
      prismaWorkspaceDelegate
    );

    // Send notification email to workspace owner with workspace branding
    if (workspace.owner?.email) {
      const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';
      
      await sendEmail(
        workspace.owner.email,
        EmailTemplate.PAYMENT_FAILED,
        {
          userName: workspace.owner.email,
          planName: workspace.subscriptionPlan || 'subscription',
          amount: '0.00', // Invoice amount not available in webhook data
          currency: 'USD',
          failureReason: 'Your payment method was declined',
          retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          updatePaymentUrl: `${baseUrl}/workspace/settings`,
        },
        {
          branding: {
            logoUrl: workspace.logoUrl || undefined,
            primaryColor: workspace.primaryColor || undefined,
            secondaryColor: workspace.secondaryColor || undefined,
            companyName: workspace.name,
            companyUrl: baseUrl,
          },
        }
      );
    }

    // ✅ Emit event for audit log and notifications
    await workspaceEventBus.emit({
      workspaceId: workspace.id,
      eventType: 'payment_failed',
      data: {
        invoiceId: invoice.id,
        attemptedDate: new Date(invoice.period_start * 1000).toISOString(),
      },
      audit: {
        action: 'PAYMENT_FAILED',
        resource: 'payment',
        resourceId: invoice.id,
        description: `Payment failed for ${workspace.subscriptionPlan} subscription`,
        metadata: {
          invoiceId: invoice.id,
          subscriptionPlan: workspace.subscriptionPlan,
        },
      },
      notificationData: {
        type: 'ERROR',
        title: 'Payment Failed',
        message: `We were unable to process your payment. Please update your payment method.`,
        link: `/workspace/settings`,
      },
    });
  } catch (error) {
    console.error('Failed to handle payment failure:', error);
  }
}

async function handleCustomerSubscriptionUpdated(
  subscription: SubscriptionUpdatedData,
  prismaWorkspaceDelegate: PrismaClient['workspace']
) {
  const workspaceStripeId = subscription.customer;
  let subscriptionStatus: SubscriptionStatus | undefined;
  const priceId = extractPriceId(subscription.items);
  const subscriptionPlan = getPlanIdByPriceId(priceId);

  // There are other subscription statuses, such as `trialing` that we are not handling and simply ignore
  // If you'd like to handle more statuses, you can add more cases above. Make sure to update the `SubscriptionStatus` type in `payment/plans.ts` as well.
  if (subscription.status === SubscriptionStatus.Active) {
    subscriptionStatus = subscription.cancel_at_period_end
      ? SubscriptionStatus.CancelAtPeriodEnd
      : SubscriptionStatus.Active;
  } else if (subscription.status === SubscriptionStatus.PastDue) {
    subscriptionStatus = SubscriptionStatus.PastDue;
  }
  if (subscriptionStatus) {
    const workspace = await updateWorkspaceStripePaymentDetails(
      { workspaceStripeId, subscriptionPlan, subscriptionStatus },
      prismaWorkspaceDelegate
    );
    
    // 🚀 RE-EVALUATE ALL FEATURES after subscription change
    try {
      const featureResult = await reevaluateWorkspaceFeatures(
        { entities: { Workspace: prismaWorkspaceDelegate } },
        workspace.id
      );
      
      console.log(`Feature re-evaluation for workspace ${workspace.id}:`, {
        newPlan: subscriptionPlan,
        newlyEnabled: featureResult.newlyEnabled.length,
        newlyDisabled: featureResult.newlyDisabled.length,
        totalFeatures: featureResult.totalFeatures
      });
      
      // Emit event if significant feature changes occurred
      if (featureResult.newlyEnabled.length > 0 || featureResult.newlyDisabled.length > 0) {
        await workspaceEventBus.emit({
          workspaceId: workspace.id,
          eventType: 'feature_reevaluation',
          data: {
            subscriptionPlan,
            featuresChanged: {
              enabled: featureResult.newlyEnabled,
              disabled: featureResult.newlyDisabled,
            },
          },
          audit: {
            action: 'FEATURES_UPDATED',
            resource: 'workspace',
            resourceId: workspace.id,
            description: `Feature access updated due to subscription change to ${subscriptionPlan}`,
            metadata: {
              newlyEnabled: featureResult.newlyEnabled,
              newlyDisabled: featureResult.newlyDisabled,
              totalFeatures: featureResult.totalFeatures,
            },
          },
        });
      }
    } catch (featureError) {
      console.error('Failed to re-evaluate features after subscription change:', featureError);
      // Don't fail the whole webhook - subscription update is more critical
    }
    
    // ✅ Send notification email to workspace owner when subscription is cancelled with workspace branding
    if (subscription.cancel_at_period_end) {
      try {
        const owner = await prismaWorkspaceDelegate.findUnique({ 
          where: { id: workspace.id }, 
          include: { owner: true } 
        });
        
        if (owner?.owner.email) {
          const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';
          
          await sendEmail(
            owner.owner.email,
            EmailTemplate.SUBSCRIPTION_CANCELLED,
            {
              userName: owner.owner.email,
              planName: subscriptionPlan || 'subscription',
              cancellationDate: 'the end of your billing period',
              reason: 'You requested cancellation',
              reactivateUrl: `${baseUrl}/workspace/settings`,
            },
            {
              branding: {
                logoUrl: workspace.logoUrl || undefined,
                primaryColor: workspace.primaryColor || undefined,
                secondaryColor: workspace.secondaryColor || undefined,
                companyName: workspace.name,
                companyUrl: baseUrl,
              },
            }
          );
        }

        // ✅ Emit event for audit log
        await workspaceEventBus.emit({
          workspaceId: workspace.id,
          eventType: 'subscription_cancelled',
          data: {
            subscriptionPlan,
            cancelAtPeriodEnd: true,
          },
          audit: {
            action: 'SUBSCRIPTION_CANCELLED',
            resource: 'payment',
            resourceId: workspace.id,
            description: `Subscription for ${subscriptionPlan} plan will be cancelled at period end`,
            metadata: {
              subscriptionPlan,
              cancelAtPeriodEnd: true,
              workspaceStripeId,
            },
          },
          notificationData: {
            type: 'WARNING',
            title: 'Subscription Cancelled',
            message: `Your ${subscriptionPlan} subscription will be cancelled at the end of the billing period`,
            link: `/workspace/settings`,
          },
        });
      } catch (error) {
        console.error('Failed to send subscription cancellation email:', error);
      }
    }
    return workspace;
  }
}

async function handleCustomerSubscriptionDeleted(
  subscription: SubscriptionDeletedData,
  prismaWorkspaceDelegate: PrismaClient['workspace']
) {
  const workspaceStripeId = subscription.customer;
  const workspace = await updateWorkspaceStripePaymentDetails(
    { workspaceStripeId, subscriptionStatus: SubscriptionStatus.Deleted },
    prismaWorkspaceDelegate
  );
  
  // 🚀 RE-EVALUATE ALL FEATURES after subscription deletion (downgrade to free)
  try {
    const featureResult = await reevaluateWorkspaceFeatures(
      { entities: { Workspace: prismaWorkspaceDelegate } },
      workspace.id
    );
    
    console.log(`Feature re-evaluation after subscription deletion for workspace ${workspace.id}:`, {
      newlyDisabled: featureResult.newlyDisabled.length,
      remainingEnabled: featureResult.newlyEnabled.length,
      totalFeatures: featureResult.totalFeatures
    });
    
    // Always emit event for subscription deletion
    await workspaceEventBus.emit({
      workspaceId: workspace.id,
      eventType: 'subscription_deleted',
      data: {
        previousPlan: workspace.subscriptionPlan,
        featuresLost: featureResult.newlyDisabled,
      },
      audit: {
        action: 'SUBSCRIPTION_DELETED',
        resource: 'workspace',
        resourceId: workspace.id,
        description: `Subscription deleted, workspace downgraded to free plan`,
        metadata: {
          featuresLost: featureResult.newlyDisabled,
          totalFeatures: featureResult.totalFeatures,
        },
      },
      notificationData: {
        type: 'WARNING',
        title: 'Subscription Deleted',
        message: `Your workspace has been downgraded to the free plan. Some features are no longer available.`,
        link: `/workspace/settings`,
      },
    });
  } catch (featureError) {
    console.error('Failed to re-evaluate features after subscription deletion:', featureError);
  }
  
  return workspace;
}

// We only expect one line item, but if you set up a product with multiple prices, you should change this function to handle them.
function extractPriceId(
  items: Stripe.ApiList<Stripe.LineItem> | SubscriptionUpdatedData['items'] | InvoicePaidData['lines']
): string {
  if (items.data.length === 0) {
    throw new HttpError(400, 'No items in stripe event object');
  }
  if (items.data.length > 1) {
    throw new HttpError(400, 'More than one item in stripe event object');
  }
  const item = items.data[0];

  // The 'price' property is found on SubscriptionItem and LineItem.
  if ('price' in item && item.price?.id) {
    return item.price.id;
  }

  // The 'pricing' property is found on InvoiceLineItem.
  if ('pricing' in item) {
    const priceId = item.pricing?.price_details?.price;
    if (priceId) {
      return priceId;
    }
  }
  throw new HttpError(400, 'Unable to extract price id from item');
}

async function getCheckoutLineItemsBySessionId(sessionId: string) {
  const { line_items } = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  });
  if (!line_items) {
    throw new HttpError(400, 'No line items found in checkout session');
  }
  return line_items;
}

function getPlanIdByPriceId(priceId: string): PaymentPlanId {
  const planId = Object.values(PaymentPlanId).find(
    (planId) => paymentPlans[planId].getPaymentProcessorPlanId() === priceId
  );
  if (!planId) {
    throw new Error(`No plan with Stripe price id ${priceId}`);
  }
  return planId;
}

function getPlanEffectPaymentDetails({
  planId,
  planEffect,
}: {
  planId: PaymentPlanId;
  planEffect: PaymentPlanEffect;
}): {
  subscriptionPlan: PaymentPlanId | undefined;
  numOfCreditsPurchased: number | undefined;
} {
  switch (planEffect.kind) {
    case 'subscription':
      return { subscriptionPlan: planId, numOfCreditsPurchased: undefined };
    case 'credits':
      return { subscriptionPlan: undefined, numOfCreditsPurchased: planEffect.amount };
    default:
      assertUnreachable(planEffect);
  }
}
