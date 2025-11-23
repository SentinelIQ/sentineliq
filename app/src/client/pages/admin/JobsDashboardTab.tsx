/**
 * Jobs Dashboard - Admin Panel
 * 
 * Monitor and manage background jobs
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'wasp/client/operations';
import { 
  getJobStats, 
  getJobHistory, 
  triggerJob, 
  getJobErrors,
  getJobControl,
  pauseJob,
  resumeJob,
  updateJobSchedule,
  getDeadLetterQueue,
  retryDeadLetterJob,
  resolveDeadLetterJob
} from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { Play, RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle, Bug, Pause, PlayCircle, Settings, Archive } from 'lucide-react';

export default function JobsDashboardTab() {
  const { t } = useTranslation('admin');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [errorModalJob, setErrorModalJob] = useState<string | null>(null);
  const [scheduleDialog, setScheduleDialog] = useState<{ open: boolean; jobName: string | null }>({ open: false, jobName: null });
  const [cronExpression, setCronExpression] = useState('');
  const [scheduleReason, setScheduleReason] = useState('');
  const [pauseDialog, setPauseDialog] = useState<{ open: boolean; jobName: string | null; isPaused: boolean }>({ 
    open: false, 
    jobName: null, 
    isPaused: false 
  });
  const [pauseReason, setPauseReason] = useState('');
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean; dlqId: string | null }>({ open: false, dlqId: null });
  const [resolution, setResolution] = useState('');

  const { data: jobStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery(getJobStats);
  const { data: jobHistory, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery(
    getJobHistory,
    { jobName: selectedJob || 'dailyStatsJob', limit: 20 },
    { enabled: !!selectedJob }
  );
  const { data: jobErrors, isLoading: isLoadingErrors } = useQuery(
    getJobErrors,
    { jobName: errorModalJob || '', limit: 50 },
    { enabled: !!errorModalJob }
  );
  const { data: jobControl, refetch: refetchJobControl } = useQuery(
    getJobControl,
    { jobName: selectedJob || 'dailyStatsJob' },
    { enabled: !!selectedJob }
  );
  const { data: dlqEntries, isLoading: isLoadingDLQ, refetch: refetchDLQ } = useQuery(getDeadLetterQueue, { status: 'all', limit: 50 });

  const handleTriggerJob = async (jobName: string) => {
    try {
      setIsTriggering(true);
      await triggerJob({ jobName });
      toast.success(t('jobs.triggered'));
      setTimeout(() => {
        refetchStats();
        if (selectedJob === jobName) {
          refetchHistory();
        }
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || t('jobs.triggerError'));
    } finally {
      setIsTriggering(false);
    }
  };

  const handlePauseResume = async () => {
    if (!pauseDialog.jobName) return;
    
    try {
      if (pauseDialog.isPaused) {
        await resumeJob({ jobName: pauseDialog.jobName });
        toast.success(`Job ${pauseDialog.jobName} resumed`);
      } else {
        await pauseJob({ jobName: pauseDialog.jobName, reason: pauseReason });
        toast.success(`Job ${pauseDialog.jobName} paused`);
      }
      setPauseDialog({ open: false, jobName: null, isPaused: false });
      setPauseReason('');
      refetchJobControl();
      refetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update job status');
    }
  };

  const handleUpdateSchedule = async () => {
    if (!scheduleDialog.jobName) return;
    
    try {
      await updateJobSchedule({ 
        jobName: scheduleDialog.jobName, 
        cronSchedule: cronExpression,
        reason: scheduleReason
      });
      toast.success(`Schedule updated for ${scheduleDialog.jobName}`);
      setScheduleDialog({ open: false, jobName: null });
      setCronExpression('');
      setScheduleReason('');
      refetchJobControl();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update schedule');
    }
  };

  const handleRetryDLQ = async (dlqId: string) => {
    try {
      await retryDeadLetterJob({ dlqId });
      toast.success('Job queued for retry');
      refetchDLQ();
    } catch (error: any) {
      toast.error(error.message || 'Failed to retry job');
    }
  };

  const handleResolveDLQ = async () => {
    if (!resolveDialog.dlqId) return;
    
    try {
      await resolveDeadLetterJob({ dlqId: resolveDialog.dlqId, resolution });
      toast.success('DLQ entry resolved');
      setResolveDialog({ open: false, dlqId: null });
      setResolution('');
      refetchDLQ();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve entry');
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'completed':
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'running':
        return <Clock className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStateBadge = (state: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      active: 'default',
      failed: 'destructive',
      error: 'destructive',
      running: 'secondary',
      unknown: 'outline',
    };
    return <Badge variant={variants[state] || 'outline'}>{t(`jobs.states.${state}` as any) || state}</Badge>;
  };

  if (isLoadingStats) {
    return <div className="p-8 text-center">{t('jobs.loadingJobs')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('jobs.title')}</h2>
          <p className="text-muted-foreground">{t('jobs.subtitle')}</p>
        </div>
        <Button onClick={() => refetchStats()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('jobs.refresh')}
        </Button>
      </div>

      {/* Jobs Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobStats?.map((job: any) => (
          <Card
            key={job.name}
            className={`cursor-pointer transition-colors ${
              selectedJob === job.name ? 'ring-2 ring-primary' : 'hover:bg-accent'
            }`}
            onClick={() => setSelectedJob(job.name)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {job.name.replace(/Job$/, '').replace(/([A-Z])/g, ' $1').trim()}
              </CardTitle>
              {getStateIcon(job.state)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">{job.count || 0}</div>
                {getStateBadge(job.state)}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Executions (24h)</span>
                {job.failedCount > 0 && (
                  <span className="text-red-500">{job.failedCount} failed</span>
                )}
              </div>
              <div className="flex gap-1 mt-3 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerJob(job.name);
                  }}
                  disabled={isTriggering}
                  title="Trigger job manually"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Trigger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPauseDialog({ 
                      open: true, 
                      jobName: job.name,
                      isPaused: jobControl?.isPaused || false
                    });
                  }}
                  title={jobControl?.isPaused ? 'Resume job' : 'Pause job'}
                >
                  {jobControl?.isPaused ? (
                    <PlayCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <Pause className="w-3 h-3 mr-1" />
                  )}
                  {jobControl?.isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCronExpression(jobControl?.cronSchedule || '');
                    setScheduleDialog({ open: true, jobName: job.name });
                  }}
                  title="Update schedule"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Schedule
                </Button>
                {job.failedCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setErrorModalJob(job.name);
                    }}
                    title="View errors"
                  >
                    <Bug className="w-3 h-3 mr-1" />
                    Errors
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job History */}
      {selectedJob && (
        <Card>
          <CardHeader>
            <CardTitle>
              Execution History:{' '}
              {selectedJob.replace(/Job$/, '').replace(/([A-Z])/g, ' $1').trim()}
            </CardTitle>
            <CardDescription>Last 20 executions from system logs</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="p-8 text-center">Loading history...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Execution Time</TableHead>
                    <TableHead>Output</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobHistory && jobHistory.length > 0 ? (
                    jobHistory.map((execution: any) => (
                      <TableRow key={execution.id}>
                        <TableCell>{getStateBadge(execution.state)}</TableCell>
                        <TableCell className="text-xs">
                          {execution.startedOn ? new Date(execution.startedOn).toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-xs">{execution.output || 'N/A'}</TableCell>
                        <TableCell className="max-w-md truncate text-xs text-red-500">
                          {execution.error || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No execution history found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Details Modal */}
      <Dialog open={!!errorModalJob} onOpenChange={() => setErrorModalJob(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Job Errors: {errorModalJob?.replace(/Job$/, '').replace(/([A-Z])/g, ' $1').trim()}
            </DialogTitle>
            <DialogDescription>
              Recent error logs and stack traces for debugging (last 50)
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingErrors ? (
            <div className="p-8 text-center">Loading errors...</div>
          ) : jobErrors && jobErrors.length > 0 ? (
            <div className="space-y-4">
              {jobErrors.map((error: any) => (
                <Card key={error.id} className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium text-red-900">
                          {error.message}
                        </CardTitle>
                        <p className="text-xs text-red-600 mt-1">
                          {new Date(error.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  </CardHeader>
                  {(error.error || error.stackTrace) && (
                    <CardContent>
                      {error.error && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-red-800 mb-1">Error:</p>
                          <pre className="text-xs bg-white p-2 rounded border border-red-200 overflow-x-auto">
                            {typeof error.error === 'string' 
                              ? error.error 
                              : JSON.stringify(error.error, null, 2)}
                          </pre>
                        </div>
                      )}
                      {error.stackTrace && (
                        <div>
                          <p className="text-xs font-semibold text-red-800 mb-1">Stack Trace:</p>
                          <pre className="text-xs bg-white p-2 rounded border border-red-200 overflow-x-auto whitespace-pre-wrap">
                            {error.stackTrace}
                          </pre>
                        </div>
                      )}
                      {error.metadata && Object.keys(error.metadata).length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-red-800 mb-1">Metadata:</p>
                          <pre className="text-xs bg-white p-2 rounded border border-red-200 overflow-x-auto">
                            {JSON.stringify(error.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No errors found for this job</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dead Letter Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Dead Letter Queue
              </CardTitle>
              <CardDescription>Failed jobs requiring manual intervention</CardDescription>
            </div>
            <Button onClick={() => refetchDLQ()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingDLQ ? (
            <div className="p-8 text-center">Loading DLQ entries...</div>
          ) : dlqEntries && dlqEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Failed At</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dlqEntries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.jobName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          entry.status === 'resolved' ? 'default' :
                          entry.status === 'pending' ? 'secondary' :
                          entry.status === 'retrying' ? 'outline' : 'destructive'
                        }
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(entry.failedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {entry.retryCount} / {entry.maxRetries}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-xs text-red-500">
                      {entry.errorMessage}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {entry.status !== 'resolved' && entry.retryCount < entry.maxRetries && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetryDLQ(entry.id)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        )}
                        {entry.status !== 'resolved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setResolveDialog({ open: true, dlqId: entry.id })}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No failed jobs in Dead Letter Queue</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pause/Resume Dialog */}
      <Dialog open={pauseDialog.open} onOpenChange={(open) => setPauseDialog({ ...pauseDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pauseDialog.isPaused ? 'Resume' : 'Pause'} Job</DialogTitle>
            <DialogDescription>
              {pauseDialog.isPaused 
                ? 'Resume this job to allow it to execute on schedule.'
                : 'Pause this job to prevent it from executing.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <strong>Job:</strong> {pauseDialog.jobName}
            </div>
            {!pauseDialog.isPaused && (
              <div>
                <Label>Reason (required)</Label>
                <Textarea
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="Why is this job being paused?"
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPauseDialog({ open: false, jobName: null, isPaused: false });
                setPauseReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePauseResume}
              disabled={!pauseDialog.isPaused && !pauseReason.trim()}
            >
              {pauseDialog.isPaused ? 'Resume Job' : 'Pause Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Schedule Dialog */}
      <Dialog open={scheduleDialog.open} onOpenChange={(open) => setScheduleDialog({ ...scheduleDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Job Schedule</DialogTitle>
            <DialogDescription>
              Modify the cron expression for this job's execution schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <strong>Job:</strong> {scheduleDialog.jobName}
            </div>
            <div>
              <Label>Cron Expression *</Label>
              <Input
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 * * * * (every hour)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: minute hour day month weekday (e.g., "0 2 * * *" for 2 AM daily)
              </p>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                value={scheduleReason}
                onChange={(e) => setScheduleReason(e.target.value)}
                placeholder="Why is this schedule being changed?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setScheduleDialog({ open: false, jobName: null });
                setCronExpression('');
                setScheduleReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSchedule}
              disabled={!cronExpression.trim()}
            >
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve DLQ Dialog */}
      <Dialog open={resolveDialog.open} onOpenChange={(open) => setResolveDialog({ ...resolveDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dead Letter Queue Entry</DialogTitle>
            <DialogDescription>
              Mark this failed job as resolved with an explanation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Resolution Notes *</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="How was this issue resolved?"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveDialog({ open: false, dlqId: null });
                setResolution('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveDLQ}
              disabled={!resolution.trim()}
            >
              Resolve Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
