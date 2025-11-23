import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acceptWorkspaceInvitation } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');

  useEffect(() => {
    if (!user) {
      // Redirect to login with return URL
      navigate(`/login?redirectTo=/invite/${token}`);
      return;
    }

    handleAcceptInvitation();
  }, [user, token]);

  const handleAcceptInvitation = async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invitation link');
      return;
    }

    try {
      const result = await acceptWorkspaceInvitation({ token });
      setWorkspaceName(result.workspace.name);
      setStatus('success');
      
      // Redirect to workspace after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to accept invitation');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Workspace Invitation
            </CardTitle>
            <CardDescription>
              Please log in to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Workspace Invitation
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your invitation...'}
            {status === 'success' && 'Welcome to the team!'}
            {status === 'error' && 'Unable to accept invitation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Accepting invitation...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Successfully Joined!</h3>
                <p className="text-sm text-muted-foreground">
                  You are now a member of <span className="font-medium">{workspaceName}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Redirecting to dashboard...
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="w-16 h-16 text-destructive" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Invitation Error</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {errorMessage}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => navigate('/workspaces')}>
                    My Workspaces
                  </Button>
                  <Button onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
