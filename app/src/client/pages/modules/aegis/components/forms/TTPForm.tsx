/**
 * Aegis TTP Forms - MITRE ATT&CK Framework Forms
 *
 * Form components for mapping Tactics, Techniques, and Procedures
 * using the MITRE ATT&CK framework with occurrence tracking.
 */

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Target,
  Search,
  Shield,
  AlertTriangle,
  Calendar,
  BarChart3,
  Book,
  ExternalLink,
  CheckSquare,
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

// Hooks and Operations
import { linkTTP, updateTTPOccurrence } from "wasp/client/operations";
import useWorkspace from "../../../../../hooks/useWorkspace";

// Types and Constants
interface TTPFormData {
  tacticId: string;
  techniqueId: string;
  subTechniqueId?: string;
  description?: string;
  confidence: number; // 0-100
  firstObserved?: string;
  lastObserved?: string;
  occurrenceCount: number;
  severity: "low" | "medium" | "high" | "critical";
  evidenceDescription: string;
  mitigation?: string;
  notes?: string;
  caseId: string;
}

interface TTPFormProps {
  caseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface TTPOccurrenceFormProps {
  ttpId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// MITRE ATT&CK Tactics (simplified list)
const tactics = [
  {
    id: "TA0001",
    name: "Initial Access",
    description: "Getting into your network",
  },
  { id: "TA0002", name: "Execution", description: "Running malicious code" },
  { id: "TA0003", name: "Persistence", description: "Maintaining foothold" },
  {
    id: "TA0004",
    name: "Privilege Escalation",
    description: "Gaining higher-level permissions",
  },
  {
    id: "TA0005",
    name: "Defense Evasion",
    description: "Avoiding being detected",
  },
  {
    id: "TA0006",
    name: "Credential Access",
    description: "Stealing account names and passwords",
  },
  {
    id: "TA0007",
    name: "Discovery",
    description: "Figuring out your environment",
  },
  {
    id: "TA0008",
    name: "Lateral Movement",
    description: "Moving through your environment",
  },
  {
    id: "TA0009",
    name: "Collection",
    description: "Gathering data of interest",
  },
  { id: "TA0010", name: "Exfiltration", description: "Stealing data" },
  {
    id: "TA0011",
    name: "Command and Control",
    description: "Communicating with compromised systems",
  },
  {
    id: "TA0040",
    name: "Impact",
    description: "Manipulate, interrupt, or destroy systems and data",
  },
];

// Techniques sample
const techniquesByTactic = {
  TA0001: [
    {
      id: "T1566",
      name: "Phishing",
      description: "Spear phishing emails, links, or attachments",
    },
    {
      id: "T1190",
      name: "Exploit Public-Facing Application",
      description: "Leverage software vulnerabilities",
    },
    {
      id: "T1133",
      name: "External Remote Services",
      description: "Remote services such as VPNs, RDP",
    },
  ],
  TA0002: [
    {
      id: "T1059",
      name: "Command and Scripting Interpreter",
      description: "Command-line interfaces and scripting",
    },
    {
      id: "T1053",
      name: "Scheduled Task/Job",
      description: "Schedule execution of code or commands",
    },
    {
      id: "T1204",
      name: "User Execution",
      description: "User opens malicious file",
    },
  ],
  TA0003: [
    {
      id: "T1547",
      name: "Boot or Logon Autostart Execution",
      description: "Auto-execute during startup",
    },
    {
      id: "T1546",
      name: "Event Triggered Execution",
      description: "Execute based on specific events",
    },
    {
      id: "T1574",
      name: "Hijack Execution Flow",
      description: "Execute own code by hijacking normal execution",
    },
  ],
};

// Sub-techniques
const subTechniquesByTechnique = {
  T1566: [
    { id: "T1566.001", name: "Spearphishing Attachment" },
    { id: "T1566.002", name: "Spearphishing Link" },
    { id: "T1566.003", name: "Spearphishing via Service" },
  ],
  T1059: [
    { id: "T1059.001", name: "PowerShell" },
    { id: "T1059.003", name: "Windows Command Shell" },
    { id: "T1059.006", name: "Python" },
  ],
};

const severityOptions = [
  { value: "low", label: "Low", color: "text-blue-500" },
  { value: "medium", label: "Medium", color: "text-yellow-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "critical", label: "Critical", color: "text-red-500" },
];

const confidenceLevels = [
  { value: 0, label: "Unknown", description: "No confidence data" },
  { value: 25, label: "Low", description: "Limited evidence or analysis" },
  { value: 50, label: "Medium", description: "Some evidence and analysis" },
  { value: 75, label: "High", description: "Strong evidence and analysis" },
  { value: 100, label: "Confirmed", description: "Verified and confirmed" },
];

// Validation Schema
const ttpSchema = z.object({
  tacticId: z.string().min(1, "Please select a tactic"),
  techniqueId: z.string().min(1, "Please select a technique"),
  subTechniqueId: z.string().optional(),
  description: z.string().optional(),
  confidence: z.number().min(0).max(100),
  firstObserved: z.string().optional(),
  lastObserved: z.string().optional(),
  occurrenceCount: z.number().min(1, "Occurrence count must be at least 1"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  evidenceDescription: z
    .string()
    .min(10, "Please describe the evidence supporting this TTP"),
  mitigation: z.string().optional(),
  notes: z.string().optional(),
  caseId: z.string().min(1),
});

const occurrenceSchema = z.object({
  observedDate: z.string().min(1, "Observation date is required"),
  description: z.string().min(5, "Please describe this occurrence"),
  confidence: z.number().min(0).max(100),
  evidenceFiles: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

/**
 * Main TTP Mapping Form Component
 */

export function TTPForm({ caseId, onSuccess, onCancel }: TTPFormProps) {
  const { t } = useTranslation("aegis");
  const { currentWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const methods = useForm<TTPFormData>({
    resolver: zodResolver(ttpSchema),
    defaultValues: {
      tacticId: "",
      techniqueId: "",
      subTechniqueId: "",
      description: "",
      confidence: 75,
      firstObserved: "",
      lastObserved: "",
      occurrenceCount: 1,
      severity: "medium",
      evidenceDescription: "",
      mitigation: "",
      notes: "",
      caseId,
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const watchedTacticId = watch("tacticId");
  const watchedTechniqueId = watch("techniqueId");
  const watchedConfidence = watch("confidence");
  const watchedOccurrenceCount = watch("occurrenceCount");

  const availableTechniques = watchedTacticId
    ? techniquesByTactic[watchedTacticId as keyof typeof techniquesByTactic] ||
      []
    : [];

  const availableSubTechniques = watchedTechniqueId
    ? subTechniquesByTechnique[
        watchedTechniqueId as keyof typeof subTechniquesByTechnique
      ] || []
    : [];

  const selectedTactic = tactics.find((t) => t.id === watchedTacticId);
  const selectedTechnique = availableTechniques.find(
    (t) => t.id === watchedTechniqueId,
  );

  const onSubmit = (data: TTPFormData) => {
    if (!currentWorkspace?.id) {
      toast.error("No workspace selected");
      return;
    }

    setIsSubmitting(true);

    void (async () => {
      try {
        const payload = {
          resourceId: data.caseId,
          resourceType: 'CASE' as const,
          workspaceId: currentWorkspace.id,
          tacticId: data.tacticId,
          tacticName: selectedTactic?.name || '',
          techniqueId: data.techniqueId,
          techniqueName: selectedTechnique?.name || '',
          subtechniqueId: data.subTechniqueId,
          subtechniqueName: data.subTechniqueId ? availableSubTechniques.find(st => st.id === data.subTechniqueId)?.name : undefined,
          description: data.evidenceDescription,
          severity: data.severity,
          confidence: data.confidence,
        };

        await linkTTP(payload);
        toast.success("TTP mapping added successfully");
        onSuccess?.();
      } catch (error: any) {
        toast.error(error.message || "Failed to add TTP mapping");
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  // Filtering
  const filteredTactics = tactics.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredTechniques = availableTechniques.filter(
    (tech) =>
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Reset logic
  React.useEffect(() => {
    if (watchedTacticId) {
      setValue("techniqueId", "");
      setValue("subTechniqueId", "");
    }
  }, [watchedTacticId, setValue]);

  React.useEffect(() => {
    if (watchedTechniqueId) {
      setValue("subTechniqueId", "");
    }
  }, [watchedTechniqueId, setValue]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Map MITRE ATT&CK TTP
            </CardTitle>
            <CardDescription>
              Associate observed tactics, techniques, and procedures with this
              case.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Tabs */}
            <Tabs defaultValue="selection" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="selection">TTP Selection</TabsTrigger>
                <TabsTrigger value="evidence">Evidence & Analysis</TabsTrigger>
                <TabsTrigger value="occurrence">Occurrence Details</TabsTrigger>
              </TabsList>

              {/* Selection Tab */}
              <TabsContent value="selection" className="space-y-6">
                {/* Search */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Search className="w-4 h-4" />
                    Search & Select
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tactics and techniques..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Separator />

                {/* Tactic Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    Select Tactic
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredTactics.map((tactic) => (
                      <div
                        key={tactic.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          watchedTacticId === tactic.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setValue("tacticId", tactic.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {tactic.id}
                          </span>
                          {watchedTacticId === tactic.id && (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm">{tactic.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {tactic.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {errors.tacticId && (
                    <p className="text-sm text-red-500">
                      {errors.tacticId.message}
                    </p>
                  )}
                </div>

                {/* Technique Selection */}
                {watchedTacticId && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="w-4 h-4" />
                          Select Technique
                        </div>

                        {selectedTactic && (
                          <Badge variant="outline">
                            {selectedTactic.id}: {selectedTactic.name}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredTechniques.map((technique) => (
                          <div
                            key={technique.id}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              watchedTechniqueId === technique.id
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() =>
                              setValue("techniqueId", technique.id)
                            }
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {technique.id}
                              </span>

                              {watchedTechniqueId === technique.id && (
                                <CheckSquare className="w-4 h-4 text-primary" />
                              )}
                            </div>

                            <h4 className="font-medium text-sm">
                              {technique.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {technique.description}
                            </p>
                          </div>
                        ))}
                      </div>

                      {errors.techniqueId && (
                        <p className="text-sm text-red-500">
                          {errors.techniqueId.message}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Sub-Techniques */}
                {watchedTechniqueId && availableSubTechniques.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="w-4 h-4" />
                          Select Sub-technique (Optional)
                        </div>

                        {selectedTechnique && (
                          <Badge variant="outline">
                            {selectedTechnique.id}: {selectedTechnique.name}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {availableSubTechniques.map((subTechnique) => (
                          <div
                            key={subTechnique.id}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              watch("subTechniqueId") === subTechnique.id
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() =>
                              setValue("subTechniqueId", subTechnique.id)
                            }
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-xs text-muted-foreground">
                                {subTechnique.id}
                              </span>

                              {watch("subTechniqueId") === subTechnique.id && (
                                <CheckSquare className="w-4 h-4 text-primary" />
                              )}
                            </div>

                            <h4 className="font-medium text-sm">
                              {subTechnique.name}
                            </h4>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Evidence & Analysis */}
              <TabsContent value="evidence" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Book className="w-4 h-4" />
                    Evidence & Analysis
                  </div>

                  <TextareaField
                    name="evidenceDescription"
                    label="Evidence Description"
                    placeholder="Describe the evidence supporting this TTP mapping"
                    rows={4}
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      name="severity"
                      label="Threat Severity"
                      options={severityOptions}
                      required
                    />

                    <div className="space-y-2">
                      <Label>Occurrence Count</Label>
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        {...methods.register("occurrenceCount", {
                          valueAsNumber: true,
                        })}
                      />

                      <p className="text-xs text-muted-foreground">
                        How many times was this TTP observed?
                      </p>

                      {errors.occurrenceCount && (
                        <p className="text-sm text-red-500">
                          {errors.occurrenceCount.message}
                        </p>
                      )}
                    </div>
                  </div>

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
                          <span key={level.value}>{level.label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Occurrence Tab */}
              <TabsContent value="occurrence" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    Occurrence Timeline
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Observed (Optional)</Label>
                      <Input
                        type="datetime-local"
                        {...methods.register("firstObserved")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Last Observed (Optional)</Label>
                      <Input
                        type="datetime-local"
                        {...methods.register("lastObserved")}
                      />
                    </div>
                  </div>

                  <TextareaField
                    name="mitigation"
                    label="Mitigation Strategies (Optional)"
                    placeholder="Describe mitigation measures"
                    rows={3}
                  />

                  <TextareaField
                    name="notes"
                    label="Additional Notes (Optional)"
                    placeholder="Additional context"
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Summary */}
            {watchedTacticId && watchedTechniqueId && (
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <strong>TTP Summary:</strong>

                    <div className="text-sm space-y-1">
                      <div>
                        <strong>Tactic:</strong> {selectedTactic?.id} -{" "}
                        {selectedTactic?.name}
                      </div>

                      <div>
                        <strong>Technique:</strong> {selectedTechnique?.id} -{" "}
                        {selectedTechnique?.name}
                      </div>

                      {watch("subTechniqueId") && (
                        <div>
                          <strong>Sub-technique:</strong>{" "}
                          {watch("subTechniqueId")}
                        </div>
                      )}

                      {watchedOccurrenceCount > 0 && (
                        <div>
                          <strong>Occurrences:</strong> {watchedOccurrenceCount}
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <a
                        href={`https://attack.mitre.org/techniques/${watchedTechniqueId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        View in MITRE ATT&CK{" "}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
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

          <Button
            type="submit"
            disabled={isSubmitting || !watchedTacticId || !watchedTechniqueId}
          >
            {isSubmitting ? "Adding..." : "Add TTP Mapping"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/**
 * TTP Occurrence Form Component
 */

export function TTPOccurrenceForm({
  ttpId,
  onSuccess,
  onCancel,
}: TTPOccurrenceFormProps) {
  const { t } = useTranslation("aegis");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm({
    resolver: zodResolver(occurrenceSchema),
    defaultValues: {
      observedDate: new Date().toISOString().slice(0, 16),
      description: "",
      confidence: 75,
      evidenceFiles: [],
      notes: "",
    },
  });

  const { handleSubmit, watch } = methods;
  const watchedConfidence = watch("confidence");

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      await updateTTPOccurrence({
        ttpId,
        ...data,
        observedDate: new Date(data.observedDate),
      });

      toast.success("TTP occurrence recorded successfully");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to record TTP occurrence");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Record TTP Occurrence
          </CardTitle>
          <CardDescription>
            Document a new observation of this TTP in the investigation
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>Observation Date & Time</Label>
              <Input
                type="datetime-local"
                {...methods.register("observedDate")}
                required
              />
            </div>

            <TextareaField
              name="description"
              label="Occurrence Description"
              placeholder="Describe this observation"
              rows={4}
              required
            />

            <div className="space-y-3">
              <Label>Confidence Level: {watchedConfidence}%</Label>
              <input
                type="range"
                min="0"
                max="100"
                step="25"
                value={watchedConfidence}
                onChange={(e) =>
                  methods.setValue("confidence", parseInt(e.target.value))
                }
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                {confidenceLevels.map((level) => (
                  <span key={level.value}>{level.label}</span>
                ))}
              </div>
            </div>

            <TextareaField
              name="notes"
              label="Additional Notes (Optional)"
              placeholder="Additional context"
              rows={2}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Record Occurrence"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
