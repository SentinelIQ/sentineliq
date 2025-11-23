import React, { useState, useMemo } from 'react';
import { useQuery, getAllSubscriptions, getPaymentHistory, getFailedPayments, processRefund, overrideSubscription } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  RefreshCw, 
  Loader, 
  Download,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import DefaultLayout from '../../layout/DefaultLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';

const BillingAdminPage: React.FC = () => {
  const { data: user } = useAuth();
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; invoice: any | null }>({
    open: false,
    invoice: null,
  });
  const [refundReason, setRefundReason] = useState('');
  const [overrideDialog, setOverrideDialog] = useState<{ open: boolean; subscription: any | null }>({
    open: false,
    subscription: null,
  });
  const [newPlan, setNewPlan] = useState<'free' | 'hobby' | 'pro'>('hobby');
  const [overrideReason, setOverrideReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: subscriptions, isLoading: isLoadingSubscriptions, refetch: refetchSubscriptions } = useQuery(getAllSubscriptions);
  const { data: paymentHistory, isLoading: isLoadingPayments, refetch: refetchPayments } = useQuery(getPaymentHistory, { limit: 50 });
  const { data: failedPayments, isLoading: isLoadingFailed, refetch: refetchFailed } = useQuery(getFailedPayments);

  const stats = useMemo(() => {
    if (!subscriptions) {
      return { totalMRR: 0, totalSubscriptions: 0, totalFailed: 0, conversionRate: 0 };
    }

    const totalMRR = subscriptions.reduce((sum: number, sub: any) => sum + (sub.mrr || 0), 0);
    const totalSubscriptions = subscriptions.length;
    const totalFailed = failedPayments?.length || 0;
    const paidSubscriptions = subscriptions.filter((s: any) => s.subscriptionPlan !== 'free').length;
    const conversionRate = totalSubscriptions > 0 ? (paidSubscriptions / totalSubscriptions) * 100 : 0;

    return { totalMRR, totalSubscriptions, totalFailed, conversionRate };
  }, [subscriptions, failedPayments]);

  const handleRefund = async () => {
    if (!refundDialog.invoice) return;

    setIsProcessing(true);
    try {
      await processRefund({
        invoiceId: refundDialog.invoice.id,
        reason: refundReason,
      });
      toast.success('Refund processed successfully');
      setRefundDialog({ open: false, invoice: null });
      setRefundReason('');
      await refetchPayments();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOverride = async () => {
    if (!overrideDialog.subscription) return;

    setIsProcessing(true);
    try {
      await overrideSubscription({
        workspaceId: overrideDialog.subscription.id,
        newPlan,
        reason: overrideReason,
      });
      toast.success('Subscription plan overridden successfully');
      setOverrideDialog({ open: false, subscription: null });
      setOverrideReason('');
      await refetchSubscriptions();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to override subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-green-500';
      case 'hobby': return 'bg-blue-500';
      case 'pro': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trialing': return 'bg-blue-500';
      case 'past_due': return 'bg-yellow-500';
      case 'canceled': return 'bg-red-500';
      case 'cancel_at_period_end': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user?.isAdmin) {
    return (
      <DefaultLayout user={user!}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold">Access Denied</h1>
            <p className="text-gray-500 mt-2">Admin access required</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout user={user!}>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
            <p className="text-gray-600 mt-1">
              Manage subscriptions, payments, and billing across all workspaces
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              refetchSubscriptions();
              refetchPayments();
              refetchFailed();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalMRR)}</div>
              <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
              <p className="text-xs text-muted-foreground mt-1">Active workspaces</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Free to Paid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalFailed}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subscriptions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="failed">Failed Payments</TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Subscriptions</CardTitle>
                <CardDescription>View and manage workspace subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSubscriptions ? (
                  <div className="flex justify-center p-8">
                    <Loader className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions && subscriptions.length > 0 ? (
                      subscriptions.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{sub.name}</h3>
                              <Badge className={getPlanBadgeColor(sub.subscriptionPlan)}>
                                {sub.subscriptionPlan}
                              </Badge>
                              <Badge className={getStatusBadgeColor(sub.subscriptionStatus)}>
                                {sub.subscriptionStatus}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {sub.memberCount} members • MRR: {formatCurrency(sub.mrr)}
                              {sub.nextBillingDate && ` • Next billing: ${new Date(sub.nextBillingDate).toLocaleDateString()}`}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOverrideDialog({ open: true, subscription: sub })}
                          >
                            Override Plan
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground p-8">No subscriptions found</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View all payments and process refunds</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? (
                  <div className="flex justify-center p-8">
                    <Loader className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentHistory && paymentHistory.length > 0 ? (
                      paymentHistory.map((payment: any) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{payment.workspaceName}</h3>
                              <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                                {payment.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatCurrency(payment.amount)} • {new Date(payment.created * 1000).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {payment.invoiceUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(payment.invoiceUrl, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                            {payment.status === 'paid' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRefundDialog({ open: true, invoice: payment })}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Refund
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground p-8">No payment history found</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Failed Payments Tab */}
          <TabsContent value="failed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Failed Payments</CardTitle>
                <CardDescription>Payments that need attention</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFailed ? (
                  <div className="flex justify-center p-8">
                    <Loader className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {failedPayments && failedPayments.length > 0 ? (
                      failedPayments.map((payment: any) => (
                        <div key={payment.invoiceId} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <h3 className="font-semibold">{payment.workspaceName}</h3>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatCurrency(payment.amount)} • Attempts: {payment.attemptCount}
                              {payment.nextAttempt && ` • Next retry: ${new Date(payment.nextAttempt * 1000).toLocaleDateString()}`}
                            </div>
                          </div>
                          {payment.invoiceUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(payment.invoiceUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Invoice
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground p-8">No failed payments</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Refund Dialog */}
        <Dialog open={refundDialog.open} onOpenChange={(open) => setRefundDialog({ open, invoice: refundDialog.invoice })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
              <DialogDescription>
                Process a full refund for this payment
              </DialogDescription>
            </DialogHeader>
            {refundDialog.invoice && (
              <div className="space-y-4">
                <div className="p-3 border rounded bg-gray-50">
                  <p className="font-medium">{refundDialog.invoice.workspaceName}</p>
                  <p className="text-sm text-muted-foreground">
                    Amount: {formatCurrency(refundDialog.invoice.amount)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="refundReason">Reason</Label>
                  <Textarea
                    id="refundReason"
                    placeholder="Enter reason for refund..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRefundDialog({ open: false, invoice: null })}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRefund}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Process Refund'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Override Subscription Dialog */}
        <Dialog open={overrideDialog.open} onOpenChange={(open) => setOverrideDialog({ open, subscription: overrideDialog.subscription })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override Subscription Plan</DialogTitle>
              <DialogDescription>
                Manually change the subscription plan for this workspace
              </DialogDescription>
            </DialogHeader>
            {overrideDialog.subscription && (
              <div className="space-y-4">
                <div className="p-3 border rounded bg-gray-50">
                  <p className="font-medium">{overrideDialog.subscription.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current plan: {overrideDialog.subscription.subscriptionPlan}
                  </p>
                </div>
                <div>
                  <Label htmlFor="newPlan">New Plan</Label>
                  <Select value={newPlan} onValueChange={(value: any) => setNewPlan(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="hobby">Hobby</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="overrideReason">Reason</Label>
                  <Textarea
                    id="overrideReason"
                    placeholder="Enter reason for override..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOverrideDialog({ open: false, subscription: null })}>
                Cancel
              </Button>
              <Button 
                onClick={handleOverride}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Override Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DefaultLayout>
  );
};

export default BillingAdminPage;
