import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../../../../components/ui/dialog';
import { useToast } from '../../../../hooks/useToast';
import { importBrandsFromCSV } from 'wasp/client/operations';
import { parseBrandImportCSV, downloadFile } from '../../../../../core/modules/eclipse/export';
import { Progress } from '../../../../components/ui/progress';
import { Alert, AlertDescription } from '../../../../components/ui/alert';

interface ImportBrandsDialogProps {
  workspaceId: string;
  onImportComplete?: () => void;
}

export function ImportBrandsDialog({ workspaceId, onImportComplete }: ImportBrandsDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; name: string; error: string }>;
  } | null>(null);

  const handleDownloadTemplate = () => {
    const template = `name,description,logoUrl,website,priority,status
"Minha Marca","Descrição da marca","https://example.com/logo.png","https://minhambarca.com",1,active
"Outra Marca","Outra descrição","","https://outramarca.com.br",2,active`;

    downloadFile(template, 'template-marcas.csv', 'text/csv;charset=utf-8;');
    toast.success('Template baixado com sucesso');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      // Ler arquivo
      const text = await file.text();

      // Parsear CSV
      const brands = parseBrandImportCSV(text);

      if (brands.length === 0) {
        toast.error('Arquivo CSV vazio');
        setIsImporting(false);
        return;
      }

      if (brands.length > 100) {
        toast.error('Máximo de 100 marcas por importação');
        setIsImporting(false);
        return;
      }

      // Importar marcas
      const results = await importBrandsFromCSV({
        workspaceId,
        brands,
      });

      setImportResults(results);

      if (results.success > 0) {
        toast.success(`${results.success} marcas importadas com sucesso`);
        onImportComplete?.();
      }

      if (results.failed > 0) {
        toast.error(`${results.failed} marcas falharam`);
      }
    } catch (error: any) {
      toast.error('Erro ao importar arquivo: ' + error.message);
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setImportResults(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar Marcas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Marcas em Massa</DialogTitle>
          <DialogDescription>
            Importe múltiplas marcas de uma vez usando um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Download */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              Baixe o template CSV para ver o formato correto
              <Button
                variant="link"
                size="sm"
                className="ml-2 h-auto p-0"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-1 h-3 w-3" />
                Baixar Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o arquivo CSV</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-sm border border-border rounded-lg cursor-pointer bg-muted focus:outline-none"
              disabled={isImporting}
            />
            <p className="text-xs text-muted-foreground">
              Formato: CSV (máximo 100 marcas por vez)
            </p>
          </div>

          {/* Progress */}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={50} />
              <p className="text-sm text-muted-foreground text-center">Importando marcas...</p>
            </div>
          )}

          {/* Results */}
          {importResults && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted">
              <h4 className="font-semibold text-sm">Resultado da Importação</h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{importResults.success} Sucesso</span>
                </div>
                {importResults.failed > 0 && (
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{importResults.failed} Falhas</span>
                  </div>
                )}
              </div>

              {/* Errors List */}
              {importResults.errors.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium text-red-700">Erros:</p>
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>
                        <span className="font-medium">Linha {error.row}</span> ({error.name}):{' '}
                        {error.error}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {!importResults && !isImporting && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium">Instruções:</p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Baixe o template CSV acima</li>
                <li>Preencha com os dados das suas marcas</li>
                <li>Salve o arquivo e selecione-o para importar</li>
                <li>As marcas duplicadas serão ignoradas</li>
              </ol>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
