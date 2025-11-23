import { useState, useEffect } from 'react';
import { Calendar, Filter, X, Save, Trash2, Search } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '../../../../components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { DATE_RANGE_PRESETS } from '../../../../../core/modules/eclipse/types';
import { useQuery, getWorkspaceMembers } from 'wasp/client/operations';
import { useToast } from '../../../../hooks/useToast';

interface AdvancedFiltersProps {
  resourceType: 'alerts' | 'infringements' | 'actions';
  workspaceId: string;
  currentFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  availableTags?: string[];
}

export function AdvancedFilters({
  resourceType,
  workspaceId,
  currentFilters,
  onFiltersChange,
  availableTags = [],
}: AdvancedFiltersProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(currentFilters);
  const [savedFilters, setSavedFilters] = useState<Array<{
    id: string;
    name: string;
    filters: Record<string, any>;
  }>>([]);
  const [filterName, setFilterName] = useState('');

  // Carregar workspace members para filtro de assignee
  const { data: membersData } = useQuery(getWorkspaceMembers, {
    workspaceId,
  });
  const members = membersData || [];

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`eclipse-filters-${resourceType}`);
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved filters', e);
      }
    }
  }, [resourceType]);

  const handleDateRangeChange = (preset: string) => {
    if (preset === 'custom') {
      // Limpar datas para permitir input manual
      setLocalFilters({ ...localFilters, datePreset: 'custom' });
    } else {
      const range = DATE_RANGE_PRESETS.find((p) => p.value === preset);
      if (range) {
        const dates = range.getDates();
        setLocalFilters({
          ...localFilters,
          datePreset: preset,
          createdAfter: dates.start,
          createdBefore: dates.end,
        });
      }
    }
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
    toast.success('Filtros aplicados');
  };

  const handleClearFilters = () => {
    const clearedFilters = { workspaceId };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    toast.success('Filtros limpos');
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error('Digite um nome para o filtro');
      return;
    }

    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: localFilters,
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem(`eclipse-filters-${resourceType}`, JSON.stringify(updated));
    setFilterName('');
    toast.success(`Filtro "${filterName}" salvo`);
  };

  const handleLoadFilter = (filterId: string) => {
    const filter = savedFilters.find((f) => f.id === filterId);
    if (filter) {
      setLocalFilters(filter.filters);
      toast.success(`Filtro "${filter.name}" carregado`);
    }
  };

  const handleDeleteFilter = (filterId: string) => {
    const updated = savedFilters.filter((f) => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem(`eclipse-filters-${resourceType}`, JSON.stringify(updated));
    toast.success('Filtro removido');
  };

  const activeFiltersCount = Object.keys(localFilters).filter(
    (key) => key !== 'workspaceId' && key !== 'limit' && key !== 'offset' && localFilters[key]
  ).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filtros Avançados
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>
            Configure filtros personalizados para {resourceType === 'alerts' ? 'alertas' : resourceType === 'infringements' ? 'infrações' : 'ações'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período
            </Label>
            <Select
              value={localFilters.datePreset || ''}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione período" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {localFilters.datePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label className="text-xs">Data inicial</Label>
                  <Input
                    type="date"
                    value={localFilters.createdAfter ? new Date(localFilters.createdAfter).toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        createdAfter: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Data final</Label>
                  <Input
                    type="date"
                    value={localFilters.createdBefore ? new Date(localFilters.createdBefore).toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        createdBefore: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Search Regex */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Busca Avançada (Regex)
            </Label>
            <Input
              placeholder="Ex: ^https?://.*\.com$"
              value={localFilters.searchRegex || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, searchRegex: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Busca por expressão regular em títulos, URLs e descrições
            </p>
          </div>

          {/* Tags (se disponível) */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = localFilters.tags?.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentTags = localFilters.tags || [];
                        const newTags = isSelected
                          ? currentTags.filter((t: string) => t !== tag)
                          : [...currentTags, tag];
                        setLocalFilters({
                          ...localFilters,
                          tags: newTags.length > 0 ? newTags : undefined,
                        });
                      }}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assignee (para infrações e ações) */}
          {(resourceType === 'infringements' || resourceType === 'actions') && members.length > 0 && (
            <div className="space-y-2">
              <Label>Atribuído a</Label>
              <Select
                value={localFilters.assignedTo || ''}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    assignedTo: value || undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os membros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os membros</SelectItem>
                  {members.map((member: any) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.user?.email || member.userId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtros Salvos */}
          {savedFilters.length > 0 && (
            <div className="space-y-2">
              <Label>Filtros Salvos</Label>
              <div className="space-y-2">
                {savedFilters.map((filter) => (
                  <div key={filter.id} className="flex items-center justify-between p-2 border rounded">
                    <button
                      onClick={() => handleLoadFilter(filter.id)}
                      className="text-sm hover:underline flex-1 text-left"
                    >
                      {filter.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFilter(filter.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Salvar Filtro Atual */}
          <div className="space-y-2 border-t pt-4">
            <Label>Salvar Configuração Atual</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do filtro"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
              <Button onClick={handleSaveFilter} size="sm">
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpar
          </Button>
          <Button onClick={handleApplyFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
