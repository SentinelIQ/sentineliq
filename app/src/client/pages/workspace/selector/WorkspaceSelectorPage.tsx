import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, getUserWorkspaces, switchWorkspace } from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Plus, Building2 } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function WorkspaceSelectorPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const navigate = useNavigate();
  const { data: workspaces, isLoading } = useQuery(getUserWorkspaces);
  const { toast } = useToast();

  const handleSelectWorkspace = async (workspaceId: string) => {
    try {
      await switchWorkspace({ workspaceId });
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || t('workspace:create.error'));
    }
  };

  const handleCreateNew = () => {
    navigate('/workspace/create');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>{t('common:status.loading')}</div>
      </div>
    );
  }

  return (
    <div className="w-full px-8 py-12">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{t('workspace:selector.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('workspace:selector.title')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces?.map((workspace: any) => (
            <Card
              key={workspace.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSelectWorkspace(workspace.id)}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Building2 className="w-8 h-8 text-primary" />
                  <CardTitle>{workspace.name}</CardTitle>
                </div>
                {workspace.description && (
                  <CardDescription>{workspace.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-dashed"
            onClick={handleCreateNew}
          >
            <CardContent className="flex flex-col items-center justify-center h-full py-12">
              <Plus className="w-12 h-12 text-muted-foreground mb-2" />
              <span className="text-muted-foreground font-medium">{t('workspace:selector.createNew')}</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
