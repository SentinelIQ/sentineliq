import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { confirmOwnershipTransfer } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Shield } from 'lucide-react';

export default function ConfirmOwnershipPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceInfo, setWorkspaceInfo] = useState<{ id: string; name: string } | null>(null);

  const handleConfirm = async () => {
    if (!token || !user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await confirmOwnershipTransfer({ token });
      
      setConfirmed(true);
      setWorkspaceInfo(result.workspace);

      // Redirect to workspace after 3 seconds
      setTimeout(() => {
        navigate('/workspace/members');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to confirm ownership transfer:', err);
      setError(err.message || 'Failed to confirm ownership transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You need to be logged in to confirm ownership transfer.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/login')} className="w-full">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (confirmed && workspaceInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-6 w-6" />
              Ownership Transfer Completed
            </CardTitle>
            <CardDescription>
              You are now the owner of <strong>{workspaceInfo.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>You Now Have Full Control</AlertTitle>
              <AlertDescription>
                As the workspace owner, you can:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Manage all workspace members</li>
                  <li>Delete or archive the workspace</li>
                  <li>Manage billing and subscriptions</li>
                  <li>Transfer ownership to another member</li>
                </ul>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Redirecting to workspace members page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              Confirmation Failed
            </CardTitle>
            <CardDescription>
              Unable to complete ownership transfer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workspace/members')} className="flex-1">
              Go to Workspace
            </Button>
            <Button onClick={() => setError(null)} className="flex-1">
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Confirm Workspace Ownership Transfer
          </CardTitle>
          <CardDescription>
            You are about to become the owner of a workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>⚠️ Important: Owner Responsibilities</AlertTitle>
            <AlertDescription>
              By confirming this transfer, you will become the workspace owner with full control including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Managing all workspace members</li>
                <li>Deleting or archiving the workspace</li>
                <li>Managing billing and subscriptions</li>
                <li>Transferring ownership to another member</li>
                <li>Full administrative access</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              The current owner will be automatically downgraded to an Admin role once you confirm.
            </p>
          </div>

          <Alert variant="default" className="border-warning/20 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Security Notice</AlertTitle>
            <AlertDescription className="text-warning/90">
              If you did not expect this transfer request, do not confirm and contact the workspace owner immediately.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm & Accept Ownership'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
