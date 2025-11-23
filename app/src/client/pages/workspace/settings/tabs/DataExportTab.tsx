import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportWorkspaceData } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../../../components/ui/alert';
import { Download, FileJson, Shield, Info } from 'lucide-react';
import { useToast } from '../../../../hooks/useToast';

interface DataExportTabProps {
  workspace: any;
}

export default function DataExportTab({ workspace }: DataExportTabProps) {
  const { t } = useTranslation('workspace');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const exportData = await exportWorkspaceData({ workspaceId: workspace.id });

      // Convert to JSON and trigger download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workspace-${workspace.slug}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('dataExport.success'));
    } catch (error: any) {
      console.error('Failed to export workspace data:', error);
      toast.error(error.message || t('dataExport.error'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="w-5 h-5" />
          {t('dataExport.gdprTitle')}
        </CardTitle>
        <CardDescription>
          {t('dataExport.gdprDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t('dataExport.whatIsExported')}</AlertTitle>
          <AlertDescription>
            {t('dataExport.exportIncludes')}
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{t('dataExport.workspaceInfo')}</li>
              <li>{t('dataExport.allMembers')}</li>
              <li>{t('dataExport.auditLogs')}</li>
              <li>{t('dataExport.notifications')}</li>
              <li>{t('dataExport.pendingInvitations')}</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">{t('dataExport.gdprCompliance')}</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            {t('dataExport.gdprNotice')}
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {t('dataExport.exportFormat', { format: 'JSON' })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('dataExport.fileName')} <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                workspace-{workspace.slug}-export-{new Date().toISOString().split('T')[0]}.json
              </code>
            </p>
          </div>
          <Button onClick={handleExport} disabled={isExporting} size="lg">
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? t('dataExport.exporting') : t('dataExport.exportButton')}
          </Button>
        </div>

        <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 mt-4">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">{t('dataExport.importantNotice')}</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {t('dataExport.sensitiveWarning')}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
