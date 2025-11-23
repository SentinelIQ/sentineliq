/**
 * Aegis Alert Bulk Operations Form
 *
 * Form component for performing bulk operations on multiple alerts
 * including assignment, status updates, tagging, and merging.
 */

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Users,
  Tag,
  CheckCircle,
  AlertTriangle,
  Merge,
  Trash2,
  UserPlus,
  Archive,
} from "lucide-react";

// Components
import { Button } from "../../../../../components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../components/ui/tabs";
import {
  SelectField,
  InputField,
  TextareaField,
} from "../../../../../components/FormFields";

// Hooks and Operations
import { bulkUpdateAegisAlerts } from "wasp/client/operations";
import useWorkspace from "../../../../../hooks/useWorkspace";

interface AlertBulkFormProps {
  selectedAlerts: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const statusOptions = [
  { value: "new", label: "New" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const severityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

// Mock users data (replace with actual user query)
const userOptions = [
  { value: "user1", label: "John Doe" },
  { value: "user2", label: "Jane Smith" },
  { value: "user3", label: "Mike Johnson" },
];

const bulkUpdateSchema = z.object({
  operation: z.enum(["status", "assign", "tag", "merge", "escalate", "delete"]),
  status: z
    .enum(["new", "acknowledged", "investigating", "resolved", "dismissed"])
    .optional(),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  notes: z.string().optional(),
  mergeTitle: z.string().optional(),
});

export function AlertBulkForm({
  selectedAlerts,
  onSuccess,
  onCancel,
}: AlertBulkFormProps) {
  const { t } = useTranslation("aegis");
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operation, setOperation] = useState<string>("status");

  const methods = useForm({
    resolver: zodResolver(bulkUpdateSchema),
    defaultValues: {
      operation: "status" as const,
      tags: [],
      notes: "",
    },
  });

  const { handleSubmit, watch, setValue } = methods;

  const onSubmit = async (data: any) => {
    if (!currentWorkspace?.id) {
      toast.error("No workspace selected");
      return;
    }

    setIsSubmitting(true);

    try {
      await bulkUpdateAegisAlerts({
        workspaceId: currentWorkspace.id,
        alertIds: selectedAlerts,
        data: {
          operation: data.operation,
          ...(data.status && { status: data.status }),
          ...(data.assignedToId && { assignedToId: data.assignedToId }),
          ...(data.tags?.length && { tags: data.tags }),
          ...(data.severity && { severity: data.severity }),
          ...(data.priority && { priority: data.priority }),
          ...(data.notes && { notes: data.notes }),
          ...(data.mergeTitle && { mergeTitle: data.mergeTitle }),
        },
      });

      const operationLabels = {
        status: "Status updated",
        assign: "Alerts assigned",
        tag: "Tags applied",
        merge: "Alerts merged",
        escalate: "Alerts escalated",
        delete: "Alerts deleted",
      };

      toast.success(
        `${
          operationLabels[data.operation as keyof typeof operationLabels]
        } successfully`,
      );
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Bulk operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Operations
          </CardTitle>
          <CardDescription>
            Perform operations on {selectedAlerts.length} selected alert
            {selectedAlerts.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs
              value={operation}
              onValueChange={setOperation}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="status" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Status
                </TabsTrigger>
                <TabsTrigger value="assign" className="text-xs">
                  <UserPlus className="w-3 h-3 mr-1" />
                  Assign
                </TabsTrigger>
                <TabsTrigger value="tag" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  Tag
                </TabsTrigger>
                <TabsTrigger value="merge" className="text-xs">
                  <Merge className="w-3 h-3 mr-1" />
                  Merge
                </TabsTrigger>
                <TabsTrigger value="escalate" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Escalate
                </TabsTrigger>
                <TabsTrigger value="delete" className="text-xs">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
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
                  name="severity"
                  label="Severity (Optional)"
                  options={severityOptions}
                  placeholder="Change severity"
                />
                <TextareaField
                  name="notes"
                  label="Notes (Optional)"
                  placeholder="Add notes about the status change"
                  rows={3}
                />
              </TabsContent>

              {/* Assignment Tab */}
              <TabsContent value="assign" className="space-y-4">
                <SelectField
                  name="assignedToId"
                  label="Assign To"
                  options={userOptions}
                  placeholder="Select user"
                  required
                />
                <SelectField
                  name="priority"
                  label="Priority (Optional)"
                  options={priorityOptions}
                  placeholder="Set priority"
                />
                <TextareaField
                  name="notes"
                  label="Assignment Notes (Optional)"
                  placeholder="Add notes about the assignment"
                  rows={3}
                />
              </TabsContent>

              {/* Tagging Tab */}
              <TabsContent value="tag" className="space-y-4">
                <TagInput />
                <TextareaField
                  name="notes"
                  label="Tag Notes (Optional)"
                  placeholder="Explain the tagging rationale"
                  rows={2}
                />
              </TabsContent>

              {/* Merge Tab */}
              <TabsContent value="merge" className="space-y-4">
                <InputField
                  name="mergeTitle"
                  label="Merged Alert Title"
                  placeholder="Title for the merged alert"
                  required
                />
                <div className="text-sm text-muted-foreground">
                  <p>
                    This will merge all {selectedAlerts.length} alerts into a
                    single alert.
                  </p>
                  <p className="text-amber-600 font-medium mt-1">
                    ⚠️ This action cannot be undone.
                  </p>
                </div>
                <TextareaField
                  name="notes"
                  label="Merge Notes"
                  placeholder="Describe why these alerts are being merged"
                  rows={3}
                  required
                />
              </TabsContent>

              {/* Escalate Tab */}
              <TabsContent value="escalate" className="space-y-4">
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
                <TextareaField
                  name="notes"
                  label="Escalation Reason"
                  placeholder="Explain why these alerts are being escalated"
                  rows={3}
                  required
                />
              </TabsContent>

              {/* Delete Tab */}
              <TabsContent value="delete" className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-red-800 font-medium">
                        Delete {selectedAlerts.length} Alert
                        {selectedAlerts.length > 1 ? "s" : ""}
                      </h4>
                      <p className="text-red-700 text-sm mt-1">
                        This action cannot be undone. The alerts will be
                        permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
                <TextareaField
                  name="notes"
                  label="Deletion Reason"
                  placeholder="Explain why these alerts are being deleted"
                  rows={3}
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
                variant={operation === "delete" ? "destructive" : "default"}
              >
                {isSubmitting
                  ? "Processing..."
                  : `Apply to ${selectedAlerts.length} Alert${
                      selectedAlerts.length > 1 ? "s" : ""
                    }`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

/**
 * Tag Input Component for bulk tagging
 */
function TagInput() {
  const { setValue, watch } = useForm();
  const [tagInput, setTagInput] = useState("");
  const tags = watch("tags") || [];

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((tag: string) => tag !== tagToRemove),
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add tag and press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <Button type="button" variant="outline" onClick={addTag}>
          Add
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: string) => (
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
  );
}
