import { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { enable2FA, verify2FA, disable2FA, generateNew2FABackupCodes } from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Shield, ShieldCheck, ShieldAlert, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'initial' | 'setup' | 'verify' | 'enabled';

export default function TwoFactorAuthPage() {
  const { data: user } = useAuth();
  const [step, setStep] = useState<Step>(user?.twoFactorEnabled ? 'enabled' : 'initial');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable2FA = async () => {
    try {
      setIsLoading(true);
      const result = await enable2FA();
      
      // Use Google Charts API to generate QR code (no dependencies needed)
      const qrDataUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(result.qrCodeData)}&choe=UTF-8`;
      setQrCodeUrl(qrDataUrl);
      setSecret(result.secret);
      setBackupCodes(result.backupCodes);
      setStep('setup');
      
      toast.success('2FA setup initiated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setIsLoading(true);
      await verify2FA({ token });
      setStep('enabled');
      toast.success('2FA enabled successfully!');
      setToken('');
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setIsLoading(true);
      await disable2FA({ token });
      setStep('initial');
      setQrCodeUrl('');
      setSecret('');
      setBackupCodes([]);
      toast.success('2FA disabled successfully');
      setToken('');
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      setIsLoading(true);
      const newCodes = await generateNew2FABackupCodes({ token });
      setBackupCodes(newCodes);
      toast.success('New backup codes generated');
      setToken('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate backup codes');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const copyAllBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('All backup codes copied to clipboard');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
        <p className="mt-2 text-muted-foreground">
          Add an extra layer of security to your account
        </p>
      </div>

      {/* Initial State - 2FA Not Enabled */}
      {step === 'initial' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <CardTitle>Enable Two-Factor Authentication</CardTitle>
            </div>
            <CardDescription>
              Protect your account with TOTP-based two-factor authentication using apps like Google
              Authenticator, Authy, or 1Password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                    Important Security Notice
                  </h3>
                  <p className="mt-1 text-sm text-orange-800 dark:text-orange-200">
                    Once enabled, you'll need your authenticator app to sign in. Make sure to save
                    your backup codes in a secure location.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleEnable2FA} disabled={isLoading} className="w-full">
              {isLoading ? 'Setting up...' : 'Enable 2FA'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Setup State - Show QR Code */}
      {step === 'setup' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Scan QR Code</CardTitle>
              <CardDescription>
                Scan this QR code with your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="2FA QR Code" className="h-64 w-64 rounded-lg border" />
                )}
                
                <div className="w-full">
                  <p className="mb-2 text-sm text-muted-foreground">
                    Or enter this secret key manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted p-2 font-mono text-sm">
                      {secret}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Save Backup Codes</CardTitle>
              <CardDescription>
                Store these codes securely. You'll need them if you lose access to your
                authenticator app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>
                  Each backup code can only be used once. Store them in a safe place like a
                  password manager.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>{code}</span>
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={copyAllBackupCodes} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copy All Backup Codes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 3: Verify Setup</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
              <Button
                onClick={handleVerify2FA}
                disabled={isLoading || token.length !== 6}
                className="w-full"
              >
                {isLoading ? 'Verifying...' : 'Verify and Enable 2FA'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enabled State - 2FA Active */}
      {step === 'enabled' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-green-600" />
                <CardTitle>Two-Factor Authentication Enabled</CardTitle>
              </div>
              <CardDescription>
                Your account is protected with two-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  Your account is secured with 2FA. You'll need your authenticator app to sign in.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regenerate Backup Codes</CardTitle>
              <CardDescription>
                Generate new backup codes if you've used or lost your current ones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>
                  This will invalidate all previous backup codes. Make sure to save the new ones.
                </AlertDescription>
              </Alert>

              {backupCodes.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index}>{code}</div>
                    ))}
                  </div>
                  <Button variant="outline" onClick={copyAllBackupCodes} className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All Backup Codes
                  </Button>
                </>
              )}

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  onClick={handleRegenerateBackupCodes}
                  disabled={isLoading || token.length !== 6}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isLoading ? 'Generating...' : 'Generate New Backup Codes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Disable 2FA</CardTitle>
              <CardDescription>
                Remove two-factor authentication from your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-900 dark:text-red-100">
                  Disabling 2FA will make your account less secure. Only disable if absolutely
                  necessary.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code or backup code"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  className="text-center"
                />
                <Button
                  variant="destructive"
                  onClick={handleDisable2FA}
                  disabled={isLoading || token.length < 6}
                  className="w-full"
                >
                  {isLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
