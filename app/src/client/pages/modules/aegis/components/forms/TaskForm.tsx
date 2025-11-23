/**
 * Aegis Task Forms - Task Management Forms
 *
 * Comprehensive form components for task management with dependency tracking,
 * time estimation, and status updates.
 */

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  CheckSquare,
  Clock,
  User,
  AlertCircle,
  Calendar,
  Target,
  Link,
  Flag,
  BarChart3,
} from "lucide-react";

// Components
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { Separator } from "../../../../../components/ui/separator";
import { Progress } from "../../../../../components/ui/progress";
import { Switch } from "../../../../../components/ui/switch";
import {
  InputField,
  TextareaField,
  SelectField,
} from "../../../../../components/FormFields";

// Hooks and Operations
import { createTask, updateTask } from "wasp/client/operations";
import useWorkspace from "../../../../../hooks/useWorkspace";

// Types
interface TaskFormData {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assigneeId?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  tags?: string[];
  dependencies?: string[];
  progress?: number;
  notes?: string;
  incidentId?: string;
  caseId?: string;
}

interface TaskFormProps {
  task?: any;
  incidentId?: string;
  caseId?: string;
  availableTasks?: any[];
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
  { value: "WAITING", label: "Waiting", icon: Clock },
  { value: "IN_PROGRESS", label: "In Progress", icon: BarChart3 },
  { value: "CANCELLED", label: "Cancelled", icon: AlertCircle },
  { value: "COMPLETED", label: "Completed", icon: CheckSquare },
];

// Mock user list
const userOptions = [
  { value: "user1", label: "John Doe - Senior Analyst" },
  { value: "user2", label: "Jane Smith - Lead Investigator" },
  { value: "user3", label: "Mike Johnson - SOC Manager" },
];

// Task templates
const taskTemplates = [
  {
    category: "Investigation",
    tasks: [
      "Review and analyze security logs",
      "Interview affected users or witnesses",
      "Document timeline of events",
      "Collect additional evidence",
      "Perform malware analysis",
      "Review network traffic logs",
    ],
  },
  {
    category: "Response",
    tasks: [
      "Isolate affected systems",
      "Apply security patches",
      "Reset compromised credentials",
      "Update security rules and policies",
      "Notify relevant stakeholders",
      "Coordinate with external teams",
    ],
  },
  {
    category: "Documentation",
    tasks: [
      "Prepare incident report",
      "Update case documentation",
      "Create lessons learned document",
      "Update procedures and playbooks",
      "Present findings to management",
    ],
  },
];

// Validation
const taskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(1000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  assigneeId: z.string().optional(),
  estimatedHours: z.number().min(0.1).max(1000).optional(),
  actualHours: z.number().min(0).max(1000).optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  progress: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  incidentId: z.string().optional(),
  caseId: z.string().optional(),
});

/**
 * MAIN TASK FORM
 */
export function TaskForm({
  task,
  incidentId,
  caseId,
  availableTasks = [],
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const isEditing = !!task;

  const methods = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "MEDIUM",
      status: task?.status || "WAITING",
      assigneeId: task?.assigneeId || "",
      estimatedHours: task?.estimatedHours || undefined,
      actualHours: task?.actualHours || undefined,
      dueDate: task?.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 16)
        : "",
      tags: task?.tags || [],
      dependencies: task?.dependencies || [],
      progress: task?.progress || 0,
      notes: task?.notes || "",
      incidentId: task?.incidentId || incidentId,
      caseId: task?.caseId || caseId,
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const watchedTags = watch("tags") || [];
  const watchedDependencies = watch("dependencies") || [];
  const watchedStatus = watch("status");
  const watchedProgress = watch("progress") || 0;
  const watchedEstimatedHours = watch("estimatedHours");
  const watchedActualHours = watch("actualHours");

  const onSubmit = async (data: TaskFormData) => {
    if (!currentWorkspace?.id) {
      toast.error("No workspace selected");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        workspaceId: currentWorkspace.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        ...(incidentId && { incidentId }),
        ...(caseId && { caseId }),
      };

      if (isEditing) {
        await updateTask({ taskId: task.id, workspaceId: payload.workspaceId, data: payload });
        toast.success("Task updated successfully");
      } else {
        await createTask({ data: payload, workspaceId: payload.workspaceId });
        toast.success("Task created successfully");
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * TAG MANAGEMENT
   */
  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue("tags", [...watchedTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      watchedTags.filter((tag) => tag !== tagToRemove),
    );
  };

  /**
   * DEPENDENCIES
   */
  const toggleDependency = (taskId: string) => {
    if (watchedDependencies.includes(taskId)) {
      setValue(
        "dependencies",
        watchedDependencies.filter((id) => id !== taskId),
      );
    } else {
      setValue("dependencies", [...watchedDependencies, taskId]);
    }
  };

  /**
   * APPLY TEMPLATE
   */
  const applyTemplate = (templateTask: string) => {
    if (!watch("title")) {
      setValue("title", templateTask);
    }
    if (!watch("description")) {
      setValue("description", `Task: ${templateTask}`);
    }
    setShowTemplates(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  /**
   * AUTO-UPDATE PROGRESS BASED ON STATUS
   */
  React.useEffect(() => {
    if (watchedStatus === "COMPLETED" && watchedProgress < 100) {
      setValue("progress", 100);
    } else if (watchedStatus === "WAITING" && watchedProgress > 0) {
      setValue("progress", 0);
    }
  }, [watchedStatus, watchedProgress, setValue]);

  /**
   * EFFICIENCY CALCULATION
   */
  const efficiency =
    watchedEstimatedHours && watchedActualHours
      ? ((watchedEstimatedHours / watchedActualHours) * 100).toFixed(1)
      : null;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              {isEditing ? "Edit Task" : "Create New Task"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Update task details, progress, and dependencies"
                : "Create a new task with estimates and assignments"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* -------------------------------------------------- */}
            {/* TASK INFORMATION */}
            {/* -------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="w-4 h-4" />
                  Task Information
                </div>

                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    Use Template
                  </Button>
                )}
              </div>

              {showTemplates && (
                <Card className="p-4">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Common Tasks</h4>

                    {taskTemplates.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <h5 className="text-xs font-medium text-muted-foreground uppercase">
                          {category.category}
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {category.tasks.map((taskTitle) => (
                            <Button
                              key={taskTitle}
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="justify-start text-left h-auto p-2 text-xs"
                              onClick={() => applyTemplate(taskTitle)}
                            >
                              {taskTitle}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <InputField
                name="title"
                label="Task Title"
                placeholder="Brief description of the task"
                required
              />

              <TextareaField
                name="description"
                label="Detailed Description"
                placeholder="Comprehensive description including requirements and acceptance criteria"
                rows={4}
                required
              />
            </div>

            <Separator />

            {/* -------------------------------------------------- */}
            {/* PRIORITY & ASSIGNMENT */}
            {/* -------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Flag className="w-4 h-4" />
                Priority & Assignment
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SelectField
                  name="priority"
                  label="Priority"
                  options={priorityOptions}
                  required
                />

                {isEditing && (
                  <SelectField
                    name="status"
                    label="Status"
                    options={statusOptions.map((s) => ({
                      value: s.value,
                      label: s.label,
                    }))}
                  />
                )}

                <SelectField
                  name="assigneeId"
                  label="Assigned To"
                  options={userOptions}
                  placeholder="Select assignee"
                />
              </div>
            </div>

            <Separator />

            {/* -------------------------------------------------- */}
            {/* TIME TRACKING */}
            {/* -------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4" />
                Time Tracking & Progress
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="1000"
                    placeholder="8.0"
                    {...methods.register("estimatedHours", {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.estimatedHours && (
                    <p className="text-sm text-red-500">
                      {errors.estimatedHours.message}
                    </p>
                  )}
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <Label>Actual Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="1000"
                      placeholder="6.5"
                      {...methods.register("actualHours", {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.actualHours && (
                      <p className="text-sm text-red-500">
                        {errors.actualHours.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="datetime-local"
                    {...methods.register("dueDate")}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Progress: {watchedProgress}%</Label>

                    {efficiency && (
                      <Badge
                        variant={
                          parseFloat(efficiency) > 100
                            ? "destructive"
                            : "default"
                        }
                      >
                        Efficiency: {efficiency}%
                      </Badge>
                    )}
                  </div>

                  <Progress value={watchedProgress} className="h-3" />

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={watchedProgress}
                    onChange={(e) =>
                      setValue("progress", parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* -------------------------------------------------- */}
            {/* DEPENDENCIES */}
            {/* -------------------------------------------------- */}
            {availableTasks.length > 0 && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Link className="w-4 h-4" />
                    Task Dependencies
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Select tasks that must be completed before this task can
                    start:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                    {availableTasks
                      .filter((t) => t.id !== task?.id)
                      .map((availableTask) => (
                        <div
                          key={availableTask.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            watchedDependencies.includes(availableTask.id)
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => toggleDependency(availableTask.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">
                                {availableTask.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {availableTask.status} •{" "}
                                {availableTask.priority}
                              </p>
                            </div>

                            {watchedDependencies.includes(availableTask.id) && (
                              <CheckSquare className="w-4 h-4 text-primary mt-0.5" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {watchedDependencies.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      ⚠️ This task is blocked by {watchedDependencies.length}{" "}
                      dependencies
                    </div>
                  )}
                </div>

                <Separator />
              </>
            )}

            {/* -------------------------------------------------- */}
            {/* TAGS */}
            {/* -------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4" />
                Tags & Labels
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag and press Enter"
                    className="flex-1"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
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

            {/* Additional Notes */}
            <TextareaField
              name="notes"
              label="Additional Notes (Optional)"
              rows={3}
              placeholder="Any additional information or context"
            />
          </CardContent>
        </Card>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update Task"
                : "Create Task"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/**
 * QUICK TASK FORM (SIMPLIFIED)
 */
export function QuickTaskForm({
  incidentId,
  caseId,
  onSuccess,
  onCancel,
}: Pick<TaskFormProps, "incidentId" | "caseId" | "onSuccess" | "onCancel">) {
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickSchema = z.object({
    title: z.string().min(3, "Title required"),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    assigneeId: z.string().optional(),
    estimatedHours: z.number().min(0.1).optional(),
  });

  const methods = useForm({
    resolver: zodResolver(quickSchema),
    defaultValues: {
      title: "",
      priority: "medium" as const,
      assigneeId: "",
      estimatedHours: 4,
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createTask({
        ...data,
        description: `Quick task: ${data.title}`,
        status: "pending",
        progress: 0,
        tags: [],
        dependencies: [],
        workspaceId: currentWorkspace?.id,
        ...(incidentId && { incidentId }),
        ...(caseId && { caseId }),
      });

      toast.success("Quick task created");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          name="title"
          label="Task Title"
          placeholder="Quick task description"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            name="priority"
            label="Priority"
            options={priorityOptions}
            required
          />

          <SelectField
            name="assigneeId"
            label="Assign To"
            options={userOptions}
            placeholder="Select assignee"
          />
        </div>

        <div className="space-y-2">
          <Label>Estimated Hours</Label>
          <Input
            type="number"
            step="0.5"
            min="0.1"
            {...methods.register("estimatedHours", { valueAsNumber: true })}
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
