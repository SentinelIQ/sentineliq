/**
 * Aegis Evidence Forms - Evidence Management Forms
 *
 * Comprehensive form components for digital evidence management with
 * chain of custody, integrity verification, and metadata handling.
 */

import React, { useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Upload,
  FileText,
  Shield,
  Hash,
  Clock,
  User,
  Lock,
  CheckCircle,
  AlertTriangle,
  Download,
  Eye,
  Search,
  Tag,
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
import { Alert, AlertDescription } from "../../../../../components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../components/ui/tabs";
import {
  InputField,
  TextareaField,
  SelectField,
} from "../../../../../components/FormFields";

// Hooks & Operations
import { uploadEvidence, addCustodyLog } from "wasp/client/operations";
import useWorkspace from "../../../../../hooks/useWorkspace";

// Types
interface EvidenceFormData {
  name: string;
  description: string;
  evidenceType:
    | "EMAIL"
    | "NETWORK"
    | "FILE"
    | "LOG"
    | "SCREENSHOT"
    | "MEMORY_DUMP"
    | "DISK_IMAGE"
    | "OTHER";
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  hashMd5?: string;
  hashSha1?: string;
  hashSha256?: string;
  location: string;
  collectionMethod: string;
  collectedBy?: string;
  collectionDate: string;
  tags?: string[];
  isEncrypted?: boolean;
  encryptionMethod?: string;
  accessRestrictions?: string;
  legalHold?: boolean;
  retentionPeriod?: number;
  notes?: string;
}

interface EvidenceUploadFormProps {
  caseId: string;
  onSuccess?: (evidence: any) => void;
  onCancel?: () => void;
}

interface CustodyLogFormProps {
  evidenceId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Select Options
const evidenceTypes = [
  {
    value: "FILE",
    label: "Digital File",
    icon: "📄",
    description: "Documents, executables, archives",
  },
  {
    value: "DISK_IMAGE",
    label: "Disk Image",
    icon: "💽",
    description: "Hard drive, USB, memory card images",
  },
  {
    value: "LOG",
    label: "Log File",
    icon: "📋",
    description: "System logs, application logs",
  },
  {
    value: "NETWORK",
    label: "Network Capture",
    icon: "🌐",
    description: "PCAP files, network logs",
  },
  {
    value: "MEMORY_DUMP",
    label: "Memory Dump",
    icon: "🧠",
    description: "RAM dumps, process memory",
  },
  {
    value: "SCREENSHOT",
    label: "Screenshot",
    icon: "📸",
    description: "Screenshots, photos, images",
  },
  {
    value: "EMAIL",
    label: "Email",
    icon: "📧",
    description: "Email messages and attachments",
  },
  {
    value: "OTHER",
    label: "Other",
    icon: "📦",
    description: "Other types of evidence",
  },
];

const collectionMethods = [
  { value: "manual_copy", label: "Manual Copy" },
  { value: "forensic_imaging", label: "Forensic Imaging" },
  { value: "live_acquisition", label: "Live Acquisition" },
  { value: "network_capture", label: "Network Capture" },
  { value: "memory_dump", label: "Memory Dump" },
  { value: "automated_collection", label: "Automated Collection" },
  { value: "physical_seizure", label: "Physical Seizure" },
  { value: "cloud_download", label: "Cloud Download" },
];

const custodyActions = [
  { value: "collected", label: "Evidence Collected" },
  { value: "transferred", label: "Evidence Transferred" },
  { value: "accessed", label: "Evidence Accessed" },
  { value: "analyzed", label: "Evidence Analyzed" },
  { value: "copied", label: "Evidence Copied" },
  { value: "returned", label: "Evidence Returned" },
  { value: "destroyed", label: "Evidence Destroyed" },
];

const userOptions = [
  { value: "user1", label: "John Doe - Lead Investigator" },
  { value: "user2", label: "Jane Smith - Forensic Analyst" },
  { value: "user3", label: "Mike Johnson - SOC Analyst" },
];

// ZOD Validation
const evidenceSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(1000),
  evidenceType: z.enum([
    "EMAIL",
    "NETWORK",
    "FILE",
    "LOG",
    "SCREENSHOT",
    "MEMORY_DUMP",
    "DISK_IMAGE",
    "OTHER",
  ]),
  location: z.string().min(1),
  collectionMethod: z.string().min(1),
  collectedBy: z.string().optional(),
  collectionDate: z.string().min(1),
  tags: z.array(z.string()).optional(),
  isEncrypted: z.boolean().optional(),
  encryptionMethod: z.string().optional(),
  accessRestrictions: z.string().optional(),
  legalHold: z.boolean().optional(),
  retentionPeriod: z.number().min(1).max(3650).optional(),
  notes: z.string().optional(),
});

const custodyLogSchema = z.object({
  action: z.enum([
    "collected",
    "transferred",
    "accessed",
    "analyzed",
    "copied",
    "returned",
    "destroyed",
  ]),
  handledBy: z.string().min(1),
  timestamp: z.string().min(1),
  location: z.string().min(1),
  purpose: z.string().min(5).max(500),
  notes: z.string().optional(),
  signature: z.string().optional(),
});

/**
 * ==========================================================================
 *  ███████╗██╗██╗   ██╗███████╗██╗   ██╗███████╗
 *  ██╔════╝██║██║   ██║██╔════╝╚██╗ ██╔╝██╔════╝
 *  █████╗  ██║██║   ██║█████╗   ╚████╔╝ ███████╗
 *  ██╔══╝  ██║╚██╗ ██╔╝██╔══╝    ╚██╔╝  ╚════██║
 *  ██║     ██║ ╚████╔╝ ███████╗   ██║   ███████║
 *  ╚═╝     ╚═╝  ╚═══╝  ╚══════╝   ╚═╝   ╚══════╝
 *
 *  EVIDENCE UPLOAD FORM
 * ==========================================================================
 */

export function EvidenceUploadForm({
  caseId,
  onSuccess,
  onCancel,
}: EvidenceUploadFormProps) {
  const { currentWorkspace } = useWorkspace();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isCalculatingHash, setIsCalculatingHash] = useState(false);
  const [hashProgress, setHashProgress] = useState(0);

  const methods = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: {
      name: "",
      description: "",
      evidenceType: "FILE",
      location: "",
      collectionMethod: "manual_copy",
      collectedBy: "",
      collectionDate: new Date().toISOString().split("T")[0],
      tags: [],
      isEncrypted: false,
      legalHold: false,
      retentionPeriod: 365,
      notes: "",
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const watchedTags = watch("tags") || [];
  const watchedIsEncrypted = watch("isEncrypted");
  const watchedLegalHold = watch("legalHold");

  // File Select
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      setFiles(selected);

      if (selected.length > 0) {
        const f = selected[0];

        setValue("fileName", f.name);
        setValue("fileSize", f.size);
        setValue("mimeType", f.type);

        if (!watch("name")) {
          setValue("name", f.name.split(".")[0]);
        }
      }
    },
    [setValue, watch],
  );

  // Hash Calculation (Mock)
  const calculateHashes = async (file: File) => {
    setIsCalculatingHash(true);
    setHashProgress(0);

    try {
      for (let i = 0; i <= 100; i += 10) {
        setHashProgress(i);
        await new Promise((r) => setTimeout(r, 100));
      }

      setValue("hashMd5", "5d41402abc4b2a76b9719d911017c592");
      setValue("hashSha1", "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
      setValue(
        "hashSha256",
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      );

      toast.success("Hashes calculated");
    } catch {
      toast.error("Failed to calculate hashes");
    } finally {
      setIsCalculatingHash(false);
      setHashProgress(0);
    }
  };

  // Upload Submit
  const onSubmit = (data: EvidenceFormData) => {
    if (!currentWorkspace?.id || files.length === 0) {
      toast.error("Select files and workspace");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    void (async () => {
      try {
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise((r) => setTimeout(r, 200));
        }

        const payload = {
          ...data,
          caseId,
          workspaceId: currentWorkspace.id,
          files,
          collectionTimestamp: new Date(data.collectionDate),
        };

        await uploadEvidence({ data: payload as any });

        toast.success("Evidence uploaded");
        onSuccess?.(payload);
      } catch (error: any) {
        toast.error(error.message || "Upload failed");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    })();
  };

  // Tag Handling
  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue("tags", [...watchedTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      watchedTags.filter((t) => t !== tag),
    );
  };

  const onTagKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ---------------------------------- */}
        {/* FILE UPLOAD */}
        {/* ---------------------------------- */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Digital Evidence
            </CardTitle>
            <CardDescription>
              Upload and catalog digital evidence with proper chain of custody
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" />
                File Selection
              </div>

              <div className="space-y-3">
                {/* Drag Area */}
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
                  <input
                    id="evidence-upload"
                    type="file"
                    multiple
                    accept="*/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <label htmlFor="evidence-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to select or drag files here
                    </p>
                    <p className="text-xs text-gray-400">
                      All file types supported
                    </p>
                  </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files ({files.length})</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {files.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-muted p-2 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{file.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={isCalculatingHash}
                              onClick={() => calculateHashes(file)}
                            >
                              <Hash className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {isCalculatingHash && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Calculating hashes...</span>
                          <span>{hashProgress}%</span>
                        </div>

                        <Progress value={hashProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* ---------------------------------- */}
            {/* BASIC INFO */}
            {/* ---------------------------------- */}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" />
                Evidence Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  name="name"
                  label="Evidence Name"
                  required
                  placeholder="Descriptive name for the evidence"
                />

                <SelectField
                  name="evidenceType"
                  label="Evidence Type"
                  options={evidenceTypes.map((t) => ({
                    value: t.value,
                    label: `${t.icon} ${t.label}`,
                  }))}
                  required
                />
              </div>

              <TextareaField
                name="description"
                label="Description"
                required
                rows={4}
                placeholder="Detailed description of the evidence"
              />
            </div>

            <Separator />

            {/* ---------------------------------- */}
            {/* COLLECTION DETAILS */}
            {/* ---------------------------------- */}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4" />
                Collection Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  name="location"
                  label="Collection Location"
                  required
                  placeholder="Where the evidence was collected"
                />

                <SelectField
                  name="collectionMethod"
                  label="Collection Method"
                  options={collectionMethods}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  name="collectedBy"
                  label="Collected By"
                  options={userOptions}
                  placeholder="Select collector"
                />

                <div className="space-y-2">
                  <Label>Collection Date & Time</Label>
                  <Input
                    type="datetime-local"
                    {...methods.register("collectionDate")}
                  />

                  {errors.collectionDate && (
                    <p className="text-sm text-red-500">
                      {errors.collectionDate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* ---------------------------------- */}
            {/* SECURITY */}
            {/* ---------------------------------- */}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Security & Access
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isEncrypted"
                    {...methods.register("isEncrypted")}
                  />
                  <Label
                    htmlFor="isEncrypted"
                    className="flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Evidence is encrypted
                  </Label>
                </div>

                {watchedIsEncrypted && (
                  <InputField
                    name="encryptionMethod"
                    label="Encryption Method"
                    placeholder="e.g., AES-256, BitLocker"
                  />
                )}

                <TextareaField
                  name="accessRestrictions"
                  label="Access Restrictions"
                  rows={2}
                  placeholder="Special access requirements"
                />
              </div>
            </div>

            <Separator />

            {/* ---------------------------------- */}
            {/* LEGAL */}
            {/* ---------------------------------- */}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4" />
                Legal & Compliance
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="legalHold"
                    {...methods.register("legalHold")}
                  />
                  <Label
                    htmlFor="legalHold"
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Place on legal hold
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Retention Period (days)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="3650"
                      placeholder="365"
                      {...methods.register("retentionPeriod", {
                        valueAsNumber: true,
                      })}
                    />

                    <p className="text-xs text-muted-foreground">
                      How long to retain this evidence
                    </p>

                    {errors.retentionPeriod && (
                      <p className="text-sm text-red-500">
                        {errors.retentionPeriod.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* ---------------------------------- */}
            {/* TAGS */}
            {/* ---------------------------------- */}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Tag className="w-4 h-4" />
                Tags & Classification
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Add tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={onTagKey}
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

            {/* Notes */}
            <TextareaField
              name="notes"
              label="Additional Notes"
              rows={3}
              placeholder="Any additional information"
            />

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading evidence...</span>
                  <span>{uploadProgress}%</span>
                </div>

                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {watchedLegalHold && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Legal Hold:</strong> This evidence cannot be altered
                  or destroyed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button type="submit" disabled={isUploading || files.length === 0}>
            {isUploading ? "Uploading..." : "Upload Evidence"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/**
 * ==========================================================================
 *    CHAIN OF CUSTODY FORM
 * ==========================================================================
 */

export function CustodyLogForm({
  evidenceId,
  onSuccess,
  onCancel,
}: CustodyLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm({
    resolver: zodResolver(custodyLogSchema),
    defaultValues: {
      action: "accessed" as const,
      handledBy: "",
      timestamp: new Date().toISOString().slice(0, 16),
      location: "",
      purpose: "",
      notes: "",
      signature: "",
    },
  });

  const { handleSubmit, watch } = methods;
  const watchedAction = watch("action");

  const onSubmit = (data: any) => {
    setIsSubmitting(true);

    void (async () => {
      try {
        await addCustodyLog({
          evidenceId,
          ...data,
          timestamp: new Date(data.timestamp),
        });

        toast.success("Custody log added");
        onSuccess?.();
      } catch (error: any) {
        toast.error(error.message || "Failed to add log");
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, React.ReactNode> = {
      collected: <Upload className="w-4 h-4" />,
      transferred: <User className="w-4 h-4" />,
      accessed: <Eye className="w-4 h-4" />,
      analyzed: <Search className="w-4 h-4" />,
      copied: <Download className="w-4 h-4" />,
      returned: <CheckCircle className="w-4 h-4" />,
      destroyed: <AlertTriangle className="w-4 h-4" />,
    };
    return (icons[action] as React.ReactNode) ?? <Clock className="w-4 h-4" />;
  };

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Add Chain of Custody Entry
          </CardTitle>
          <CardDescription>
            Record evidence handling activity for audit trail
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                name="action"
                label="Action Performed"
                options={custodyActions}
                required
              />

              <SelectField
                name="handledBy"
                label="Handled By"
                options={userOptions}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  required
                  {...methods.register("timestamp")}
                />
              </div>

              <InputField
                name="location"
                label="Location"
                required
                placeholder="Where the action took place"
              />
            </div>

            <TextareaField
              name="purpose"
              label="Purpose"
              required
              rows={3}
              placeholder="Reason for evidence handling"
            />

            <TextareaField
              name="notes"
              label="Additional Notes"
              rows={2}
              placeholder="Any additional details"
            />

            <InputField
              name="signature"
              label="Digital Signature (Optional)"
              placeholder="Digital signature or authorization code"
            />

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getActionIcon(watchedAction)}
                <span className="font-medium">Action Summary:</span>
              </div>

              <p className="text-sm text-muted-foreground">
                This will record the evidence as{" "}
                <strong>{watchedAction}</strong> and update the audit log.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Add Custody Entry"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
