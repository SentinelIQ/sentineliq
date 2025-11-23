import { Ban, Shield, ShieldOff, KeyRound, Trash2, Eye, Ellipsis } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { 
  getPaginatedUsers, 
  updateIsUserAdminById, 
  suspendUser, 
  resetUser2FA, 
  resetUserPassword, 
  getUserWorkspaces, 
  getUserActivity, 
  deleteUserCascade, 
  useQuery 
} from 'wasp/client/operations';
import { type User } from 'wasp/entities';
import useDebounce from '../../../../hooks/useDebounce';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../../../../components/ui/dialog';
import { Textarea } from '../../../../components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../../../../components/ui/dropdown-menu';
import { Badge } from '../../../../components/ui/badge';
import { toast } from 'sonner';
import LoadingSpinner from '../../layout/LoadingSpinner';

function AdminSwitch({ id, isAdmin }: Pick<User, 'id' | 'isAdmin'>) {
  const { data: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === id;

  return (
    <Switch
      checked={isAdmin}
      onCheckedChange={(value) => updateIsUserAdminById({ id: id, isAdmin: value })}
      disabled={isCurrentUser}
    />
  );
}

interface UserActionsDropdownProps {
  user: Pick<User, 'id' | 'email' | 'username'>;
  isSuspended: boolean;
  onRefetch: () => void;
}

function UserActionsDropdown({ user, isSuspended, onRefetch }: UserActionsDropdownProps) {
  const { data: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === user.id;
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: userWorkspaces } = useQuery(getUserWorkspaces, { userId: user.id }, { enabled: detailsDialog });
  const { data: userActivity } = useQuery(getUserActivity, { userId: user.id, limit: 10 }, { enabled: detailsDialog });

  const handleSuspend = async () => {
    setIsProcessing(true);
    try {
      await suspendUser({
        userId: user.id,
        suspend: !isSuspended,
        reason: suspendReason,
      });
      toast.success(`User ${isSuspended ? 'activated' : 'suspended'} successfully`);
      setSuspendDialog(false);
      setSuspendReason('');
      onRefetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update user status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset2FA = async () => {
    try {
      await resetUser2FA({ userId: user.id });
      toast.success('2FA reset successfully - user can set up new 2FA');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reset 2FA');
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetUserPassword({ userId: user.id });
      toast.success('Password reset initiated - user will be prompted to reset on next login');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reset password');
    }
  };

  const handleDelete = async () => {
    if (confirmEmail !== user.email) {
      toast.error('Email confirmation does not match');
      return;
    }

    setIsProcessing(true);
    try {
      await deleteUserCascade({
        userId: user.id,
        confirmEmail: confirmEmail,
      });
      toast.success('User deleted successfully');
      setDeleteDialog(false);
      setConfirmEmail('');
      onRefetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete user');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setDetailsDialog(true)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setSuspendDialog(true)}
            disabled={isCurrentUser}
          >
            {isSuspended ? (
              <>
                <ShieldOff className="h-4 w-4 mr-2" />
                Activate User
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Suspend User
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleReset2FA} disabled={isCurrentUser}>
            <Shield className="h-4 w-4 mr-2" />
            Reset 2FA
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetPassword} disabled={isCurrentUser}>
            <KeyRound className="h-4 w-4 mr-2" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setDeleteDialog(true)}
            disabled={isCurrentUser}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend/Activate Dialog */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSuspended ? 'Activate' : 'Suspend'} User</DialogTitle>
            <DialogDescription>
              {isSuspended 
                ? `Activate ${user.email || user.username}? User will be able to login again.`
                : `Suspend ${user.email || user.username}? User will not be able to login until reactivated.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this action..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant={isSuspended ? "default" : "destructive"}
              onClick={handleSuspend}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : (isSuspended ? 'Activate' : 'Suspend')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="confirmEmail">Type user email to confirm</Label>
              <Input
                id="confirmEmail"
                type="email"
                placeholder={user.email || 'user@example.com'}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={isProcessing || confirmEmail !== user.email}
            >
              {isProcessing ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details: {user.email || user.username}</DialogTitle>
            <DialogDescription>Workspaces and recent activity</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Workspaces */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Workspaces ({userWorkspaces?.length || 0})</h3>
              {userWorkspaces && userWorkspaces.length > 0 ? (
                <div className="space-y-2">
                  {userWorkspaces.map((membership: any) => (
                    <div key={membership.workspaceId} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{membership.workspace.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Role: <Badge variant="outline">{membership.role}</Badge>
                        </p>
                      </div>
                      <Badge className={
                        membership.workspace.subscriptionPlan === 'pro' ? 'bg-purple-500' :
                        membership.workspace.subscriptionPlan === 'hobby' ? 'bg-blue-500' : 'bg-green-500'
                      }>
                        {membership.workspace.subscriptionPlan}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No workspaces</p>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
              {userActivity && userActivity.length > 0 ? (
                <div className="space-y-2">
                  {userActivity.map((log: any) => (
                    <div key={log.id} className="p-3 border rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.resource} • {log.workspace?.name || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const UsersTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [emailFilter, setEmailFilter] = useState<string | undefined>(undefined);
  const [isAdminFilter, setIsAdminFilter] = useState<boolean | undefined>(undefined);

  const debouncedEmailFilter = useDebounce(emailFilter, 300);

  const skipPages = currentPage - 1;

  const { data, isLoading, refetch } = useQuery(getPaginatedUsers, {
    skipPages,
    filter: {
      ...(debouncedEmailFilter && { emailContains: debouncedEmailFilter }),
      ...(isAdminFilter !== undefined && { isAdmin: isAdminFilter }),
    },
  });

  useEffect(
    function backToPageOne() {
      setCurrentPage(1);
    },
    [debouncedEmailFilter, isAdminFilter]
  );

  // Helper to check if user is suspended (lockedUntil is far in future or loginAttempts is high)
  const isUserSuspended = (user: any) => {
    // This is a simplified check - actual suspension state is in the User entity fields
    // For now, we'll add a status badge in the future
    return false; // We'll need to fetch this info from the user entity
  };



  return (
    <div className='flex flex-col gap-4'>
      <div className='rounded-sm border border-border bg-card shadow'>
        <div className='flex-col flex items-start justify-between p-6 gap-3 w-full bg-muted/40'>
          <span className='text-sm font-medium'>Filters:</span>
          <div className='flex items-center justify-between gap-3 w-full px-2'>
            <div className='relative flex items-center gap-3 '>
              <Label htmlFor='email-filter' className='text-sm text-muted-foreground'>
                email:
              </Label>
              <Input
                type='text'
                id='email-filter'
                placeholder='dude@example.com'
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  setEmailFilter(value === '' ? undefined : value);
                }}
              />
              <div className='flex items-center gap-2'>
                <Label htmlFor='admin-filter' className='text-sm ml-2 text-muted-foreground'>
                  isAdmin:
                </Label>
                <Select
                  onValueChange={(value) => {
                    if (value === 'both') {
                      setIsAdminFilter(undefined);
                    } else {
                      setIsAdminFilter(value === 'true');
                    }
                  }}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='both' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='both'>both</SelectItem>
                    <SelectItem value='true'>true</SelectItem>
                    <SelectItem value='false'>false</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {data?.totalPages && (
              <div className='max-w-60 flex flex-row items-center'>
                <span className='text-md mr-2 text-foreground'>page</span>
                <Input
                  type='number'
                  min={1}
                  defaultValue={currentPage}
                  max={data?.totalPages}
                  onChange={(e) => {
                    const value = parseInt(e.currentTarget.value);
                    if (data?.totalPages && value <= data?.totalPages && value > 0) {
                      setCurrentPage(value);
                    }
                  }}
                  className='w-20'
                />
                <span className='text-md text-foreground'> /{data?.totalPages} </span>
              </div>
            )}
          </div>
        </div>

        <div className='grid grid-cols-5 border-t-4 border-border py-4.5 px-4 md:px-6 '>
          <div className='col-span-3 flex items-center'>
            <p className='font-medium'>Email / Username</p>
          </div>
          <div className='col-span-1 flex items-center'>
            <p className='font-medium'>Is Admin</p>
          </div>
          <div className='col-span-1 flex items-center justify-end'>
            <p className='font-medium'>Actions</p>
          </div>
        </div>
        {isLoading && <LoadingSpinner />}
        {!!data?.users &&
          data?.users?.length > 0 &&
          data.users.map((user) => (
            <div key={user.id} className='grid grid-cols-5 gap-4 py-4.5 px-4 md:px-6 border-t'>
              <div className='col-span-3 flex items-center'>
                <div className='flex flex-col gap-1 '>
                  <p className='text-sm text-foreground'>{user.email}</p>
                  <p className='text-sm text-muted-foreground'>{user.username}</p>
                </div>
              </div>
              <div className='col-span-1 flex items-center'>
                <div className='text-sm text-foreground'>
                  <AdminSwitch {...user} />
                </div>
              </div>
              <div className='col-span-1 flex items-center justify-end'>
                <UserActionsDropdown 
                  user={user} 
                  isSuspended={isUserSuspended(user)} 
                  onRefetch={refetch}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default UsersTable;
