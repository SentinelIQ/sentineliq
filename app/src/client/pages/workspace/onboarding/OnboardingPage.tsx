import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';
import { createWorkspace, completeOnboarding, updateWorkspaceBranding } from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Paintbrush, Building2, Sparkles, ArrowRight, Check, Info } from 'lucide-react';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { data: user } = useAuth();
  
  // Step state
  const [currentStep, setCurrentStep] = useState<'workspace' | 'branding'>('workspace');
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null);
  
  // Workspace fields
  const [workspaceName, setWorkspaceName] = useState('');
  const [description, setDescription] = useState('');
  
  // Branding fields
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [logoPreview, setLogoPreview] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const validateName = (value: string): boolean => {
    if (!value || value.trim().length === 0) {
      setNameError('Workspace name is required');
      return false;
    }
    if (value.length > 100) {
      setNameError('Name must be less than 100 characters');
      return false;
    }
    if (value.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWorkspaceName(value);
    if (value) validateName(value);
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    setLogoPreview(url);
  };

  const validateHexColor = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate before submitting
    if (!validateName(workspaceName)) {
      return;
    }

    setIsLoading(true);

    try {
      const workspace = await createWorkspace({ 
        name: workspaceName.trim(), 
        description: description.trim() || undefined 
      });
      
      setCreatedWorkspaceId(workspace.id);
      setCurrentStep('branding');
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      setError(error.message || 'Failed to create workspace. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipBranding = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error.message || 'Failed to complete onboarding.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!createdWorkspaceId) {
      setError('Workspace not created');
      return;
    }

    // Validate colors if provided
    if (primaryColor && !validateHexColor(primaryColor)) {
      setError('Primary color must be a valid hex color (e.g., #3b82f6)');
      return;
    }

    if (secondaryColor && !validateHexColor(secondaryColor)) {
      setError('Secondary color must be a valid hex color (e.g., #8b5cf6)');
      return;
    }

    setIsLoading(true);

    try {
      await updateWorkspaceBranding({
        workspaceId: createdWorkspaceId,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
      });
      
      await completeOnboarding();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving branding:', error);
      setError(error.message || 'Failed to save branding. You can update it later in settings.');
      // Even if branding fails, complete onboarding
      await completeOnboarding();
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if already completed onboarding
  if (user?.hasCompletedOnboarding) {
    navigate('/dashboard');
    return null;
  }

  const progress = currentStep === 'workspace' ? 50 : 100;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-bold">Welcome! 👋</h2>
          <p className="mt-2 text-muted-foreground">
            Let's set up your workspace in just 2 simple steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className={currentStep === 'workspace' ? 'text-primary' : 'text-success'}>
              {currentStep === 'workspace' ? 'Step 1' : <Check className="inline w-4 h-4" />} Workspace Info
            </span>
            <span className={currentStep === 'branding' ? 'text-primary' : 'text-muted-foreground'}>
              Step 2: Branding (optional)
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Workspace Creation */}
        {currentStep === 'workspace' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                Create Your Workspace
              </CardTitle>
              <CardDescription>
                A workspace is where your team collaborates. You can create multiple workspaces later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateWorkspace} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="workspace-name">Workspace Name *</Label>
                  <Input
                    id="workspace-name"
                    type="text"
                    required
                    value={workspaceName}
                    onChange={handleNameChange}
                    onBlur={() => workspaceName && validateName(workspaceName)}
                    placeholder="My Company"
                    className={`mt-2 ${nameError ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                  {nameError && (
                    <p className="text-sm text-destructive mt-1">{nameError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose a name for your workspace (2-100 characters)
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this workspace for?"
                    className="mt-2"
                    rows={3}
                    disabled={isLoading}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/500 characters
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading || !!nameError || !workspaceName}
                >
                  {isLoading ? 'Creating...' : (
                    <>
                      Continue to Branding
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Branding (Optional) */}
        {currentStep === 'branding' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="w-6 h-6 text-purple-600" />
                Customize Your Workspace
              </CardTitle>
              <CardDescription>
                Add your logo and brand colors to personalize your workspace experience (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBranding} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    You can skip this step and add branding later in workspace settings.
                  </AlertDescription>
                </Alert>

                {/* Logo */}
                <div className="space-y-3">
                  <Label htmlFor="logoUrl">Workspace Logo</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={logoUrl}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Enter a URL to your logo image (PNG, SVG, or JPG)
                  </p>

                  {logoPreview && (
                    <div className="border border-border rounded-lg p-4 bg-muted/30">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <div className="flex items-center justify-center p-4 bg-background rounded border border-border">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-h-16 max-w-full object-contain"
                          onError={() => setLogoPreview('')}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="relative">
                      <Input
                        id="primaryColor"
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#3b82f6"
                        disabled={isLoading}
                        className="pr-12"
                      />
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded cursor-pointer border border-border"
                      />
                    </div>
                    <div
                      className="h-10 rounded border border-border"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="relative">
                      <Input
                        id="secondaryColor"
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#8b5cf6"
                        disabled={isLoading}
                        className="pr-12"
                      />
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded cursor-pointer border border-border"
                      />
                    </div>
                    <div
                      className="h-10 rounded border border-border"
                      style={{ backgroundColor: secondaryColor }}
                    />
                  </div>
                </div>

                {/* Preview */}
                {(logoPreview || primaryColor || secondaryColor) && (
                  <div className="border border-border rounded-lg p-6 bg-muted/20">
                    <p className="text-sm font-medium mb-3">Preview:</p>
                    <div className="flex items-center gap-4 mb-4">
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo" className="h-10 object-contain" />
                      )}
                      <span className="text-lg font-bold">{workspaceName}</span>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        style={{ backgroundColor: primaryColor, color: '#ffffff' }}
                        className="hover:opacity-90"
                      >
                        Primary
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        style={{ borderColor: secondaryColor, color: secondaryColor }}
                      >
                        Secondary
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkipBranding}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Skip for Now
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Saving...' : 'Save & Complete'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Info Footer */}
        <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> You can always update these settings later in workspace settings.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
