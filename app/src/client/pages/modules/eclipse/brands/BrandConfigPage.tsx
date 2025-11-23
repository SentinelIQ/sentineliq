import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getEclipseBrandById, updateEclipseBrand } from 'wasp/client/operations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { ArrowLeft, Save, Settings } from 'lucide-react';
import { useWorkspace } from '../../../../hooks/useWorkspace';

export default function EclipseBrandConfigPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [isSaving, setIsSaving] = useState(false);

  const { data: brand, isLoading, error } = useQuery(
    getEclipseBrandById,
    {
      id: brandId || '',
      workspaceId: currentWorkspace?.id || '',
    },
    {
      enabled: !!brandId && !!currentWorkspace?.id
    }
  );

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 3,
    status: 'active',
    keywords: [] as string[],
    protectedDomains: [] as string[],
  });

  React.useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || '',
        description: brand.description || '',
        priority: brand.priority || 3,
        status: brand.status || 'active',
        keywords: brand.keywords || [],
        protectedDomains: brand.protectedDomains || [],
      });
    }
  }, [brand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brandId) return;

    setIsSaving(true);

    try {
      await updateEclipseBrand({
        id: brandId,
        ...formData,
      });

      alert('Configuração salva com sucesso!');
      navigate(`/modules/eclipse/brands/${brandId}`);
    } catch (error: any) {
      alert('Erro ao salvar: ' + (error.message || 'Não foi possível salvar as configurações.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!brandId) {
    return (
      <div className="w-full px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Marca não encontrada</h1>
          <Button onClick={() => navigate('/modules/eclipse/brands')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Marcas
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full px-8 py-8 flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="w-full px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Erro ao carregar marca</h1>
          <p className="text-gray-600 mt-2">{error?.message || 'Marca não encontrada'}</p>
          <Button onClick={() => navigate('/modules/eclipse/brands')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Marcas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-muted/30 border-b border-border">
        <div className="w-full px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/modules/eclipse/brands/${brandId}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Detalhes
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Settings className="w-10 h-10 text-blue-500" />
            <div>
              <h1 className="text-4xl font-bold">Configurar Marca</h1>
              <p className="text-sm text-muted-foreground mt-1">{brand.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="w-full px-8 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure as informações principais da marca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Marca *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Minha Marca"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada da marca..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority.toString()}
                    onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">P1 - Crítica</SelectItem>
                      <SelectItem value="2">P2 - Alta</SelectItem>
                      <SelectItem value="3">P3 - Média</SelectItem>
                      <SelectItem value="4">P4 - Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Palavras-Chave</CardTitle>
              <CardDescription>
                Palavras-chave associadas à marca para detecção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="keywords">
                  Palavras-Chave (separadas por vírgula)
                </Label>
                <Input
                  id="keywords"
                  value={formData.keywords.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
                    })
                  }
                  placeholder="palavra1, palavra2, palavra3"
                />
                <p className="text-xs text-muted-foreground">
                  Digite as palavras-chave separadas por vírgula
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Domínios Protegidos</CardTitle>
              <CardDescription>
                Domínios oficiais da marca para comparação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="protectedDomains">
                  Domínios (separados por vírgula)
                </Label>
                <Input
                  id="protectedDomains"
                  value={formData.protectedDomains.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      protectedDomains: e.target.value.split(',').map((d) => d.trim()).filter(Boolean),
                    })
                  }
                  placeholder="exemplo.com, site.com.br"
                />
                <p className="text-xs text-muted-foreground">
                  Digite os domínios separados por vírgula (sem http/https)
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/modules/eclipse/brands/${brandId}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
