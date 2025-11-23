import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Badge } from '../../../../components/ui/badge'
import { X } from 'lucide-react'

interface CreateBrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  initialData?: any
}

export function CreateBrandDialog({ open, onOpenChange, onSubmit, initialData }: CreateBrandDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trademark: '',
    priority: 3, // 1-5 scale, 3 = medium
    domains: [] as string[],
  })
  const [domainInput, setDomainInput] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        trademark: initialData.trademark || '',
        priority: initialData.priority || 3,
        domains: initialData.domains || [],
      })
    } else {
      setFormData({
        name: '',
        description: '',
        trademark: '',
        priority: 3,
        domains: [],
      })
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = () => {
    let domain = domainInput.trim()
    if (!domain) return
    
    // Add https:// if no protocol
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
      domain = 'https://' + domain
    }
    
    // Check if already exists
    if (!formData.domains.includes(domain)) {
      setFormData({
        ...formData,
        domains: [...formData.domains, domain],
      })
      setDomainInput('')
    }
  }

  const handleRemoveDomain = (domain: string) => {
    setFormData({
      ...formData,
      domains: formData.domains.filter((d) => d !== domain),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddDomain()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Marca' : 'Nova Marca'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Atualize as informações da marca protegida.' 
              : 'Adicione uma nova marca para proteger com o Eclipse.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Marca *</Label>
              <Input
                id="name"
                placeholder="Ex: Minha Empresa"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva a marca e o que ela representa..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Trademark */}
            <div className="space-y-2">
              <Label htmlFor="trademark">Trademark/Registro</Label>
              <Input
                id="trademark"
                placeholder="Ex: ® Marca Registrada ou Nº Registro INPI"
                value={formData.trademark}
                onChange={(e) => setFormData({ ...formData, trademark: e.target.value })}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select 
                value={formData.priority.toString()} 
                onValueChange={(value: string) => setFormData({ ...formData, priority: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Muito Baixa</SelectItem>
                  <SelectItem value="2">2 - Baixa</SelectItem>
                  <SelectItem value="3">3 - Média</SelectItem>
                  <SelectItem value="4">4 - Alta</SelectItem>
                  <SelectItem value="5">5 - Crítica</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define a importância desta marca para priorização de alertas (1-5)
              </p>
            </div>

            {/* Domains */}
            <div className="space-y-2">
              <Label htmlFor="domain">Domínios Oficiais</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  placeholder="Ex: minhaempresa.com.br ou https://minhaempresa.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button type="button" onClick={handleAddDomain} variant="outline">
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Domínios legítimos da marca. Digite o domínio e pressione Enter (https:// será adicionado automaticamente)
              </p>
              
              {/* Domain Tags */}
              {formData.domains.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.domains.map((domain) => (
                    <Badge key={domain} variant="secondary" className="text-xs">
                      {domain}
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar Marca'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
