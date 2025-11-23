/**
 * Enhanced Alert Form (FORTMATE Edition)
 * ---------------------------------------
 * Estrutura totalmente revisada para:
 * - Legibilidade
 * - Componentização
 * - Padronização
 * - Tipagem forte
 * - Erros centralizados
 * - Validação via Zod
 */

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2 } from "lucide-react";

// UI
import { Button } from "../../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";

import {
  InputField,
  TextareaField,
  SelectField,
} from "../../../../../components/FormFields";

// Hooks / Ops
import { createAlert, updateAlert } from "wasp/client/operations";
import useWorkspace from "../../../../../hooks/useWorkspace";

// Validation / Errors
import { alertFormSchema, quickAlertFormSchema } from "../validation/ValidationSchemas";
import {
  FormErrorBoundary,
  FormError,
  useErrorHandler,
} from "../error/ErrorHandling";

// Types
interface EnhancedAlertFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: "full" | "quick";
}

interface AlertFormData {
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "NEW" | "ACKNOWLEDGED" | "INVESTIGATING" | "RESOLVED";
  source: string;
  sourceId?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  assigneeId?: string;
  dueDate?: string;
  metadata?: Record<string, any>;
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
  { value: "malware", label: "Malware" },
  { value: "phishing", label: "Phishing" },
  { value: "intrusion", label: "Intrusion" },
  { value: "data_breach", label: "Data Breach" },
  { value: "dos", label: "Denial of Service" },
  { value: "other", label: "Other" },
];

export function EnhancedAlertForm({
  initialData,
  onSuccess,
  onCancel,
  variant = "full",
}: EnhancedAlertFormProps) {
  const { currentWorkspace } = useWorkspace();
  const { handleError, handleSubmission } = useErrorHandler();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationSchema = variant === "quick" ? quickAlertFormSchema : alertFormSchema;

  const methods = useForm<AlertFormData>({
    resolver: zodResolver(validationSchema as any),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      severity: initialData?.severity || "MEDIUM",
      status: initialData?.status || "NEW",
      source: initialData?.source || "",
      sourceId: initialData?.sourceId || "",
      category: initialData?.category || "",
      subcategory: initialData?.subcategory || "",
      tags: initialData?.tags || [],
      assigneeId: initialData?.assigneeId || "",
      dueDate: initialData?.dueDate || "",
      metadata: initialData?.metadata || {},
    },
  });

  const { handleSubmit, formState } = methods;
  const { errors, isValid, isDirty } = formState;
  const isEditing = !!initialData?.id;

  // ---------------------------------------
  // SUBMIT HANDLER
  // ---------------------------------------
  const onSubmit = (data: AlertFormData) => {
    if (!currentWorkspace?.id) {
      return handleError(new Error("No workspace selected"));
    }

    void (async () => {
      const operation = async () => {
        const payload = {
          title: data.title,
          description: data.description,
          severity: data.severity,
          status: data.status,
          source: data.source,
          sourceId: data.sourceId,
          category: data.category,
          subcategory: data.subcategory,
          tags: data.tags,
          assigneeId: data.assigneeId,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          workspaceId: currentWorkspace.id,
          metadata: data.metadata,
        };

        return isEditing
          ? updateAlert({ alertId: initialData.id, workspaceId: currentWorkspace.id, data: payload })
          : createAlert({ data: payload });
      };

      const result = await handleSubmission(operation, {
        loadingMessage: isEditing ? "Updating alert..." : "Creating alert...",
        successMessage: isEditing
          ? "Alert updated successfully!"
          : "Alert created successfully!",
        errorContext: "Alert Form",
        onSuccess: () => onSuccess?.(),
      });

      if (result.success) console.log("Alert Result:", result.result);
    })();
  };

  // ---------------------------------------
  // CANCEL HANDLER
  // ---------------------------------------
  const handleCancel = () => {
    if (isDirty && !window.confirm("Unsaved changes. Cancel anyway?")) {
      return;
    }
    onCancel?.();
  };

  // ---------------------------------------
  // RENDER
  // ---------------------------------------
  return (
    <FormErrorBoundary
      onError={(err, info) =>
        console.error("EnhancedAlertForm Boundary:", err, info)
      }
      resetKeys={[currentWorkspace?.id, initialData?.id]}
    >
      <FormProvider {...methods}>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit as any)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {isEditing ? "Edit Alert" : "Create Alert"}
                {variant === "quick" && (
                  <span className="text-muted-foreground text-sm">(Quick)</span>
                )}
              </CardTitle>
              <CardDescription>
                {variant === "quick"
                  ? "Quick alert with minimal fields."
                  : "Full alert with complete security metadata."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* ----- BASIC FIELDS ----- */}
              <InputField
                name="title"
                label="Alert Title"
                required
                placeholder="Enter alert title"
              />
              <FormError error={errors.title?.message} />

              <TextareaField
                name="description"
                label="Description"
                required
                rows={4}
                placeholder="Describe the alert"
              />
              <FormError error={errors.description?.message} />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField
                  name="severity"
                  label="Severity"
                  required
                  options={severityOptions}
                />
                <FormError error={errors.severity?.message} />

                <SelectField
                  name="status"
                  label="Status"
                  required
                  options={statusOptions}
                />
                <FormError error={errors.status?.message} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  name="source"
                  label="Source"
                  required
                  placeholder="SIEM, EDR, Manual..."
                />
                <FormError error={errors.source?.message} />

                <InputField
                  name="sourceId"
                  label="Source ID"
                  placeholder="External Reference"
                />
              </div>

              {/* ----- FULL FORM EXTRA FIELDS ----- */}
              {variant === "full" && (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField
                      name="category"
                      label="Category"
                      required
                      options={categoryOptions}
                    />
                    <FormError error={errors.category?.message} />

                    <InputField
                      name="subcategory"
                      label="Subcategory"
                      placeholder="Optional detail"
                    />
                  </div>

                  <InputField
                    name="dueDate"
                    type="text"
                    placeholder="YYYY-MM-DD"
                    label="Due Date"
                  />
                  <FormError error={errors.dueDate?.message} />
                </>
              )}
            </CardContent>
          </Card>

          {/* ----- ACTION BUTTONS ----- */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing
                ? isSubmitting
                  ? "Updating..."
                  : "Update Alert"
                : isSubmitting
                  ? "Creating..."
                  : "Create Alert"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </FormErrorBoundary>
  );
}
