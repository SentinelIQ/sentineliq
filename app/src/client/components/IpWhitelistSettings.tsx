import React, { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { 
  getWorkspaceIpWhitelist,
  addIpToWhitelist,
  removeIpFromWhitelist,
  toggleIpWhitelist,
} from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Trash2, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface IpWhitelistSettingsProps {
  workspaceId: string;
}

export function IpWhitelistSettings({ workspaceId }: IpWhitelistSettingsProps) {
  const { data: user } = useAuth();
  const { data: whitelist, isLoading, refetch } = useQuery(getWorkspaceIpWhitelist, { workspaceId });
  const [newIp, setNewIp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <div>Loading IP whitelist...</div>;
  }

  if (!whitelist) {
    return <div>Failed to load IP whitelist</div>;
  }

  const isEnterprise = whitelist.isEnterprise;

  const handleToggle = async (enabled: boolean) => {
    if (!isEnterprise) {
      toast.error('IP whitelisting requires Enterprise plan');
      return;
    }
    try {
      setIsSubmitting(true);
      await toggleIpWhitelist({ workspaceId, enabled });
      toast.success(`IP whitelist ${enabled ? 'enabled' : 'disabled'}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle IP whitelist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;

    if (!isEnterprise) {
      toast.error('IP whitelisting requires Enterprise plan');
      return;
    }

    try {
      setIsSubmitting(true);
      await addIpToWhitelist({ workspaceId, ip: newIp.trim() });
      toast.success('IP address added to whitelist');
      setNewIp('');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add IP address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIp = async (ip: string) => {
    if (!isEnterprise) {
      toast.error('IP whitelisting requires Enterprise plan');
      return;
    }

    try {
      setIsSubmitting(true);
      await removeIpFromWhitelist({ workspaceId, ip });
      toast.success('IP address removed from whitelist');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove IP address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              IP Whitelist
              {isEnterprise && (
                <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  Enterprise
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Restrict access to this workspace by IP address (Enterprise feature only)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="ip-whitelist-toggle">
              {whitelist.ipWhitelistEnabled ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch
              id="ip-whitelist-toggle"
              checked={whitelist.ipWhitelistEnabled}
              onCheckedChange={handleToggle}
              disabled={isSubmitting || !isEnterprise}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEnterprise && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Enterprise Feature Required:</strong> IP whitelisting is only available for Enterprise plan workspaces. 
              Please upgrade your workspace to Enterprise to use this feature.
            </AlertDescription>
          </Alert>
        )}
        {whitelist.ipWhitelistEnabled && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              IP whitelisting is active. Only requests from the listed IP addresses will be allowed.
              Make sure your current IP is whitelisted to avoid losing access.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleAddIp} className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter IP address (e.g., 192.168.1.1 or 192.168.1.0/24)"
              value={newIp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIp(e.target.value)}
              disabled={isSubmitting || !isEnterprise}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Supports: IP addresses (192.168.1.1), CIDR notation (192.168.1.0/24), wildcards (192.168.1.*)
            </p>
          </div>
          <Button type="submit" disabled={isSubmitting || !newIp.trim() || !isEnterprise}>
            <Plus className="mr-2 h-4 w-4" />
            Add IP
          </Button>
        </form>

        {whitelist.ipWhitelist.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No IP addresses whitelisted</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add IP addresses to restrict access to this workspace
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Whitelisted IP Addresses ({whitelist.ipWhitelist.length})</Label>
            <div className="space-y-2">
              {whitelist.ipWhitelist.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <code className="text-sm font-mono">{ip}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveIp(ip)}
                    disabled={isSubmitting || !isEnterprise}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
