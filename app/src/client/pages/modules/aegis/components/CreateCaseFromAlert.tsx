import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Checkbox } from '../../../../components/ui/checkbox';
import { FolderOpen, AlertTriangle, CheckCircle } from 'lucide-react';

interface CreateCaseFromAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertId: string;
  alertTitle: string;
  alertSeverity: string;
  observablesCount?: number;
}

export function CreateCaseFromAlertDialog({
  open,
  onOpenChange,
  alertId,
  alertTitle,
  alertSeverity,
  observablesCount = 0
}: CreateCaseFromAlertDialogProps) {
  const navigate = useNavigate();
  const [caseTitle, setCaseTitle] = useState(`Investigation: ${alertTitle}`);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>(alertSeverity);
  const [assignee, setAssignee] = useState<string>('');
  const [inheritObservables, setInheritObservables] = useState(true);
  const [closeAlert, setCloseAlert] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In real implementation, this would call the API to create the case
    console.log('Creating case:', {
      title: caseTitle,
      description,
      priority,
      assignee,
      inheritObservables,
      closeAlert,
      sourceAlertId: alertId
    });

    setIsCreating(false);
    onOpenChange(false);
    
    // Navigate to the new case (in real app, use the actual case ID from API)
    navigate('/modules/aegis/cases/CASE-2024-NEW');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Create Case from Alert
          </DialogTitle>
          <DialogDescription>
            Create a new investigation case based on alert {alertId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Alert Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Source Alert</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {alertId}
              </Badge>
              <Badge 
                variant={
                  alertSeverity === 'critical' ? 'destructive' :
                  alertSeverity === 'high' ? 'default' : 'secondary'
                }
              >
                {alertSeverity}
              </Badge>
              {observablesCount > 0 && (
                <Badge variant="secondary">
                  {observablesCount} observables
                </Badge>
              )}
            </div>
          </div>

          {/* Case Title */}
          <div className="space-y-2">
            <Label htmlFor="case-title">Case Title *</Label>
            <Input
              id="case-title"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              placeholder="Enter case title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the investigation..."
              rows={4}
            />
          </div>

          {/* Priority and Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maria">Maria Santos</SelectItem>
                  <SelectItem value="joao">João Silva</SelectItem>
                  <SelectItem value="pedro">Pedro Costa</SelectItem>
                  <SelectItem value="ana">Ana Oliveira</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="inherit-observables"
                checked={inheritObservables}
                onCheckedChange={(checked) => setInheritObservables(checked as boolean)}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="inherit-observables"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Inherit observables from alert
                </Label>
                <p className="text-sm text-muted-foreground">
                  Copy all {observablesCount} observables (IOCs, IPs, domains, etc.) to the new case
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="close-alert"
                checked={closeAlert}
                onCheckedChange={(checked) => setCloseAlert(checked as boolean)}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="close-alert"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mark alert as resolved
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically close the source alert after case creation
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!caseTitle.trim() || isCreating}
          >
            {isCreating ? (
              <>Creating...</>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Case
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
