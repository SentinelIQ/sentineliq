import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Badge } from '../../../../components/ui/badge'
import { Switch } from '../../../../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { X, Plus } from 'lucide-react'

interface CreateMonitorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  initialData?: any
  brands: any[]
  preselectedBrandId?: string
}

export function CreateMonitorDialog({ open, onOpenChange, onSubmit, initialData, brands, preselectedBrandId }: CreateMonitorDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    brandId: preselectedBrandId || '',
    monitoringType: 'domain' as 'domain' | 'social' | 'marketplace' | 'web' | 'dns',
    source: '',
    searchTerms: [] as string[],
    excludeTerms: [] as string[],
    keywords: [] as string[],
    targetRegions: [] as string[],
    targetLanguages: ['pt', 'es', 'en'],
    yaraRules: '',
    regexPatterns: [] as string[],
    domainPatterns: [] as string[],
    confidenceThreshold: 70,
    checkFrequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    isAutomated: true,
    enableScreenshots: true,
    enableOCR: false,
    deepAnalysis: false,
  })
  
  const [searchTermInput, setSearchTermInput] = useState('')
  const [excludeTermInput, setExcludeTermInput] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [regionInput, setRegionInput] = useState('')
  const [regexInput, setRegexInput] = useState('')
  const [domainPatternInput, setDomainPatternInput] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        brandId: initialData.brandId || preselectedBrandId || '',
        monitoringType: initialData.monitoringType || 'domain',
        source: initialData.source || '',
        searchTerms: initialData.searchTerms || [],
        excludeTerms: initialData.excludeTerms || [],
        keywords: initialData.keywords || [],
        targetRegions: initialData.targetRegions || [],
        targetLanguages: initialData.targetLanguages || ['pt', 'es', 'en'],
        yaraRules: initialData.yaraRules || '',
        regexPatterns: initialData.regexPatterns || [],
        domainPatterns: initialData.domainPatterns || [],
        confidenceThreshold: initialData.confidenceThreshold || 70,
        checkFrequency: initialData.checkFrequency || 'daily',
        isAutomated: initialData.isAutomated ?? true,
        enableScreenshots: initialData.enableScreenshots ?? true,
        enableOCR: initialData.enableOCR ?? false,
        deepAnalysis: initialData.deepAnalysis ?? false,
      })
    } else if (preselectedBrandId) {
      setFormData(prev => ({ ...prev, brandId: preselectedBrandId }))
    }
  }, [initialData, open, preselectedBrandId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  const addToArray = (field: keyof typeof formData, value: string, setter: (val: string) => void) => {
    if (value.trim()) {
      const currentArray = formData[field] as string[]
      if (!currentArray.includes(value.trim())) {
        setFormData({
          ...formData,
          [field]: [...currentArray, value.trim()],
        })
        setter('')
      }
    }
  }

  const removeFromArray = (field: keyof typeof formData, value: string) => {
    const currentArray = formData[field] as string[]
    setFormData({
      ...formData,
      [field]: currentArray.filter((item) => item !== value),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: keyof typeof formData, value: string, setter: (val: string) => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addToArray(field, value, setter)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Monitor' : 'Novo Monitor'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Atualize as configurações do monitor.' 
              : 'Configure um novo monitor para rastreamento de marca.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="py-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="terms">Termos</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
              <TabsTrigger value="options">Opções</TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandId">Marca *</Label>
                <Select 
                  value={formData.brandId} 
                  onValueChange={(value) => setFormData({ ...formData, brandId: value })}
                  disabled={!!preselectedBrandId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monitoringType">Tipo de Monitoramento *</Label>
                <Select 
                  value={formData.monitoringType} 
                  onValueChange={(value: any) => setFormData({ ...formData, monitoringType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">Domínio</SelectItem>
                    <SelectItem value="social">Redes Sociais</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="web">Web/Conteúdo</SelectItem>
                    <SelectItem value="dns">DNS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Fonte/URL *</Label>
                <Input
                  id="source"
                  placeholder="Ex: google.com, twitter.com, mercadolivre.com.br"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Plataforma ou domínio onde o monitor será executado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkFrequency">Frequência de Verificação</Label>
                <Select 
                  value={formData.checkFrequency} 
                  onValueChange={(value: any) => setFormData({ ...formData, checkFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                    <SelectItem value="monthly">Mensalmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Terms Tab */}
            <TabsContent value="terms" className="space-y-4">
              <div className="space-y-2">
                <Label>Termos de Busca * (mínimo 1)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: nome da marca, produto"
                    value={searchTermInput}
                    onChange={(e) => setSearchTermInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'searchTerms', searchTermInput, setSearchTermInput)}
                  />
                  <Button type="button" onClick={() => addToArray('searchTerms', searchTermInput, setSearchTermInput)} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.searchTerms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.searchTerms.map((term) => (
                      <Badge key={term} variant="secondary">
                        {term}
                        <button type="button" onClick={() => removeFromArray('searchTerms', term)} className="ml-2">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Termos de Exclusão</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Palavras que devem ser ignoradas"
                    value={excludeTermInput}
                    onChange={(e) => setExcludeTermInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'excludeTerms', excludeTermInput, setExcludeTermInput)}
                  />
                  <Button type="button" onClick={() => addToArray('excludeTerms', excludeTermInput, setExcludeTermInput)} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.excludeTerms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.excludeTerms.map((term) => (
                      <Badge key={term} variant="outline">
                        {term}
                        <button type="button" onClick={() => removeFromArray('excludeTerms', term)} className="ml-2">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Palavras-chave Adicionais</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Palavras relacionadas à marca"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'keywords', keywordInput, setKeywordInput)}
                  />
                  <Button type="button" onClick={() => addToArray('keywords', keywordInput, setKeywordInput)} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary">
                        {kw}
                        <button type="button" onClick={() => removeFromArray('keywords', kw)} className="ml-2">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Regiões-alvo</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: BR, US, PT"
                    value={regionInput}
                    onChange={(e) => setRegionInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'targetRegions', regionInput, setRegionInput)}
                  />
                  <Button type="button" onClick={() => addToArray('targetRegions', regionInput, setRegionInput)} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.targetRegions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.targetRegions.map((region) => (
                      <Badge key={region} variant="outline">
                        {region}
                        <button type="button" onClick={() => removeFromArray('targetRegions', region)} className="ml-2">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="yaraRules">Regras YARA</Label>
                <Textarea
                  id="yaraRules"
                  placeholder="rule brand_protection { ... }"
                  value={formData.yaraRules}
                  onChange={(e) => setFormData({ ...formData, yaraRules: e.target.value })}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Regras YARA para detecção avançada de padrões
                </p>
              </div>

              <div className="space-y-2">
                <Label>Padrões Regex</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: /marca\s*(oficial|registrada)/i"
                    value={regexInput}
                    onChange={(e) => setRegexInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'regexPatterns', regexInput, setRegexInput)}
                    className="font-mono text-sm"
                  />
                  <Button type="button" onClick={() => addToArray('regexPatterns', regexInput, setRegexInput)} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.regexPatterns.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {formData.regexPatterns.map((pattern) => (
                      <div key={pattern} className="flex items-center gap-2 bg-muted p-2 rounded text-xs font-mono">
                        <span className="flex-1">{pattern}</span>
                        <button type="button" onClick={() => removeFromArray('regexPatterns', pattern)}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Padrões de Domínio</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: *marca*.com, fake-marca.net"
                    value={domainPatternInput}
                    onChange={(e) => setDomainPatternInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'domainPatterns', domainPatternInput, setDomainPatternInput)}
                  />
                  <Button type="button" onClick={() => addToArray('domainPatterns', domainPatternInput, setDomainPatternInput)} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.domainPatterns.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.domainPatterns.map((pattern) => (
                      <Badge key={pattern} variant="secondary">
                        {pattern}
                        <button type="button" onClick={() => removeFromArray('domainPatterns', pattern)} className="ml-2">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidenceThreshold">Limiar de Confiança: {formData.confidenceThreshold}%</Label>
                <input
                  type="range"
                  id="confidenceThreshold"
                  min="0"
                  max="100"
                  value={formData.confidenceThreshold}
                  onChange={(e) => setFormData({ ...formData, confidenceThreshold: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Apenas alertas com confiança acima deste valor serão gerados
                </p>
              </div>
            </TabsContent>

            {/* Options Tab */}
            <TabsContent value="options" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Monitoramento Automatizado</Label>
                  <p className="text-xs text-muted-foreground">
                    Executar verificações automaticamente
                  </p>
                </div>
                <Switch
                  checked={formData.isAutomated}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAutomated: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Capturas de Tela</Label>
                  <p className="text-xs text-muted-foreground">
                    Capturar screenshots das violações detectadas
                  </p>
                </div>
                <Switch
                  checked={formData.enableScreenshots}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableScreenshots: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>OCR em Imagens</Label>
                  <p className="text-xs text-muted-foreground">
                    Extrair texto de imagens para análise
                  </p>
                </div>
                <Switch
                  checked={formData.enableOCR}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableOCR: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Análise Profunda</Label>
                  <p className="text-xs text-muted-foreground">
                    Análise detalhada com crawler e análise de conteúdo
                  </p>
                </div>
                <Switch
                  checked={formData.deepAnalysis}
                  onCheckedChange={(checked) => setFormData({ ...formData, deepAnalysis: checked })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.brandId || !formData.source || formData.searchTerms.length === 0}>
              {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar Monitor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
