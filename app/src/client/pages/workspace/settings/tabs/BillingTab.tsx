import { useQuery, getCurrentWorkspace, getCustomerPortalUrl, getWorkspaceUsage, getStripeInvoices } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Progress } from '../../../../components/ui/progress';
import { CreditCard, ExternalLink, Calendar, Zap, AlertCircle, Users, Database, AlertTriangle, FileText, Download } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../../../hooks/useToast';

interface WorkspaceUsage {
  members: { current: number; limit: number };
  alerts: { current: number; limit: number };
  incidents: { current: number; limit: number };
  cases: { current: number; limit: number };
  storage: { currentGB: number; limitGB: number };
}

type StripeInvoice = Record<string, any> & {
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

export default function BillingTab() {
  const { data: workspace } = useQuery(getCurrentWorkspace);
  const { data: usage } = useQuery(getWorkspaceUsage, { workspaceId: workspace?.id }) as { data: WorkspaceUsage | undefined };
  const { data: invoices } = useQuery<unknown, StripeInvoice[]>(getStripeInvoices);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const { toast } = useToast();

  const handleOpenCustomerPortal = async () => {
    setIsLoadingPortal(true);
    try {
      const url = await getCustomerPortalUrl();
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('No payment processor account found. Please subscribe first.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to open customer portal');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  if (!workspace) {
    return (
      <Alert>
        <AlertDescription>No workspace selected</AlertDescription>
      </Alert>
    );
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return <Badge variant="secondary">No Subscription</Badge>;
    }

    const statusConfig: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      cancel_at_period_end: { variant: 'outline', label: 'Canceling' },
      past_due: { variant: 'destructive', label: 'Past Due' },
      deleted: { variant: 'secondary', label: 'Canceled' },
    };

    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPlanBadge = (plan: string | null) => {
    if (!plan) {
      return <Badge variant="secondary">Free</Badge>;
    }

    const planConfig: Record<string, { variant: any; label: string }> = {
      hobby: { variant: 'default', label: 'Hobby' },
      pro: { variant: 'default', label: 'Pro' },
    };

    const config = planConfig[plan] || { variant: 'secondary', label: plan };
    return <Badge variant={config.variant} className="text-base">{config.label}</Badge>;
  };

  const hasActiveSubscription = workspace.subscriptionStatus === 'active';
  const isOwner = workspace.userRole === 'OWNER';

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription & Billing
          </CardTitle>
          <CardDescription>
            Manage your workspace subscription and payment details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Current Plan</div>
              <div className="flex items-center gap-2">
                {getPlanBadge(workspace.subscriptionPlan)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="flex items-center gap-2">
                {getStatusBadge(workspace.subscriptionStatus)}
              </div>
            </div>
          </div>

          {/* Credits */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Available Credits</div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">{workspace.credits || 0}</span>
              <span className="text-sm text-muted-foreground">credits remaining</span>
            </div>
          </div>

          {/* Renewal Date */}
          {workspace.datePaid && hasActiveSubscription && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Last Payment</div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {new Date(workspace.datePaid).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t space-y-3">
            {!hasActiveSubscription && isOwner && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  You're currently on the free plan. Upgrade to unlock more features and increase your limits.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              {!hasActiveSubscription && isOwner && (
                <Button onClick={() => window.location.href = '/pricing'}>
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}

              {workspace.paymentProcessorUserId && (
                <Button
                  variant={hasActiveSubscription ? 'default' : 'outline'}
                  onClick={handleOpenCustomerPortal}
                  disabled={isLoadingPortal}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {isLoadingPortal ? 'Loading...' : 'Manage Subscription'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage & Quotas */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Usage & Limits</CardTitle>
            <CardDescription>
              Current usage for your {workspace.subscriptionPlan || 'free'} plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Team Members */}
              <UsageItem
                icon={<Users className="w-5 h-5" />}
                label="Team Members"
                current={usage.members.current}
                limit={usage.members.limit}
              />

              {/* Alerts Per Month */}
              <UsageItem
                icon={<AlertTriangle className="w-5 h-5" />}
                label="Alerts This Month"
                current={usage.alerts.current}
                limit={usage.alerts.limit}
              />

              {/* Incidents */}
              <UsageItem
                icon={<AlertCircle className="w-5 h-5" />}
                label="Total Incidents"
                current={usage.incidents.current}
                limit={usage.incidents.limit}
              />

              {/* Cases */}
              <UsageItem
                icon={<AlertCircle className="w-5 h-5" />}
                label="Total Cases"
                current={usage.cases.current}
                limit={usage.cases.limit}
              />

              {/* Storage */}
              <UsageItem
                icon={<Database className="w-5 h-5" />}
                label="Storage"
                current={usage.storage.currentGB}
                limit={usage.storage.limitGB}
                unit="GB"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>
            What's included in your {workspace.subscriptionPlan || 'free'} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workspace.subscriptionPlan === 'pro' && (
              <>
                <FeatureItem icon="✓" text="Unlimited workspaces" />
                <FeatureItem icon="✓" text="Unlimited team members" />
                <FeatureItem icon="✓" text="Unlimited alerts per month" />
                <FeatureItem icon="✓" text="100 GB storage" />
                <FeatureItem icon="✓" text="Priority support" />
                <FeatureItem icon="✓" text="Advanced analytics" />
              </>
            )}

            {workspace.subscriptionPlan === 'hobby' && (
              <>
                <FeatureItem icon="✓" text="Up to 3 workspaces" />
                <FeatureItem icon="✓" text="Up to 10 team members" />
                <FeatureItem icon="✓" text="100 alerts per month" />
                <FeatureItem icon="✓" text="10 GB storage" />
                <FeatureItem icon="✓" text="Email support" />
              </>
            )}

            {!workspace.subscriptionPlan && (
              <>
                <FeatureItem icon="✓" text="1 workspace" />
                <FeatureItem icon="✓" text="Up to 3 team members" />
                <FeatureItem icon="✓" text="10 alerts per month" />
                <FeatureItem icon="✓" text="1 GB storage" />
                <FeatureItem icon="✓" text="Community support" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Warnings */}
      {workspace.subscriptionStatus === 'past_due' && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Your payment is past due. Please update your payment method to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {workspace.subscriptionStatus === 'cancel_at_period_end' && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Your subscription will be canceled at the end of the current billing period.
          You can reactivate it anytime before then.
        </AlertDescription>
      </Alert>
      )}

      {/* Invoice History */}
      {workspace.paymentProcessorUserId && invoices && invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice History
            </CardTitle>
            <CardDescription>
              View and download your past invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {invoice.number || `Invoice ${invoice.id.slice(-8)}`}
                      </span>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(invoice.created * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">
                        ${(invoice.amount_paid / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                      </div>
                      {invoice.amount_due !== invoice.amount_paid && (
                        <div className="text-xs text-muted-foreground">
                          Due: ${(invoice.amount_due / 100).toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {invoice.hosted_invoice_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {invoice.invoice_pdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(invoice.invoice_pdf!, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: any; label: string }> = {
    paid: { variant: 'default', label: 'Paid' },
    open: { variant: 'outline', label: 'Open' },
    draft: { variant: 'secondary', label: 'Draft' },
    void: { variant: 'secondary', label: 'Void' },
    uncollectible: { variant: 'destructive', label: 'Uncollectible' },
  };

  const config = statusConfig[status] || { variant: 'secondary', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}function UsageItem({
  icon,
  label,
  current,
  limit,
  unit = '',
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  limit: number;
  unit?: string;
}) {
  const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = limit !== -1 && percentage >= 80;
  const isUnlimited = limit === -1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>{label}</span>
        </div>
        <div className="text-sm">
          <span className={isNearLimit ? 'text-orange-600 font-semibold' : 'font-medium'}>
            {current}
            {unit && ` ${unit}`}
          </span>
          <span className="text-muted-foreground">
            {' '}
            / {isUnlimited ? 'unlimited' : `${limit}${unit ? ` ${unit}` : ''}`}
          </span>
        </div>
      </div>
      {!isUnlimited && (
        <div className={isNearLimit ? '[&>div]:bg-orange-500' : ''}>
          <Progress value={percentage} className="h-2" />
        </div>
      )}
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-green-500 font-bold text-lg">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  );
}
