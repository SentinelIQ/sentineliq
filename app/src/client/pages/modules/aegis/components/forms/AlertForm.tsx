/**
 * Aegis Alert Forms - Create and Edit Alert Forms
 *
 * Comprehensive form components for alert management with validation,
 * field dependencies, and proper error handling.
 */

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  AlertTriangle,
  Shield,
  Clock,
  User,
  Tag,
  FileText,
  Globe,
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
import {
  InputField,
  TextareaField,
  SelectField,
} from "../../../../../components/FormFields";

// Hooks and Operations
import { createAlert, updateAlert } from "wasp/client/operations";
import useWorkspace from "../../../../../hooks/useWorkspace";

// Types and Constants
interface AlertFormData {
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: "NEW" | "ACKNOWLEDGED" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
  source: string;
  category: string;
  threatScore?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  assignedToId?: string;
}

interface AlertFormProps {
  alert?: any; // Alert data for editing
  onSuccess?: () => void;
  onCancel?: () => void;
}

const severityOptions = [
  { value: "LOW", label: "Low", color: "text-blue-500" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-500" },
  { value: "HIGH", label: "High", color: "text-orange-500" },
  { value: "CRITICAL", label: "Critical", color: "text-red-500" },
];

const statusOptions = [
  { value: "NEW", label: "New" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "RESOLVED", label: "Resolved" },
];

const categoryOptions = [
  { value: "malware", label: "Malware Detection" },
  { value: "network", label: "Network Security" },
  { value: "data_loss", label: "Data Loss Prevention" },
  { value: "authentication", label: "Authentication Failure" },
  { value: "vulnerability", label: "Vulnerability" },
  { value: "policy_violation", label: "Policy Violation" },
  { value: "other", label: "Other" },
];

// Validation Schema
const alertSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    required_error: "Please select a severity level",
  }),
  status: z
    .enum(["NEW", "ACKNOWLEDGED", "INVESTIGATING", "RESOLVED", "DISMISSED"])
    .optional(),
  source: z.string().min(1, "Source is required").max(100),
  category: z.string().min(1, "Category is required"),
  threatScore: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  assignedToId: z.string().optional(),
});

/**
 * Main Alert Form Component
 */
export function AlertForm({ alert, onSuccess, onCancel }: AlertFormProps) {
  const { t } = useTranslation("aegis");
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const isEditing = !!alert;
  const title = isEditing
    ? t("alerts.forms.edit.title")
    : t("alerts.forms.create.title");

  const methods = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      title: alert?.title || "",
      description: alert?.description || "",
      severity: alert?.severity || "MEDIUM",
      status: alert?.status || "NEW",
      source: alert?.source || "",
      category: alert?.category || "",
      threatScore: alert?.threatScore || 50,
      tags: alert?.tags || [],
      metadata: alert?.metadata || {},
      assignedToId: alert?.assignedToId || "",
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;
  const watchedTags = watch("tags") || [];

  const onSubmit = (data: AlertFormData) => {
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
        };

        if (isEditing) {
          await updateAlert({ alertId: alert.id, workspaceId: payload.workspaceId, data: payload });
          toast.success("Alert updated successfully");
        } else {
          await createAlert({ data: payload });
          toast.success("Alert created successfully");
        }

        onSuccess?.();
      } catch (error: any) {
        toast.error(error.message || "Failed to save alert");
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue("tags", [...(watchedTags || []), tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      (watchedTags || []).filter((tag) => tag !== tagToRemove),
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? t("alerts.forms.edit.description")
                : t("alerts.forms.create.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" />
                Basic Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  name="title"
                  label="Alert Title"
                  placeholder="Enter alert title"
                  required
                />

                <InputField
                  name="source"
                  label="Source"
                  placeholder="e.g., SIEM, EDR, IDS"
                  required
                />
              </div>

              <TextareaField
                name="description"
                label="Description"
                placeholder="Detailed description of the security alert"
                rows={4}
                required
              />
            </div>

            <Separator />

            {/* Classification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Classification
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectField
                  name="severity"
                  label="Severity Level"
                  options={severityOptions}
                  required
                />

                <SelectField
                  name="category"
                  label="Category"
                  options={categoryOptions}
                  required
                />

                {isEditing && (
                  <SelectField
                    name="status"
                    label="Status"
                    options={statusOptions}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Threat Score (0-100)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="50"
                    {...methods.register("threatScore", {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.threatScore && (
                    <p className="text-sm text-red-500">
                      {errors.threatScore.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Tag className="w-4 h-4" />
                Tags
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add Tag
                  </Button>
                </div>

                {watchedTags && watchedTags.length > 0 && (
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update Alert"
                : "Create Alert"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/**
 * Quick Alert Creation Form (simplified)
 */
export function QuickAlertForm({
  onSuccess,
  onCancel,
}: Pick<AlertFormProps, "onSuccess" | "onCancel">) {
  const { t } = useTranslation("aegis");
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickSchema = z.object({
    title: z.string().min(3, "Title required"),
    severity: z.enum(["low", "medium", "high", "critical"]),
    source: z.string().min(1, "Source required"),
  });

  const methods = useForm({
    resolver: zodResolver(quickSchema),
    defaultValues: {
      title: "",
      severity: "medium" as const,
      source: "",
    },
  });

  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    void (async () => {
      try {
        await createAlert({
          ...data,
          description: `Quick alert: ${data.title}`,
          category: "other",
          workspaceId: currentWorkspace?.id,
          timestamp: new Date(),
        });
        toast.success("Quick alert created");
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
          label="Alert Title"
          placeholder="Quick alert title"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            name="severity"
            label="Severity"
            options={severityOptions}
            required
          />
          <InputField
            name="source"
            label="Source"
            placeholder="Alert source"
            required
          />
        </div>
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
