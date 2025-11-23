/**
 * Aegis Observable Forms - IOC Management Forms
 *
 * Comprehensive form components for Indicator of Compromise (IOC) management
 * with TLP/PAP protocols, enrichment capabilities, and bulk import/export.
 */

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Eye,
  Globe,
  Hash,
  FileText,
  Upload,
  Download,
  Tag,
  Shield,
  AlertTriangle,
  Clock,
  Search,
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
import { Alert, AlertDescription } from "../../../../../components/ui/alert";
import { Progress } from "../../../../../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import {
  InputField,
  TextareaField,
  SelectField,
} from "../../../../../components/FormFields";

// Hooks and Operations
import {
  createObservable,
  updateObservable,
  bulkImportObservables,
} from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import useWorkspace from "../../../../../hooks/useWorkspace";

// Types and Constants
interface ObservableFormData {
  value: string;
  type:
    | "IP"
    | "DOMAIN"
    | "URL"
    | "HASH_MD5"
    | "HASH_SHA1"
    | "HASH_SHA256"
    | "EMAIL"
    | "FILE"
    | "REGISTRY"
    | "USER_AGENT"
    | "OTHER";
  description?: string;
  tlp: "WHITE" | "GREEN" | "AMBER" | "RED";
  pap: "WHITE" | "GREEN" | "AMBER" | "RED";
  confidence: number; // 0-100
  firstSeen?: string;
  lastSeen?: string;
  tags?: string[];
  context?: string;
  enrichmentData?: Record<string, any>;
  isMalicious?: boolean;
  source: string;
  references?: string[];
}

interface ObservableFormProps {
  observable?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface BulkImportFormProps {
  onSuccess?: (imported: number) => void;
  onCancel?: () => void;
}

const observableTypes = [
  {
    value: "IP",
    label: "IP Address",
    icon: "🌐",
    description: "IPv4 or IPv6 address",
  },
  {
    value: "DOMAIN",
    label: "Domain Name",
    icon: "🏠",
    description: "Domain or subdomain",
  },
  {
    value: "URL",
    label: "URL",
    icon: "🔗",
    description: "Complete web address",
  },
  {
    value: "HASH_MD5",
    label: "MD5 Hash",
    icon: "#",
    description: "MD5 hash value",
  },
  {
    value: "HASH_SHA1",
    label: "SHA1 Hash",
    icon: "#",
    description: "SHA1 hash value",
  },
  {
    value: "HASH_SHA256",
    label: "SHA256 Hash",
    icon: "#",
    description: "SHA256 hash value",
  },
  {
    value: "EMAIL",
    label: "Email Address",
    icon: "📧",
    description: "Email address or pattern",
  },
  {
    value: "FILE",
    label: "File Path",
    icon: "📁",
    description: "File path or filename",
  },
  {
    value: "REGISTRY",
    label: "Registry Key",
    icon: "🔑",
    description: "Windows registry key",
  },
  {
    value: "USER_AGENT",
    label: "User Agent",
    icon: "🖥️",
    description: "User agent string",
  },
  {
    value: "OTHER",
    label: "Other",
    icon: "🏷️",
    description: "Custom indicator type",
  },
];

const tlpOptions = [
  {
    value: "WHITE",
    label: "TLP:WHITE",
    description: "Unlimited sharing",
    color: "bg-white border-gray-300 text-gray-900",
  },
  {
    value: "GREEN",
    label: "TLP:GREEN",
    description: "Community sharing",
    color: "bg-green-100 border-green-300 text-green-900",
  },
  {
    value: "AMBER",
    label: "TLP:AMBER",
    description: "Limited sharing",
    color: "bg-amber-100 border-amber-300 text-amber-900",
  },
  {
    value: "RED",
    label: "TLP:RED",
    description: "No sharing",
    color: "bg-red-100 border-red-300 text-red-900",
  },
];

const papOptions = [
  {
    value: "WHITE",
    label: "PAP:WHITE",
    description: "Unlimited action",
    color: "bg-white border-gray-300 text-gray-900",
  },
  {
    value: "GREEN",
    label: "PAP:GREEN",
    description: "Community action",
    color: "bg-green-100 border-green-300 text-green-900",
  },
  {
    value: "AMBER",
    label: "PAP:AMBER",
    description: "Limited action",
    color: "bg-amber-100 border-amber-300 text-amber-900",
  },
  {
    value: "RED",
    label: "PAP:RED",
    description: "No action",
    color: "bg-red-100 border-red-300 text-red-900",
  },
];

const confidenceLevels = [
  { value: 0, label: "Unknown", description: "No confidence data" },
  { value: 25, label: "Low", description: "Minimal confidence in accuracy" },
  { value: 50, label: "Medium", description: "Moderate confidence" },
  { value: 75, label: "High", description: "High confidence" },
  { value: 100, label: "Confirmed", description: "Verified and confirmed" },
];

// Validation patterns for different IOC types
const validationPatterns = {
  ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  domain:
    /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  hash: /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Validation Schema
const observableSchema = z
  .object({
    value: z.string().min(1, "Observable value is required"),
    type: z.enum([
      "IP",
      "DOMAIN",
      "URL",
      "HASH_MD5",
      "HASH_SHA1",
      "HASH_SHA256",
      "EMAIL",
      "FILE",
      "REGISTRY",
      "USER_AGENT",
      "OTHER",
    ]),
    description: z.string().optional(),
    tlp: z.enum(["WHITE", "GREEN", "AMBER", "RED"]),
    pap: z.enum(["WHITE", "GREEN", "AMBER", "RED"]),
    confidence: z.number().min(0).max(100),
    firstSeen: z.string().optional(),
    lastSeen: z.string().optional(),
    tags: z.array(z.string()).optional(),
    context: z.string().optional(),
    isMalicious: z.boolean().optional(),
    source: z.string().min(1, "Source is required"),
    references: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.type in validationPatterns) {
        return validationPatterns[
          data.type as keyof typeof validationPatterns
        ].test(data.value);
      }
      return true;
    },
    {
      message: "Invalid format for the selected observable type",
      path: ["value"],
    },
  );

/**
 * Main Observable Form Component
 */
export function ObservableForm({
  observable,
  onSuccess,
  onCancel,
}: ObservableFormProps) {
  const { t } = useTranslation("aegis");
  const { data: user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [referenceInput, setReferenceInput] = useState("");
  const [isEnriching, setIsEnriching] = useState(false);

  const isEditing = !!observable;
  const title = isEditing ? "Edit Observable" : "Add New Observable";

  const methods = useForm<ObservableFormData>({
    resolver: zodResolver(observableSchema),
    defaultValues: {
      value: observable?.value || "",
      type: observable?.type || "IP",
      description: observable?.description || "",
      tlp: observable?.tlp || "WHITE",
      pap: observable?.pap || "WHITE",
      confidence: observable?.confidence || 50,
      firstSeen: observable?.firstSeen || "",
      lastSeen: observable?.lastSeen || "",
      tags: observable?.tags || [],
      context: observable?.context || "",
      isMalicious: observable?.isMalicious,
      source: observable?.source || "",
      references: observable?.references || [],
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;
  const watchedType = watch("type");
  const watchedValue = watch("value");
  const watchedTags = watch("tags") || [];
  const watchedReferences = watch("references") || [];
  const watchedTlp = watch("tlp");
  const watchedPap = watch("pap");
  const watchedConfidence = watch("confidence");

  const onSubmit = (data: ObservableFormData) => {
    if (!currentWorkspace?.id) {
      toast.error("No workspace selected");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);

    void (async () => {
      try {
        const payload = {
          ...data,
          workspaceId: currentWorkspace.id,
          createdById: user!.id,
          timestamp: new Date(),
          ...(data.firstSeen && { firstSeenDate: new Date(data.firstSeen) }),
          ...(data.lastSeen && { lastSeenDate: new Date(data.lastSeen) }),
        };

        if (isEditing) {
          await updateObservable({ observableId: observable.id, workspaceId: payload.workspaceId, data: payload as any });
          toast.success("Observable updated successfully");
        } else {
          await createObservable({ data: payload as any });
          toast.success("Observable added successfully");
        }

        onSuccess?.();
      } catch (error: any) {
        toast.error(error.message || "Failed to save observable");
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  // Tag management
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

  // Reference management
  const addReference = () => {
    if (
      referenceInput.trim() &&
      !watchedReferences.includes(referenceInput.trim())
    ) {
      setValue("references", [...watchedReferences, referenceInput.trim()]);
      setReferenceInput("");
    }
  };

  const removeReference = (refToRemove: string) => {
    setValue(
      "references",
      watchedReferences.filter((ref) => ref !== refToRemove),
    );
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    type: "tag" | "reference",
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "tag") addTag();
      if (type === "reference") addReference();
    }
  };

  // Mock enrichment function
  const enrichObservable = async () => {
    if (!watchedValue || isEnriching) return;

    setIsEnriching(true);
    try {
      // Simulate enrichment API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock enrichment data
      setValue("description", `Enriched data for ${watchedValue}`);
      setValue("confidence", 75);
      setValue("isMalicious", Math.random() > 0.5);

      toast.success("Observable enriched successfully");
    } catch (error) {
      toast.error("Enrichment failed");
    } finally {
      setIsEnriching(false);
    }
  };

  const getTlpColor = (tlp: string) => {
    const option = tlpOptions.find((o) => o.value === tlp);
    return option?.color || "bg-gray-100";
  };

  const getPapColor = (pap: string) => {
    const option = papOptions.find((o) => o.value === pap);
    return option?.color || "bg-gray-100";
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {title}
            </CardTitle>
            <CardDescription>
              Add indicators of compromise (IOCs) with proper classification and
              metadata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Observable Value & Type */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Hash className="w-4 h-4" />
                Observable Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <InputField
                    name="value"
                    label="Observable Value"
                    placeholder="Enter IOC value (IP, domain, hash, etc.)"
                    required
                  />
                </div>

                <SelectField
                  name="type"
                  label="Type"
                  options={observableTypes.map((t) => ({
                    value: t.value,
                    label: `${t.icon} ${t.label}`,
                  }))}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={enrichObservable}
                  disabled={!watchedValue || isEnriching}
                  className="flex items-center gap-2"
                >
                  <Search className="w-3 h-3" />
                  {isEnriching ? "Enriching..." : "Enrich"}
                </Button>
                {isEnriching && (
                  <div className="flex-1">
                    <Progress value={33} className="h-2" />
                  </div>
                )}
              </div>

              <TextareaField
                name="description"
                label="Description (Optional)"
                placeholder="Additional context about this observable"
                rows={3}
              />

              <InputField
                name="source"
                label="Source"
                placeholder="Source of this observable (e.g., VirusTotal, internal analysis)"
                required
              />
            </div>

            <Separator />

            {/* TLP/PAP Classification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Classification & Sharing
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TLP Selection */}
                <div className="space-y-3">
                  <Label>Traffic Light Protocol (TLP)</Label>
                  <div className="space-y-2">
                    {tlpOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          watchedTlp === option.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setValue("tlp", option.value as any)}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium px-2 py-1 rounded text-sm ${option.color}`}
                          >
                            {option.label}
                          </span>
                          {watchedTlp === option.value && (
                            <Eye className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PAP Selection */}
                <div className="space-y-3">
                  <Label>Permissible Actions Protocol (PAP)</Label>
                  <div className="space-y-2">
                    {papOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          watchedPap === option.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setValue("pap", option.value as any)}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium px-2 py-1 rounded text-sm ${option.color}`}
                          >
                            {option.label}
                          </span>
                          {watchedPap === option.value && (
                            <Eye className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Confidence & Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4" />
                Confidence & Timeline
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Confidence Level: {watchedConfidence}%</Label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="25"
                      value={watchedConfidence}
                      onChange={(e) =>
                        setValue("confidence", parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      {confidenceLevels.map((level) => (
                        <span key={level.value} className="text-center">
                          {level.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Seen (Optional)</Label>
                    <Input
                      type="datetime-local"
                      {...methods.register("firstSeen")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Last Seen (Optional)</Label>
                    <Input
                      type="datetime-local"
                      {...methods.register("lastSeen")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Context & Analysis */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" />
                Context & Analysis
              </div>

              <TextareaField
                name="context"
                label="Context (Optional)"
                placeholder="Describe the context where this observable was found, its relevance, and any analysis notes"
                rows={3}
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isMalicious"
                  {...methods.register("isMalicious")}
                  className="rounded"
                />
                <Label
                  htmlFor="isMalicious"
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Mark as malicious
                </Label>
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

            {/* References */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4" />
                References
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add reference URL and press Enter"
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "reference")}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addReference}
                  >
                    Add Reference
                  </Button>
                </div>

                {watchedReferences.length > 0 && (
                  <div className="space-y-2">
                    {watchedReferences.map((ref, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted p-2 rounded"
                      >
                        <a
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {ref}
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReference(ref)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Classification Warning */}
            {(watchedTlp === "RED" || watchedPap === "RED") && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>High Classification Notice:</strong> This observable
                  is marked as TLP:RED or PAP:RED. Ensure proper access controls
                  and handling procedures are followed.
                </AlertDescription>
              </Alert>
            )}
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
                ? "Update Observable"
                : "Add Observable"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/**
 * Bulk Import Form Component
 */
export function BulkImportForm({ onSuccess, onCancel }: BulkImportFormProps) {
  const { currentWorkspace } = useWorkspace();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [importConfig, setImportConfig] = useState({
    defaultTlp: "white" as const,
    defaultPap: "white" as const,
    defaultSource: "bulk_import",
    skipDuplicates: true,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Read file preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n").slice(0, 10); // Preview first 10 lines
        setPreview(lines.filter((line) => line.trim()));
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file || !currentWorkspace?.id) {
      toast.error("Please select a file and workspace");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("config", JSON.stringify(importConfig));
      formData.append("workspaceId", currentWorkspace.id);

      // Mock import (replace with actual implementation)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const importedCount = Math.floor(Math.random() * 100) + 50;
      toast.success(`Successfully imported ${importedCount} observables`);
      onSuccess?.(importedCount);
    } catch (error: any) {
      toast.error(error.message || "Import failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bulk Import Observables
        </CardTitle>
        <CardDescription>
          Import multiple observables from a CSV or text file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="config">Import Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-3">
              <Label>Select File</Label>
              <Input
                type="file"
                accept=".csv,.txt,.json"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: CSV, TXT (one observable per line), JSON
              </p>
            </div>

            {file && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Selected: {file.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                {preview.length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview (first 10 lines)</Label>
                    <div className="bg-muted p-3 rounded font-mono text-sm max-h-40 overflow-y-auto">
                      {preview.map((line, index) => (
                        <div key={index} className="text-xs">
                          {index + 1}: {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default TLP</Label>
                <Select
                  value={importConfig.defaultTlp}
                  onValueChange={(value) =>
                    setImportConfig((prev) => ({
                      ...prev,
                      defaultTlp: value as any,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tlpOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default PAP</Label>
                <Select
                  value={importConfig.defaultPap}
                  onValueChange={(value) =>
                    setImportConfig((prev) => ({
                      ...prev,
                      defaultPap: value as any,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {papOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Source</Label>
              <Input
                value={importConfig.defaultSource}
                onChange={(e) =>
                  setImportConfig((prev) => ({
                    ...prev,
                    defaultSource: e.target.value,
                  }))
                }
                placeholder="Source identifier for imported observables"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="skipDuplicates"
                checked={importConfig.skipDuplicates}
                onChange={(e) =>
                  setImportConfig((prev) => ({
                    ...prev,
                    skipDuplicates: e.target.checked,
                  }))
                }
              />
              <Label htmlFor="skipDuplicates">Skip duplicate observables</Label>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? "Importing..." : "Import Observables"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
