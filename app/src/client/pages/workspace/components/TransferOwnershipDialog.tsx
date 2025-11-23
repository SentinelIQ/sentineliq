import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: any[];
  currentOwnerId: string;
  onTransfer: (newOwnerId: string) => Promise<void>;
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  members,
  currentOwnerId,
  onTransfer,
}: TransferOwnershipDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  const availableMembers = members.filter(
    (m) => m.userId !== currentOwnerId && m.role !== 'OWNER'
  );

  const handleTransfer = async () => {
    if (!selectedUserId) return;

    setIsTransferring(true);
    try {
      await onTransfer(selectedUserId);
      onOpenChange(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Workspace Ownership</DialogTitle>
          <DialogDescription>
            Transfer full ownership of this workspace to another member. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Once transferred, you will lose owner privileges and become an admin.
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Select new owner
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member..." />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user.email} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isTransferring}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedUserId || isTransferring}
            variant="destructive"
          >
            {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
