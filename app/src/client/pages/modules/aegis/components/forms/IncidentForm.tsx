/**
 * Aegis Incident Forms - Create and Edit Incident Forms
 *
 * Comprehensive form components for incident management with SLA tracking,
 * playbook application, and response team coordination.
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
  User,
  Users,
  Target,
  AlertTriangle,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';

// Components
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../../../components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Separator } from '../../../../../components/ui/separator';
import { Switch } from '../../../../../components/ui/switch';
import {
  InputField,
  TextareaField,
  SelectField
} from '../../../../../components/FormFields';

// Hooks and Operations
import { createIncident, updateIncident } from 'wasp/client/operations';
import useWorkspace from '../../../../../hooks/useWorkspace';

// Types and Constants
interface IncidentFormData {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'ACTIVE' | 'INVESTIGATING' | 'CONTAINMENT' | 'ERADICATION' | 'RECOVERY' | 'RESOLVED' | 'CLOSED';
  category: string;
  team: string;
  assignedToId?: string;
  slaEnabled?: boolean;
  slaMinutes?: number;
  playbook?: string;
  affectedSystems?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

interface IncidentFormProps {
  incident?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const severityOptions = [
  { value: 'LOW', label: 'Low', color: 'text-blue-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-500' },
  { value: 'HIGH', label: 'High', color: 'text-orange-500' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-500' }
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' }
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'CONTAINMENT', label: 'Containment' },
  { value: 'ERADICATION', label: 'Eradication' },
  { value: 'RECOVERY', label: 'Recovery' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' }
];

const categoryOptions = [
  { value: 'security_breach', label: 'Security Breach' },
  { value: 'malware', label: 'Malware Incident' },
  { value: 'data_loss', label: 'Data Loss' },
  { value: 'denial_service', label: 'Denial of Service' },
  { value: 'unauthorized_access', label: 'Unauthorized Access' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'other', label: 'Other' }
];

const teamOptions = [
  { value: 'soc', label: 'Security Operations Center (SOC)' },
  { value: 'ir', label: 'Incident Response Team' },
  { value: 'forensics', label: 'Digital Forensics' },
  { value: 'threat_intel', label: 'Threat Intelligence' },
  { value: 'network', label: 'Network Security' },
  { value: 'compliance', label: 'Compliance & Risk' }
];

const playbookOptions = [
  { value: 'malware_response', label: 'Malware Response Playbook' },
  { value: 'data_breach', label: 'Data Breach Response' },
  { value: 'phishing', label: 'Phishing Incident Response' },
  { value: 'ddos_mitigation', label: 'DDoS Mitigation' },
  { value: 'insider_threat', label: 'Insider Threat Response' },
  { value: 'ransomware', label: 'Ransomware Response' }
];

// Mock users
const userOptions = [
  { value: 'user1', label: 'John Doe - Senior Analyst' },
  { value: 'user2', label: 'Jane Smith - Lead Investigator' },
  { value: 'user3', label: 'Mike Johnson - SOC Manager' }
];

const slaDefaults = {
  LOW: 480,
  MEDIUM: 240,
  HIGH: 120,
  CRITICAL: 60
};

// Schema
const incidentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['ACTIVE', 'INVESTIGATING', 'CONTAINMENT', 'ERADICATION', 'RECOVERY', 'RESOLVED', 'CLOSED']).optional(),
  category: z.string().min(1),
  team: z.string().min(1),
  assignedToId: z.string().optional(),
  slaEnabled: z.boolean().optional(),
  slaMinutes: z.number().min(15).max(2160).optional(),
  playbook: z.string().optional(),
  affectedSystems: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

export function IncidentForm({ incident, onSuccess, onCancel }: IncidentFormProps) {
  const { t } = useTranslation('aegis');
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [systemInput, setSystemInput] = useState('');

  const isEditing = !!incident;
  const title = isEditing ? t('incidents.forms.edit.title') : t('incidents.forms.create.title');

  const methods = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: incident?.title || '',
      description: incident?.description || '',
      severity: incident?.severity || 'MEDIUM',
      priority: incident?.priority || 'MEDIUM',
      status: incident?.status || 'ACTIVE',
      category: incident?.category || '',
      team: incident?.team || '',
      assignedToId: incident?.assignedToId || '',
      slaEnabled: incident?.slaEnabled ?? true,
      slaMinutes: incident?.slaMinutes || slaDefaults.MEDIUM,
      playbook: incident?.playbook || '',
      affectedSystems: incident?.affectedSystems || [],
      tags: incident?.tags || [],
      metadata: incident?.metadata || {}
    }
  });

  const { handleSubmit, watch, setValue, formState: { errors } } = methods;
  const watchedTags = watch('tags') || [];
  const watchedSystems = watch('affectedSystems') || [];
  const watchedSeverity = watch('severity');
  const slaEnabled = watch('slaEnabled');

  React.useEffect(() => {
    if (slaEnabled && watchedSeverity) {
      setValue('slaMinutes', slaDefaults[watchedSeverity]);
    }
  }, [watchedSeverity, slaEnabled, setValue]);

  const onSubmit = (data: IncidentFormData) => {
    if (!currentWorkspace?.id) {
      toast.error('No workspace selected');
      return;
    }

    setIsSubmitting(true);

    void (async () => {
      try {
        const payload = {
          ...data,
          workspaceId: currentWorkspace.id,
          timestamp: new Date(),
          ...(data.slaEnabled && data.slaMinutes && {
            slaDeadline: new Date(Date.now() + data.slaMinutes * 60000)
          })
        };

        if (isEditing) {
          await updateIncident({ incidentId: incident.id, workspaceId: payload.workspaceId, data: payload });
          toast.success('Incident updated successfully');
        } else {
          await createIncident({ data: payload });
          toast.success('Incident created successfully');
        }

        onSuccess?.();
      } catch (error: any) {
        toast.error(error.message || 'Failed to save incident');
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const addSystem = () => {
    if (systemInput.trim() && !watchedSystems.includes(systemInput.trim())) {
      setValue('affectedSystems', [...watchedSystems, systemInput.trim()]);
      setSystemInput('');
    }
  };

  const removeSystem = (systemToRemove: string) => {
    setValue('affectedSystems', watchedSystems.filter(system => system !== systemToRemove));
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    type: 'tag' | 'system'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'tag') addTag();
      if (type === 'system') addSystem();
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? t('incidents.forms.edit.description')
                : t('incidents.forms.create.description')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" />
                Basic Information
              </div>

              <InputField
                name="title"
                label="Incident Title"
                placeholder="Brief description of the security incident"
                required
              />

              <TextareaField
                name="description"
                label="Detailed Description"
                placeholder="Comprehensive description of the incident"
                rows={5}
                required
              />
            </div>

            <Separator />

            {/* Classification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4" />
                Classification & Assignment
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SelectField name="severity" label="Severity Level" options={severityOptions} required />
                <SelectField name="priority" label="Priority" options={priorityOptions} required />
                <SelectField name="category" label="Incident Category" options={categoryOptions} required />

                {isEditing && (
                  <SelectField name="status" label="Status" options={statusOptions} />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField name="team" label="Responsible Team" options={teamOptions} required />
                <SelectField
                  name="assignedToId"
                  label="Assigned To"
                  options={userOptions}
                  placeholder="Select team member"
                />
              </div>
            </div>

            <Separator />

            {/* SLA */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4" />
                SLA Configuration
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={slaEnabled}
                  onCheckedChange={(checked) => setValue('slaEnabled', checked)}
                  id="sla-enabled"
                />
                <Label htmlFor="sla-enabled">Enable SLA tracking for this incident</Label>
              </div>

              {slaEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Auto-set based on severity: Critical=60, High=120, Medium=240, Low=480
                    </p>

                    {errors.slaMinutes && (
                      <p className="text-sm text-red-500">
                        {errors.slaMinutes.message}
                      </p>
                    )}
                  </div>

                  <SelectField
                    name="playbook"
                    label="Response Playbook"
                    options={playbookOptions}
                    placeholder="Select applicable playbook"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Systems */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings className="w-4 h-4" />
                Affected Systems
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add affected system"
                    value={systemInput}
                    onChange={(e) => setSystemInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'system')}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addSystem}>
                    Add System
                  </Button>
                </div>

                {watchedSystems.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedSystems.map((system) => (
                      <Badge
                        key={system}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => removeSystem(system)}
                      >
                        {system}
                        <span className="ml-2 hover:bg-red-500 hover:text-white rounded-full px-1">
                          ×
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4" />
                Tags & Labels
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'tag')}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add Tag
                  </Button>
                </div>

                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <span className="ml-2 hover:bg-red-500 hover:text-white rounded-full px-1">
                          ×
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Incident' : 'Create Incident'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

export function QuickIncidentForm({ onSuccess, onCancel }: Pick<IncidentFormProps, 'onSuccess' | 'onCancel'>) {
  const { t } = useTranslation('aegis');
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickSchema = z.object({
    title: z.string().min(5),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    team: z.string().min(1)
  });

  const methods = useForm({
    resolver: zodResolver(quickSchema),
    defaultValues: {
      title: '',
      severity: 'medium' as const,
      priority: 'medium' as const,
      team: 'soc'
    }
  });

  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    void (async () => {
      try {
        await createIncident({
          ...data,
          description: `Incident: ${data.title}`,
          category: 'other',
          slaEnabled: true,
          slaMinutes: slaDefaults[data.severity as keyof typeof slaDefaults],
          affectedSystems: [],
          tags: [],
          workspaceId: currentWorkspace?.id,
          timestamp: new Date()
        });

        toast.success('Quick incident created');
        onSuccess?.();
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <InputField name="title" label="Incident Title" placeholder="Brief incident description" required />

        <div className="grid grid-cols-2 gap-4">
          <SelectField name="severity" label="Severity" options={severityOptions} required />
          <SelectField name="priority" label="Priority" options={priorityOptions} required />
        </div>

        <SelectField name="team" label="Team" options={teamOptions} required />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
