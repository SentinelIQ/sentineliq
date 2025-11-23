import { useState, useEffect, useRef } from 'react';
import { updateWorkspaceBranding } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../../../../components/ui/alert';
import { Paintbrush, Upload, X, Info, Sparkles, ImageIcon } from 'lucide-react';
import { useToast } from '../../../../hooks/useToast';

interface BrandingTabProps {
  workspace: any;
  isOwner: boolean;
}

export default function BrandingTab({ workspace, isOwner }: BrandingTabProps) {
  const [logoUrl, setLogoUrl] = useState(workspace?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(workspace?.primaryColor || '#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState(workspace?.secondaryColor || '#8b5cf6');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(workspace?.logoUrl || '');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (workspace) {
      setLogoUrl(workspace.logoUrl || '');
      setLogoPreview(workspace.logoUrl || '');
      setPrimaryColor(workspace.primaryColor || '#3b82f6');
      setSecondaryColor(workspace.secondaryColor || '#8b5cf6');
    }
  }, [workspace]);

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    setLogoPreview(url);
  };

  const handleClearLogo = () => {
    setLogoUrl('');
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, GIF, WebP, or SVG');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB. Please choose a smaller file');
      return;
    }

    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspace.id);
      formData.append('type', 'logo');
      formData.append('folder', 'logos');

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      // Update logo URL and preview
      setLogoUrl(result.file.url);
      setLogoPreview(result.file.url);

      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const validateHexColor = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOwner) {
      toast.error('Only workspace owners can update branding');
      return;
    }

    // Validate colors
    if (primaryColor && !validateHexColor(primaryColor)) {
      toast.error('Primary color must be a valid hex color (e.g., #3b82f6)');
      return;
    }

    if (secondaryColor && !validateHexColor(secondaryColor)) {
      toast.error('Secondary color must be a valid hex color (e.g., #8b5cf6)');
      return;
    }

    setIsSaving(true);

    try {
      await updateWorkspaceBranding({
        workspaceId: workspace.id,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
      });
      
      toast.success('Workspace branding updated successfully');
      
      // Reload page to apply new branding
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to update branding:', error);
      toast.error(error.message || 'Failed to update workspace branding');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLogoUrl(workspace?.logoUrl || '');
    setLogoPreview(workspace?.logoUrl || '');
    setPrimaryColor(workspace?.primaryColor || '#3b82f6');
    setSecondaryColor(workspace?.secondaryColor || '#8b5cf6');
    toast.success('Branding reset to saved values');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="w-5 h-5" />
          Workspace Branding
        </CardTitle>
        <CardDescription>
          Customize your workspace appearance with a logo and brand colors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Personalize Your Workspace</AlertTitle>
          <AlertDescription>
            Add your company logo and brand colors to create a professional, branded experience for your team.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Logo Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="logoUrl" className="text-base font-semibold">
                Workspace Logo
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Upload a logo file or provide a URL to your logo image
              </p>
            </div>

            {/* Upload Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <Button
                type="button"
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('file')}
                disabled={!isOwner}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                type="button"
                variant={uploadMode === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('url')}
                disabled={!isOwner}
              >
                <Upload className="w-4 h-4 mr-2" />
                Use URL
              </Button>
            </div>

            {/* File Upload Mode */}
            {uploadMode === 'file' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleFileSelect}
                  disabled={!isOwner || isUploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isOwner || isUploading}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLogo}
                    disabled={!isOwner}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Logo
                  </Button>
                )}
              </div>
            )}

            {/* URL Mode */}
            {uploadMode === 'url' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id="logoUrl"
                    type="url"
                    value={logoUrl}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    disabled={!isOwner}
                  />
                </div>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleClearLogo}
                    disabled={!isOwner}
                    title="Clear logo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Logo Preview */}
            {logoPreview && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-20 max-w-full object-contain"
                    onError={() => {
                      toast.error('Failed to load logo image. Please check the URL.');
                      setLogoPreview('');
                    }}
                  />
                </div>
              </div>
            )}

            <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> For best results, use a transparent PNG or SVG logo with dimensions around 200x60 pixels.
                Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP, SVG.
              </AlertDescription>
            </Alert>
          </div>

          {/* Colors Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <Label className="text-base font-semibold">Brand Colors</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose colors that represent your brand identity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Color */}
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="primaryColor"
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3b82f6"
                      disabled={!isOwner}
                      className="pr-12"
                    />
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      disabled={!isOwner}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                      title="Pick primary color"
                    />
                  </div>
                </div>
                <div
                  className="h-12 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>

              {/* Secondary Color */}
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="secondaryColor"
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#8b5cf6"
                      disabled={!isOwner}
                      className="pr-12"
                    />
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      disabled={!isOwner}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                      title="Pick secondary color"
                    />
                  </div>
                </div>
                <div
                  className="h-12 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: secondaryColor }}
                />
              </div>
            </div>

            <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Colors must be in hex format (e.g., #3b82f6). Use the color picker or enter the hex code directly.
              </AlertDescription>
            </Alert>
          </div>

          {/* Preview Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <Label className="text-base font-semibold">Live Preview</Label>
              <p className="text-sm text-muted-foreground mb-3">
                See how your branding will look
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center gap-4 mb-4">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-10 object-contain"
                  />
                )}
                <span className="text-xl font-bold">{workspace.name}</span>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  style={{ backgroundColor: primaryColor, color: '#ffffff' }}
                  className="hover:opacity-90"
                >
                  Primary Button
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  style={{
                    borderColor: secondaryColor,
                    color: secondaryColor,
                  }}
                  className="hover:opacity-90"
                >
                  Secondary Button
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isOwner && (
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSaving}>
                <Upload className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Branding'}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset Changes
              </Button>
            </div>
          )}

          {!isOwner && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Only workspace owners can update branding settings. Contact your workspace owner to make changes.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
