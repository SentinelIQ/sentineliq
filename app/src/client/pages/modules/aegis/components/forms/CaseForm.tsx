/**
 * Aegis Case Forms - Create and Edit Case Forms
 *
 * Comprehensive form components for investigation case management with
 * evidence tracking, TTP mapping, and investigation workflow.
 */

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Briefcase,
  Search,
  User,
  Shield,
  Lock,
  Calendar,
  FileText,
  Target,
  Eye,
  AlertCircle,
  Settings,
} from "lucide-react";

// Components
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { Separator } from "../../../../../components/ui/separator";
import { Alert, AlertDescription } from "../../../../../components/ui/alert";
import {
  InputField,
  TextareaField,
  SelectField,
} from "../../../../../components/FormFields";

// Hooks and Operations
import { createCase, updateCase } from "wasp/client/operations";
import useWorkspace from "../../../../../hooks/useWorkspace";

// Types and Constants
interface CaseFormData {
  title: string;
  description: string;
  caseType: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: "ACTIVE" | "REVIEW" | "CLOSED" | "ARCHIVED";
  investigatorId?: string;
  team: string;
  confidentiality: "public" | "internal" | "restricted" | "confidential";
  classification: string;
  hypothesis?: string;
  scope: string;
  timeline?: {
    estimatedStart?: string;
    estimatedEnd?: string;
  };
  objectives?: string[];
  resources?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

interface CaseFormProps {
  case?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const priorityOptions = [
  { value: "LOW", label: "Low", color: "text-blue-500" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-500" },
  { value: "HIGH", label: "High", color: "text-orange-500" },
  { value: "CRITICAL", label: "Critical", color: "text-red-500" },
];

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "investigation", label: "Under Investigation" },
  { value: "analysis", label: "Analysis Phase" },
  { value: "closed", label: "Closed" },
];

const caseTypeOptions = [
  { value: "security_incident", label: "Security Incident Investigation" },
  { value: "threat_hunting", label: "Threat Hunting" },
  { value: "forensic_analysis", label: "Digital Forensic Analysis" },
  { value: "compliance_review", label: "Compliance Review" },
  { value: "vulnerability_assessment", label: "Vulnerability Assessment" },
  { value: "insider_threat", label: "Insider Threat Investigation" },
  { value: "fraud_investigation", label: "Fraud Investigation" },
  { value: "data_breach", label: "Data Breach Investigation" },
  { value: "other", label: "Other" },
];

const confidentialityOptions = [
  {
    value: "public",
    label: "Public",
    description: "No restrictions on access",
  },
  {
    value: "internal",
    label: "Internal",
    description: "Internal organization only",
  },
  {
    value: "restricted",
    label: "Restricted",
    description: "Need-to-know basis",
  },
  {
    value: "confidential",
    label: "Confidential",
    description: "Highly sensitive information",
  },
];

const classificationOptions = [
  { value: "administrative", label: "Administrative" },
  { value: "criminal", label: "Criminal Investigation" },
  { value: "civil", label: "Civil Matter" },
  { value: "regulatory", label: "Regulatory Compliance" },
  { value: "internal_audit", label: "Internal Audit" },
  { value: "security_assessment", label: "Security Assessment" },
];

const teamOptions = [
  { value: "dfir", label: "Digital Forensics & Incident Response" },
  { value: "threat_intel", label: "Threat Intelligence" },
  { value: "security_ops", label: "Security Operations" },
  { value: "compliance", label: "Compliance & Risk" },
  { value: "legal", label: "Legal Affairs" },
  { value: "audit", label: "Internal Audit" },
];

const investigatorOptions = [
  { value: "user1", label: "John Doe - Senior Investigator" },
  { value: "user2", label: "Jane Smith - Forensic Analyst" },
  { value: "user3", label: "Mike Johnson - Lead Investigator" },
];

const objectiveTemplates = [
  "Identify root cause of security incident",
  "Determine scope and impact of breach",
  "Collect and preserve digital evidence",
  "Analyze threat actor tactics and techniques",
  "Document timeline of events",
  "Assess compliance violations",
  "Recommend remediation actions",
  "Prepare legal documentation",
  "Conduct interviews with stakeholders",
  "Review system logs and artifacts",
];

const resourceTemplates = [
  "Forensic imaging tools",
  "Network capture devices",
  "Log analysis platforms",
  "Malware analysis sandbox",
  "Legal consultation",
  "External forensic expert",
  "Specialized software licenses",
  "Additional storage capacity",
];

// Validation Schema
const caseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(3000),
  caseType: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["ACTIVE", "REVIEW", "CLOSED", "ARCHIVED"]).optional(),
  investigatorId: z.string().optional(),
  team: z.string().min(1),
  confidentiality: z.enum(["public", "internal", "restricted", "confidential"]),
  classification: z.string().min(1),
  hypothesis: z.string().optional(),
  scope: z.string().min(10),
  timeline: z
    .object({
      estimatedStart: z.string().optional(),
      estimatedEnd: z.string().optional(),
    })
    .optional(),
  objectives: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Main Case Form Component
 */
export function CaseForm({
  case: caseData,
  onSuccess,
  onCancel,
}: CaseFormProps) {
  const { t } = useTranslation("aegis");
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [objectiveInput, setObjectiveInput] = useState("");
  const [resourceInput, setResourceInput] = useState("");

  const isEditing = !!caseData;
  const title = isEditing
    ? t("cases.forms.edit.title")
    : t("cases.forms.create.title");

  const methods = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: caseData?.title || "",
      description: caseData?.description || "",
      caseType: caseData?.caseType || "",
      priority: caseData?.priority || "MEDIUM",
      status: caseData?.status || "ACTIVE",
      investigatorId: caseData?.investigatorId || "",
      team: caseData?.team || "",
      confidentiality: caseData?.confidentiality || "internal",
      classification: caseData?.classification || "",
      hypothesis: caseData?.hypothesis || "",
      scope: caseData?.scope || "",
      timeline: caseData?.timeline || { estimatedStart: "", estimatedEnd: "" },
      objectives: caseData?.objectives || [],
      resources: caseData?.resources || [],
      tags: caseData?.tags || [],
      metadata: caseData?.metadata || {},
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const watchedTags = watch("tags") || [];
  const watchedObjectives = watch("objectives") || [];
  const watchedResources = watch("resources") || [];
  const watchedConfidentiality = watch("confidentiality");

  const onSubmit = (data: CaseFormData) => {
    if (!currentWorkspace?.id) {
      toast.error("No workspace selected");
      return;
    }

    setIsSubmitting(true);

    void (async () => {
      try {
        const payload = {
          ...data,
          workspaceId: currentWorkspace.id,
          timestamp: new Date(),
          ...(data.timeline?.estimatedStart && {
            estimatedStartDate: new Date(data.timeline.estimatedStart),
          }),
          ...(data.timeline?.estimatedEnd && {
            estimatedEndDate: new Date(data.timeline.estimatedEnd),
          }),
        };

        if (isEditing) {
          await updateCase({ caseId: caseData.id, workspaceId: payload.workspaceId, data: payload });
          toast.success("Case updated successfully");
        } else {
          await createCase({ data: payload });
          toast.success("Investigation case created successfully");
        }

        onSuccess?.();
      } catch (error: any) {
        toast.error(error.message || "Failed to save case");
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  // Tag management
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !watchedTags.includes(tag)) {
      setValue("tags", [...watchedTags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (value: string) => {
    setValue(
      "tags",
      watchedTags.filter((t) => t !== value),
    );
  };

  // Objectives
  const addObjective = (value?: string) => {
    const obj = value || objectiveInput.trim();
    if (obj && !watchedObjectives.includes(obj)) {
      setValue("objectives", [...watchedObjectives, obj]);
      if (!value) setObjectiveInput("");
    }
  };

  const removeObjective = (value: string) => {
    setValue(
      "objectives",
      watchedObjectives.filter((o) => o !== value),
    );
  };

  // Resource management
  const addResource = (value?: string) => {
    const res = value || resourceInput.trim();
    if (res && !watchedResources.includes(res)) {
      setValue("resources", [...watchedResources, res]);
      if (!value) setResourceInput("");
    }
  };

  const removeResource = (value: string) => {
    setValue(
      "resources",
      watchedResources.filter((r) => r !== value),
    );
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    type: "tag" | "objective" | "resource",
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "tag") addTag();
      if (type === "objective") addObjective();
      if (type === "resource") addResource();
    }
  };

  const getConfidentialityColor = (level: string) => {
    const colors: Record<string, string> = {
      public: "text-green-600",
      internal: "text-blue-600",
      restricted: "text-orange-600",
      confidential: "text-red-600",
    };
    return colors[level] || "text-gray-600";
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? t("cases.forms.edit.description")
                : t("cases.forms.create.description")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" />
                Basic Information
              </div>

              <InputField
                name="title"
                label="Case Title"
                placeholder="Brief title for the investigation case"
                required
              />

              <TextareaField
                name="description"
                label="Case Description"
                placeholder="Detailed description of the investigation case"
                rows={5}
                required
              />

              <TextareaField
                name="hypothesis"
                label="Working Hypothesis (Optional)"
                placeholder="Initial hypothesis or theory"
                rows={3}
              />
            </div>

            <Separator />

            {/* Classification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Classification & Assignment
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SelectField
                  name="caseType"
                  label="Case Type"
                  options={caseTypeOptions}
                  required
                />

                <SelectField
                  name="priority"
                  label="Priority"
                  options={priorityOptions}
                  required
                />

                <SelectField
                  name="classification"
                  label="Legal Classification"
                  options={classificationOptions}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  name="team"
                  label="Responsible Team"
                  options={teamOptions}
                  required
                />

                <SelectField
                  name="investigatorId"
                  label="Lead Investigator"
                  options={investigatorOptions}
                  placeholder="Select lead investigator"
                />
              </div>

              {isEditing && (
                <SelectField
                  name="status"
                  label="Case Status"
                  options={statusOptions}
                />
              )}
            </div>

            <Separator />

            {/* Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="w-4 h-4" />
                Security & Confidentiality
              </div>

              <div className="space-y-3">
                <Label>Confidentiality Level</Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {confidentialityOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        watchedConfidentiality === option.value
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() =>
                        setValue("confidentiality", option.value as any)
                      }
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-medium ${getConfidentialityColor(
                            option.value,
                          )}`}
                        >
                          {option.label}
                        </span>

                        {watchedConfidentiality === option.value && (
                          <Eye className="w-4 h-4 text-primary" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  ))}
                </div>

                {errors.confidentiality && (
                  <p className="text-sm text-red-500">
                    {errors.confidentiality.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Scope */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4" />
                Investigation Scope & Timeline
              </div>

              <TextareaField
                name="scope"
                label="Investigation Scope"
                placeholder="Define the scope"
                rows={4}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Start Date</Label>
                  <Input
                    type="date"
                    {...methods.register("timeline.estimatedStart")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated End Date</Label>
                  <Input
                    type="date"
                    {...methods.register("timeline.estimatedEnd")}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Investigation Objectives */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4" />
                Investigation Objectives
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add investigation objective"
                    value={objectiveInput}
                    onChange={(e) => setObjectiveInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "objective")}
                    className="flex-1"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addObjective()}
                  >
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Common objectives (click to add):
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {objectiveTemplates.map((item) => (
                      <Button
                        key={item}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => addObjective(item)}
                        disabled={watchedObjectives.includes(item)}
                      >
                        + {item}
                      </Button>
                    ))}
                  </div>
                </div>

                {watchedObjectives.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Objectives:</Label>

                    <div className="space-y-2">
                      {watchedObjectives.map((objective, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted p-2 rounded"
                        >
                          <span className="text-sm">{objective}</span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeObjective(objective)}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.objectives && (
                  <p className="text-sm text-red-500">
                    {errors.objectives.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Resources */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings className="w-4 h-4" />
                Required Resources
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add required resource"
                    value={resourceInput}
                    onChange={(e) => setResourceInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "resource")}
                    className="flex-1"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addResource()}
                  >
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Common resources (click to add):
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {resourceTemplates.map((item) => (
                      <Button
                        key={item}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => addResource(item)}
                        disabled={watchedResources.includes(item)}
                      >
                        + {item}
                      </Button>
                    ))}
                  </div>
                </div>

                {watchedResources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedResources.map((resource) => (
                      <Badge
                        key={resource}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => removeResource(resource)}
                      >
                        {resource}
                        <span className="ml-2 hover:bg-red-500 hover:text-white rounded-full px-1">
                          ×
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

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
                    onKeyPress={(e) => handleKeyPress(e, "tag")}
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

            {(watchedConfidentiality === "restricted" ||
              watchedConfidentiality === "confidential") && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>High Confidentiality Notice:</strong> This case
                  contains sensitive information. Ensure access controls are in
                  place and follow your organization's data handling procedures.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update Case"
                : "Create Investigation Case"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/**
 * Quick Case Form
 */
export function QuickCaseForm({
  onSuccess,
  onCancel,
}: Pick<CaseFormProps, "onSuccess" | "onCancel">) {
  const { t } = useTranslation("aegis");
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickSchema = z.object({
    title: z.string().min(5),
    caseType: z.string().min(1),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    team: z.string().min(1),
  });

  const methods = useForm({
    resolver: zodResolver(quickSchema),
    defaultValues: {
      title: "",
      caseType: "security_incident",
      priority: "medium" as const,
      team: "dfir",
    },
  });

  const onSubmit = (data: any) => {
    setIsSubmitting(true);

    void (async () => {
      try {
        await createCase({
          ...data,
          description: `Investigation case: ${data.title}`,
          confidentiality: "internal",
          classification: "administrative",
          scope: "To be defined during case planning",
          objectives: ["Investigate and document findings"],
          resources: [],
          tags: [],
          workspaceId: currentWorkspace?.id,
          timestamp: new Date(),
        });

        toast.success("Quick case created");
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
        <InputField
          name="title"
          label="Case Title"
          placeholder="Brief case description"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            name="caseType"
            label="Type"
            options={caseTypeOptions}
            required
          />
          <SelectField
            name="priority"
            label="Priority"
            options={priorityOptions}
            required
          />
        </div>

        <SelectField name="team" label="Team" options={teamOptions} required />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>

          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
