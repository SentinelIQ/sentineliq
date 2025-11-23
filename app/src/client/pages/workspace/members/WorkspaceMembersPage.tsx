import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useQuery,
  getCurrentWorkspace,
  getWorkspaceMembers,
  getWorkspaceInvitations,
  inviteMemberToWorkspace,
  sendWorkspaceInvitation,
  removeMemberFromWorkspace,
  updateMemberRole,
  leaveWorkspace,
  transferWorkspaceOwnership,
} from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { WorkspaceLayout } from '../WorkspaceLayout';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { UserPlus, Trash2, LogOut, Crown } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { TransferOwnershipDialog } from '../components/TransferOwnershipDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../hooks/useToast';
import { EmptyState } from '../../../components/EmptyState';
import { TableSkeleton, CardSkeleton } from '../../../components/LoadingSkeletons';

export default function WorkspaceMembersPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const navigate = useNavigate();
  const { data: workspace } = useQuery(getCurrentWorkspace);
  const { data: members, refetch } = useQuery(getWorkspaceMembers, {
    workspaceId: workspace?.id,
  });
  const { data: pendingInvites, refetch: refetchInvites } = useQuery(getWorkspaceInvitations, {
    workspaceId: workspace?.id,
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [isInviting, setIsInviting] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);

    try {
      // sendWorkspaceInvitation handles both existing users and email invites
      await sendWorkspaceInvitation({
        workspaceId: workspace.id,
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail('');
      refetch();
      refetchInvites();
      toast.success(t('common:messages.success'));
    } catch (error: any) {
      toast.error(error.message || t('common:messages.error'));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMemberFromWorkspace({ workspaceId: workspace.id, userId });
      refetch();
      toast.success(t('common:messages.success'));
    } catch (error: any) {
      toast.error(error.message || t('common:messages.error'));
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await updateMemberRole({ workspaceId: workspace.id, userId, role });
      refetch();
      toast.success('Role updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleLeave = async () => {
    try {
      await leaveWorkspace({ workspaceId: workspace.id });
      navigate('/workspaces');
      toast.success('Left workspace successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave workspace');
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    try {
      await transferWorkspaceOwnership({ workspaceId: workspace.id, newOwnerId });
      toast.success('Ownership transferred successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to transfer ownership');
      throw error;
    }
  };

  if (!workspace) {
    return (
      <WorkspaceLayout>
        <div className="w-full px-8 py-8">
          <CardSkeleton />
        </div>
      </WorkspaceLayout>
    );
  }

  const canManageMembers = ['OWNER', 'ADMIN'].includes(workspace.userRole);
  const isOwner = workspace.userRole === 'OWNER';

  return (
    <WorkspaceLayout>
      <div className="w-full px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Team Members</h1>

      {canManageMembers && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invite Member</CardTitle>
            <CardDescription>Add new members to your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      {isOwner && <SelectItem value="OWNER">Owner</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={isInviting}>
                <UserPlus className="w-4 h-4 mr-2" />
                {isInviting ? 'Inviting...' : 'Invite Member'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {canManageMembers && pendingInvites && pendingInvites.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Invitations ({pendingInvites.length})</CardTitle>
            <CardDescription>Invitations sent to users who haven't joined yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite: any) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div>
                    <div className="font-medium">{invite.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Invited by {invite.invitedBy.email} • Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline">{invite.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Members ({members?.length || 0})</CardTitle>
            {isOwner && members && members.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTransferDialog(true)}
              >
                <Crown className="w-4 h-4 mr-2" />
                Transfer Ownership
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!members || members.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="w-12 h-12" />}
              title="No team members yet"
              description="Start building your team by inviting members to collaborate in this workspace."
              action={canManageMembers ? {
                label: 'Invite Member',
                onClick: () => document.getElementById('email')?.focus(),
              } : undefined}
            />
          ) : (
            <div className="space-y-4">
              {members.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {member.user.email?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.user.email}</span>
                      {member.role === 'OWNER' && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.user.username || 'No username'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {canManageMembers && member.role !== 'OWNER' ? (
                    <Select
                      value={member.role}
                      onValueChange={(role) => handleUpdateRole(member.userId, role)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  )}

                  {canManageMembers && member.role !== 'OWNER' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRemove(member.userId)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}

          {!isOwner && members && members.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setConfirmLeave(true)}>
                <LogOut className="w-4 h-4 mr-2" />
                Leave Workspace
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Transfer Ownership Dialog */}
      {isOwner && (
        <TransferOwnershipDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          members={members || []}
          currentOwnerId={workspace.id}
          onTransfer={handleTransferOwnership}
        />
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
        title="Remove Member"
        description="Are you sure you want to remove this member from the workspace? This action cannot be undone."
        onConfirm={async () => { if (confirmRemove) await handleRemoveMember(confirmRemove); }}
        confirmText="Remove"
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="Leave Workspace"
        description="Are you sure you want to leave this workspace? You will need to be re-invited to join again."
        onConfirm={handleLeave}
        confirmText="Leave"
        variant="destructive"
      />
    </WorkspaceLayout>
  );
}
