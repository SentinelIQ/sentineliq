import { type DailyStats } from 'wasp/entities';
import { type DailyStatsJob } from 'wasp/server/jobs';
import Stripe from 'stripe';
import { stripe } from '../payment/stripe/stripeClient';
import { getDailyPageViews, getSources } from './providers/plausibleAnalyticsUtils';
// import { getDailyPageViews, getSources } from './providers/googleAnalyticsUtils';
import { paymentProcessor } from '../payment/paymentProcessor';
import { SubscriptionStatus } from '../payment/plans';

export type DailyStatsProps = { dailyStats?: DailyStats; weeklyStats?: DailyStats[]; isLoading?: boolean };

export const calculateDailyStats: DailyStatsJob<never, void> = async (_args, context) => {
  const nowUTC = new Date(Date.now());
  nowUTC.setUTCHours(0, 0, 0, 0);

  const yesterdayUTC = new Date(nowUTC);
  yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);

  try {
    const yesterdaysStats = await context.entities.DailyStats.findFirst({
      where: {
        date: {
          equals: yesterdayUTC,
        },
      },
    });

    const userCount = await context.entities.User.count({});
    // Contar workspaces com assinatura ativa
    // workspaces podem ter assinaturas pagas mas canceladas que terminam no fim do período
    // não queremos contar esses workspaces como pagantes ativos
    const paidUserCount = await context.entities.Workspace.count({
      where: {
        subscriptionStatus: SubscriptionStatus.Active,
      },
    });

    let userDelta = userCount;
    let paidUserDelta = paidUserCount;
    if (yesterdaysStats) {
      userDelta -= yesterdaysStats.userCount;
      paidUserDelta -= yesterdaysStats.paidUserCount;
    }

    let totalRevenue;
    if (paymentProcessor.id === 'stripe') {
      totalRevenue = await fetchTotalStripeRevenue();
    } else {
      throw new Error(`Unsupported payment processor: ${paymentProcessor.id}`);
    }

    const { totalViews, prevDayViewsChangePercent } = await getDailyPageViews();

    let dailyStats = await context.entities.DailyStats.findUnique({
      where: {
        date: nowUTC,
      },
    });

    if (!dailyStats) {
      console.log('No daily stat found for today, creating one...');
      dailyStats = await context.entities.DailyStats.create({
        data: {
          date: nowUTC,
          totalViews,
          prevDayViewsChangePercent,
          userCount,
          paidUserCount,
          userDelta,
          paidUserDelta,
          totalRevenue,
        },
      });
    } else {
      console.log('Daily stat found for today, updating it...');
      dailyStats = await context.entities.DailyStats.update({
        where: {
          id: dailyStats.id,
        },
        data: {
          totalViews,
          prevDayViewsChangePercent,
          userCount,
          paidUserCount,
          userDelta,
          paidUserDelta,
          totalRevenue,
        },
      });
    }
    const sources = await getSources();

    for (const source of sources) {
      let visitors = source.visitors;
      if (typeof source.visitors !== 'number') {
        visitors = parseInt(source.visitors);
      }
      await context.entities.PageViewSource.upsert({
        where: {
          date_name: {
            date: nowUTC,
            name: source.source,
          },
        },
        create: {
          date: nowUTC,
          name: source.source,
          visitors,
          dailyStatsId: dailyStats.id,
        },
        update: {
          visitors,
        },
      });
    }

    console.table({ dailyStats });
  } catch (error: any) {
    console.error('❌ Error calculating daily stats: ', error);
    
    // ✅ Log error to Logs table
    await context.entities.Logs.create({
      data: {
        message: `Error calculating daily stats: ${error?.message}`,
        level: 'job-error',
      },
    });

    // ✅ Log detailed error for admin visibility
    // Note: SystemLog and Notification entities need to be added to job entities in main.wasp
    console.error('📊 Daily Stats Job Failure Details:', {
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
    
    // ✅ Alert: Admins should monitor job failures through logs
    // Future improvement: Send email/webhook notification to admins
    
    // Re-throw to mark job as failed in PgBoss
    throw error;
  }
};

async function fetchTotalStripeRevenue() {
  let totalRevenue = 0;
  let params: Stripe.BalanceTransactionListParams = {
    limit: 100,
    // created: {
    //   gte: startTimestamp,
    //   lt: endTimestamp
    // },
    type: 'charge',
  };

  let hasMore = true;
  while (hasMore) {
    const balanceTransactions = await stripe.balanceTransactions.list(params);

    for (const transaction of balanceTransactions.data) {
      if (transaction.type === 'charge') {
        totalRevenue += transaction.amount;
      }
    }

    if (balanceTransactions.has_more) {
      // Set the starting point for the next iteration to the last object fetched
      params.starting_after = balanceTransactions.data[balanceTransactions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  // Revenue is in cents so we convert to dollars (or your main currency unit)
  return totalRevenue / 100;
}
