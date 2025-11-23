/**
 * Aegis Incident Bulk Operations Form
 *
 * Form component for performing bulk operations on multiple incidents
 * including assignment, status updates, SLA adjustments, and closure.
 */

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Clock,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Archive,
  Settings,
  Users,
} from 'lucide-react';

// Components
import { Button } from '../../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Separator } from '../../../../../components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../../components/ui/tabs';
import { Switch } from '../../../../../components/ui/switch';
import { Label } from '../../../../../components/ui/label';
import { Input } from '../../../../../components/ui/input';
import {
  SelectField,
  InputField,
  TextareaField,
} from '../../../../../components/FormFields';

// Hooks and Operations
import { updateIncident, assignIncident, closeIncident } from 'wasp/client/operations';
import useWorkspace from '../../../../../hooks/useWorkspace';

interface IncidentBulkFormProps {
  selectedIncidents: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'containment', label: 'Containment' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const severityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const teamOptions = [
  { value: 'soc', label: 'Security Operations Center (SOC)' },
  { value: 'ir', label: 'Incident Response Team' },
  { value: 'forensics', label: 'Digital Forensics' },
  { value: 'threat_intel', label: 'Threat Intelligence' },
  { value: 'network', label: 'Network Security' },
  { value: 'compliance', label: 'Compliance & Risk' },
];

// Mock users data (replace with actual user query)
const userOptions = [
  { value: 'user1', label: 'John Doe - Senior Analyst' },
  { value: 'user2', label: 'Jane Smith - Lead Investigator' },
  { value: 'user3', label: 'Mike Johnson - SOC Manager' },
];

const playbookOptions = [
  { value: 'malware_response', label: 'Malware Response Playbook' },
  { value: 'data_breach', label: 'Data Breach Response' },
  { value: 'phishing', label: 'Phishing Incident Response' },
  { value: 'ddos_mitigation', label: 'DDoS Mitigation' },
  { value: 'insider_threat', label: 'Insider Threat Response' },
  { value: 'ransomware', label: 'Ransomware Response' },
];

const bulkUpdateSchema = z.object({
  operation: z.enum([
    'status',
    'assign',
    'sla',
    'playbook',
    'escalate',
    'close',
  ]),
  status: z
    .enum(['new', 'active', 'investigating', 'containment', 'resolved', 'closed'])
    .optional(),
  assignedToId: z.string().optional(),
  team: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  slaEnabled: z.boolean().optional(),
  slaMinutes: z.number().min(15).max(2160).optional(),
  playbook: z.string().optional(),
  notes: z.string().optional(),
  closureReason: z.string().optional(),
});

export function IncidentBulkForm({
  selectedIncidents,
  onSuccess,
  onCancel,
}: IncidentBulkFormProps) {
  const { t } = useTranslation('aegis');
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operation, setOperation] = useState<string>('status');

  const methods = useForm({
    resolver: zodResolver(bulkUpdateSchema),
    defaultValues: {
      operation: 'status' as const,
      slaEnabled: true,
      slaMinutes: 240,
      notes: '',
    },
  });

  const { handleSubmit, watch, setValue } = methods;
  const slaEnabled = watch('slaEnabled');

  const onSubmit = async (data: any) => {
    if (!currentWorkspace?.id) {
      toast.error('No workspace selected');
      return;
    }

    setIsSubmitting(true);

    try {
      // Process each incident individually
      let successCount = 0;
      let errorCount = 0;

      for (const incidentId of selectedIncidents) {
        try {
          if (data.operation === 'assign' && data.assignedToId) {
            await assignIncident({
              incidentId,
              workspaceId: currentWorkspace.id,
              assigneeId: data.assignedToId,
            });
          } else if (data.operation === 'close') {
            await closeIncident({
              incidentId,
              workspaceId: currentWorkspace.id,
            });
          } else {
            // For other operations, use generic updateIncident
            await updateIncident({
              incidentId,
              workspaceId: currentWorkspace.id,
              data: {
                ...(data.status && { status: data.status }),
                ...(data.severity && { severity: data.severity }),
                ...(data.priority && { priority: data.priority }),
              },
            });
          }
          successCount++;
        } catch (err) {
          errorCount++;
          console.error(`Failed to update incident ${incidentId}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(
          `Updated ${successCount} incident${successCount > 1 ? 's' : ''} successfully${
            errorCount > 0 ? ` (${errorCount} failed)` : ''
          }`,
        );
      } else {
        toast.error('All operations failed');
      }
      
      if (successCount > 0) {
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error.message || 'Bulk operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Bulk Incident Operations
          </CardTitle>
          <CardDescription>
            Perform operations on {selectedIncidents.length} selected incident
            {selectedIncidents.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={operation} onValueChange={setOperation} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="status" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Status
                </TabsTrigger>
                <TabsTrigger value="assign" className="text-xs">
                  <UserPlus className="w-3 h-3 mr-1" />
                  Assign
                </TabsTrigger>
                <TabsTrigger value="sla" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  SLA
                </TabsTrigger>
                <TabsTrigger value="playbook" className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  Playbook
                </TabsTrigger>
                <TabsTrigger value="escalate" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Escalate
                </TabsTrigger>
                <TabsTrigger value="close" className="text-xs">
                  <Archive className="w-3 h-3 mr-1" />
                  Close
                </TabsTrigger>
              </TabsList>

              {/* Status Update Tab */}
              <TabsContent value="status" className="space-y-4">
                <SelectField
                  name="status"
                  label="New Status"
                  options={statusOptions}
                  placeholder="Select status"
                  required
                />
                <SelectField
                  name="priority"
                  label="Priority (Optional)"
                  options={priorityOptions}
                  placeholder="Change priority"
                />
                <TextareaField
                  name="notes"
                  label="Status Update Notes (Optional)"
                  placeholder="Add notes about the status change"
                  rows={3}
                />
              </TabsContent>

              {/* Assignment Tab */}
              <TabsContent value="assign" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    name="assignedToId"
                    label="Assign To"
                    options={userOptions}
                    placeholder="Select user"
                    required
                  />
                  <SelectField
                    name="team"
                    label="Team"
                    options={teamOptions}
                    placeholder="Select team"
                    required
                  />
                </div>
                <SelectField
                  name="priority"
                  label="Priority"
                  options={priorityOptions}
                  placeholder="Set priority"
                  required
                />
                <TextareaField
                  name="notes"
                  label="Assignment Notes"
                  placeholder="Add notes about the assignment and expectations"
                  rows={3}
                  required
                />
              </TabsContent>

              {/* SLA Management Tab */}
              <TabsContent value="sla" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={slaEnabled}
                    onCheckedChange={(checked) => setValue('slaEnabled', checked)}
                    id="bulk-sla-enabled"
                  />
                  <Label htmlFor="bulk-sla-enabled">Enable SLA tracking</Label>
                </div>

                {slaEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Response Time (minutes)</Label>
                      <Input
                        type="number"
                        min="15"
                        max="2160"
                        placeholder="240"
                        {...methods.register('slaMinutes', { valueAsNumber: true })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Set uniform SLA for all selected incidents
                      </p>
                    </div>
                  </div>
                )}

                <TextareaField
                  name="notes"
                  label="SLA Update Notes"
                  placeholder="Explain the SLA changes"
                  rows={2}
                />
              </TabsContent>

              {/* Playbook Application Tab */}
              <TabsContent value="playbook" className="space-y-4">
                <SelectField
                  name="playbook"
                  label="Apply Playbook"
                  options={playbookOptions}
                  placeholder="Select playbook"
                  required
                />
                <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="font-medium text-blue-800">
                    Applying a playbook will:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-blue-700">
                    <li>Create standard response tasks for each incident</li>
                    <li>Set recommended status progression</li>
                    <li>Apply best practice timelines</li>
                    <li>Add relevant documentation templates</li>
                  </ul>
                </div>
                <TextareaField
                  name="notes"
                  label="Playbook Application Notes"
                  placeholder="Additional context for applying this playbook"
                  rows={3}
                />
              </TabsContent>

              {/* Escalation Tab */}
              <TabsContent value="escalate" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    name="severity"
                    label="New Severity Level"
                    options={severityOptions}
                    placeholder="Escalate to severity"
                    required
                  />
                  <SelectField
                    name="priority"
                    label="Priority"
                    options={priorityOptions}
                    placeholder="Set priority"
                    required
                  />
                </div>
                <SelectField
                  name="team"
                  label="Escalate To Team"
                  options={teamOptions}
                  placeholder="Select escalation team"
                />
                <TextareaField
                  name="notes"
                  label="Escalation Reason"
                  placeholder="Explain why these incidents are being escalated"
                  rows={3}
                  required
                />
              </TabsContent>

              {/* Closure Tab */}
              <TabsContent value="close" className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Archive className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-amber-800 font-medium">
                        Close {selectedIncidents.length} Incident
                        {selectedIncidents.length > 1 ? 's' : ''}
                      </h4>
                      <p className="text-amber-700 text-sm mt-1">
                        This will mark the incidents as resolved and closed. Ensure
                        all response activities are complete.
                      </p>
                    </div>
                  </div>
                </div>

                <SelectField
                  name="closureReason"
                  label="Closure Reason"
                  options={[
                    { value: 'resolved', label: 'Threat Resolved' },
                    { value: 'false_positive', label: 'False Positive' },
                    { value: 'duplicate', label: 'Duplicate Incident' },
                    { value: 'insufficient_data', label: 'Insufficient Data' },
                    { value: 'policy_exception', label: 'Policy Exception Approved' },
                    { value: 'other', label: 'Other' },
                  ]}
                  required
                />

                <TextareaField
                  name="notes"
                  label="Closure Notes"
                  placeholder="Provide detailed closure summary including resolution steps, lessons learned, and any follow-up actions required"
                  rows={4}
                  required
                />
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant={operation === 'close' ? 'default' : 'default'}
              >
                {isSubmitting
                  ? 'Processing...'
                  : `Apply to ${selectedIncidents.length} Incident${
                      selectedIncidents.length > 1 ? 's' : ''
                    }`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
