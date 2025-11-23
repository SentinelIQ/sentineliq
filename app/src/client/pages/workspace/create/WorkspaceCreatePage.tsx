import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWorkspace, switchWorkspace } from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import { InputField, TextareaField } from '../../../components/FormFields';
import { createWorkspaceSchema, CreateWorkspaceInput } from '../../../../shared/validation/workspace';

export default function WorkspaceCreatePage() {
  const { t } = useTranslation(['workspace', 'common']);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      description: '',
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  const { handleSubmit, formState: { isSubmitting } } = form;

  const onSubmit = async (data: CreateWorkspaceInput) => {
    setError(null);

    try {
      const workspace = await createWorkspace(data);
      
      // Switch to the new workspace
      await switchWorkspace({ workspaceId: workspace.id });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      setError(error.message || t('workspace:create.error'));
    }
  };

  return (
    <div className="w-full px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
          disabled={isSubmitting}
          aria-label={t('common:actions.back')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {t('common:actions.back')}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{t('workspace:create.title')}</CardTitle>
            <CardDescription>
              {t('workspace:create.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <InputField
                  name="name"
                  label={t('workspace:create.name')}
                  placeholder={t('workspace:create.namePlaceholder')}
                  required
                  disabled={isSubmitting}
                  description={t('workspace:create.name')}
                />

                <TextareaField
                  name="description"
                  label={t('workspace:create.description')}
                  placeholder={t('workspace:create.descriptionPlaceholder')}
                  rows={4}
                  disabled={isSubmitting}
                  description={t('workspace:create.description')}
                />

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    aria-label={t('workspace:create.button')}
                  >
                    {isSubmitting ? t('common:status.loading') : t('workspace:create.button')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/workspaces')}
                    disabled={isSubmitting}
                    aria-label={t('common:actions.cancel')}
                  >
                    {t('common:actions.cancel')}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
