import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { useToast } from '../../../../hooks/useToast';
import { useQuery, exportEclipseData, generateEclipseReport } from 'wasp/client/operations';
import {
  exportAlertsToCSV,
  exportInfringementsToCSV,
  exportActionsToCSV,
  exportToJSON,
  downloadCSV,
  downloadJSON,
  downloadFile,
  generateReportHTML,
} from '../../../../../core/modules/eclipse/export';

interface ExportMenuProps {
  workspaceId: string;
  resourceType: 'alerts' | 'infringements' | 'actions';
  filters?: any;
  buttonLabel?: string;
  data?: any[];
}

export function ExportMenu({ workspaceId, resourceType, filters, buttonLabel, data }: ExportMenuProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      let csvContent: string;
      let filename: string;

      if (data) {
        // Usar dados já carregados
        switch (resourceType) {
          case 'alerts':
            csvContent = exportAlertsToCSV(data);
            filename = `alertas-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case 'infringements':
            csvContent = exportInfringementsToCSV(data);
            filename = `infracoes-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case 'actions':
            csvContent = exportActionsToCSV(data);
            filename = `acoes-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          default:
            throw new Error('Tipo de recurso inválido');
        }
      } else {
        // Buscar dados do servidor
        const result = await exportEclipseData({
          workspaceId,
          resourceType,
          format: 'csv',
          filters,
        });

        switch (resourceType) {
          case 'alerts':
            csvContent = exportAlertsToCSV(result.data);
            filename = `alertas-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case 'infringements':
            csvContent = exportInfringementsToCSV(result.data);
            filename = `infracoes-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case 'actions':
            csvContent = exportActionsToCSV(result.data);
            filename = `acoes-${new Date().toISOString().split('T')[0]}.csv`;
            break;
        }
      }

      downloadCSV(csvContent, filename);
      toast.success(`${csvContent.split('\n').length - 1} registros exportados`);
    } catch (error: any) {
      toast.error('Erro ao exportar CSV: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      let jsonData: any[];
      let filename: string;

      if (data) {
        jsonData = data;
      } else {
        const result = await exportEclipseData({
          workspaceId,
          resourceType,
          format: 'json',
          filters,
        });
        jsonData = result.data;
      }

      const jsonContent = exportToJSON(jsonData, '');
      filename = `${resourceType}-${new Date().toISOString().split('T')[0]}.json`;

      downloadJSON(jsonContent, filename);
      toast.success(`${jsonData.length} registros exportados`);
    } catch (error: any) {
      toast.error('Erro ao exportar JSON: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsExporting(true);
    try {
      const reportData = await generateEclipseReport({
        workspaceId,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // últimos 30 dias
        endDate: new Date(),
      });

      const htmlContent = generateReportHTML(reportData);
      const filename = `relatorio-eclipse-${new Date().toISOString().split('T')[0]}.html`;

      downloadFile(htmlContent, filename, 'text/html');
      toast.success('Relatório gerado com sucesso');
    } catch (error: any) {
      toast.error('Erro ao gerar relatório: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {buttonLabel || 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Formato de Exportação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Exportar como CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="mr-2 h-4 w-4" />
          <span>Exportar como JSON</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleGenerateReport}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Gerar Relatório HTML</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
