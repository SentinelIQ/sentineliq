import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Filter, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface FilterState {
  search: string;
  severity?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  assignee?: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  severityOptions?: Array<{ value: string; label: string }>;
  statusOptions?: Array<{ value: string; label: string }>;
  assigneeOptions?: Array<{ value: string; label: string }>;
  showAssignee?: boolean;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  severityOptions,
  statusOptions,
  assigneeOptions,
  showAssignee = false,
}: FilterPanelProps) {
  const { t: tAegis } = useTranslation('aegis');
  const { t: tCommon } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({
      search: '',
      severity: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      assignee: undefined,
    });
  };

  const hasActiveFilters = 
    filters.severity || 
    filters.status || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.assignee;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {tCommon('filters.title')}
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={tCommon('filters.search')}
                value={filters.search}
                onChange={(e) => handleChange('search', e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {isExpanded ? tCommon('filters.hide') : tCommon('filters.show')}
            </Button>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                onClick={handleClear}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-2" />
                {tCommon('filters.clear')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Severity Filter */}
            {severityOptions && (
              <div className="space-y-2">
                <Label>{tCommon('filters.severity')}</Label>
                <Select 
                  value={filters.severity || 'all'} 
                  onValueChange={(value) => handleChange('severity', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tCommon('filters.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                    {severityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status Filter */}
            {statusOptions && (
              <div className="space-y-2">
                <Label>{tCommon('filters.status')}</Label>
                <Select 
                  value={filters.status || 'all'} 
                  onValueChange={(value) => handleChange('status', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tCommon('filters.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date From */}
            <div className="space-y-2">
              <Label>{tCommon('filters.dateFrom')}</Label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>{tCommon('filters.dateTo')}</Label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleChange('dateTo', e.target.value)}
              />
            </div>

            {/* Assignee Filter (optional) */}
            {showAssignee && assigneeOptions && (
              <div className="space-y-2">
                <Label>{tCommon('filters.assignee')}</Label>
                <Select 
                  value={filters.assignee || 'all'} 
                  onValueChange={(value) => handleChange('assignee', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tCommon('filters.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                    {assigneeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
