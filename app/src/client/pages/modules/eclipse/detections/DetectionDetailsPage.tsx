import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getAlertDetails } from 'wasp/client/operations'
import { WorkspaceLayout } from '../../../workspace/WorkspaceLayout'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import {
  Camera,
  Code,
  BarChart3,
  Link2,
  Clock,
  ArrowLeft,
  AlertCircle,
  Globe,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs'

export default function EclipseDetectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: alert, isLoading, error } = useQuery(getAlertDetails, { alertId: id || '' })

  if (!id) {
    return (
      <WorkspaceLayout>
        <div className="w-full px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">Detecção não encontrada</h1>
            <Button onClick={() => navigate('/modules/eclipse/detections')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Detecções
            </Button>
          </div>
        </div>
      </WorkspaceLayout>
    )
  }

  if (isLoading) {
    return (
      <WorkspaceLayout>
        <div className="w-full px-8 py-8 flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </WorkspaceLayout>
    )
  }

  if (error || !alert) {
    return (
      <WorkspaceLayout>
        <div className="w-full px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold">Erro ao carregar detecção</h1>
            <p className="text-muted-foreground mt-2">{error?.message || 'Detecção não encontrada'}</p>
            <Button onClick={() => navigate('/modules/eclipse/detections')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Detecções
            </Button>
          </div>
        </div>
      </WorkspaceLayout>
    )
  }

  const analysisData = alert.analysisData as any
  const alertMetadata = alert.alertMetadata as any

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { 
          color: 'bg-red-500/10 text-red-700',
          bgBorder: 'border-red-200',
          label: 'CRÍTICO'
        }
      case 'high':
        return { 
          color: 'bg-orange-500/10 text-orange-700',
          bgBorder: 'border-orange-200',
          label: 'ALTO'
        }
      case 'medium':
        return { 
          color: 'bg-yellow-500/10 text-yellow-700',
          bgBorder: 'border-yellow-200',
          label: 'MÉDIO'
        }
      case 'low':
        return { 
          color: 'bg-blue-500/10 text-blue-700',
          bgBorder: 'border-blue-200',
          label: 'BAIXO'
        }
      default:
        return { 
          color: 'bg-gray-500/10 text-gray-700',
          bgBorder: 'border-gray-200',
          label: 'INDEFINIDO'
        }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-purple-500/10 text-purple-700'
      case 'acknowledged':
        return 'bg-blue-500/10 text-blue-700'
      case 'investigating':
        return 'bg-yellow-500/10 text-yellow-700'
      case 'escalated':
        return 'bg-red-500/10 text-red-700'
      case 'resolved':
        return 'bg-green-500/10 text-green-700'
      case 'dismissed':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const severityConfig = getSeverityConfig(alert.severity)

  return (
    <WorkspaceLayout>
      <div className="w-full">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-8">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/modules/eclipse/detections')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Alertas
              </Button>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                  <div>
                    <h1 className="text-4xl font-bold">{alert.title}</h1>
                    {alert.brand?.name && (
                      <p className="text-sm text-muted-foreground mt-1">Marca: {alert.brand.name}</p>
                    )}
                  </div>
                </div>
                {alert.description && (
                  <p className="text-muted-foreground mb-4">{alert.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge className={severityConfig.color}>
                    {severityConfig.label}
                  </Badge>
                  <Badge className={getStatusColor(alert.status)}>
                    {alert.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{alert.confidence}%</div>
                <div className="text-sm text-muted-foreground">Confiança</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="w-full px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tipo de Detecção</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{alert.detectionType}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(alert.status)}>
                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Detectado em</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{new Date(alert.createdAt).toLocaleDateString('pt-BR')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Última Atualização</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{new Date(alert.updatedAt).toLocaleDateString('pt-BR')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-8 py-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="evidence">Evidência</TabsTrigger>
              <TabsTrigger value="analysis">Análise</TabsTrigger>
              <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Alerta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Confiança da Detecção</label>
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${alert.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-semibold">{alert.confidence}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Severidade</label>
                      <Badge className={severityConfig.color}>
                        {severityConfig.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Detectado em
                      </label>
                      <p className="text-sm">{new Date(alert.createdAt).toLocaleString('pt-BR')}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Última Atualização
                      </label>
                      <p className="text-sm">{new Date(alert.updatedAt).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  {alert.brand && (
                    <div className="pt-4 border-t space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Marca Afetada</label>
                      <p className="text-sm font-semibold">{alert.brand.name || 'N/A'}</p>
                    </div>
                  )}

                  {alert.url && (
                    <div className="pt-4 border-t space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Link2 className="h-4 w-4" />
                        URL da Infração
                      </label>
                      <a
                        href={alert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all text-sm flex items-center gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        {alert.url}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evidence Tab */}
            <TabsContent value="evidence" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evidência de Conteúdo</CardTitle>
                </CardHeader>
                <CardContent>
                  {alert.content ? (
                    <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto border">
                      <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-mono">
                        {typeof alert.content === 'string' 
                          ? alert.content.substring(0, 2000)
                          : JSON.stringify(alert.content, null, 2).substring(0, 2000)
                        }
                        {(typeof alert.content === 'string' ? alert.content.length : JSON.stringify(alert.content).length) > 2000 ? '...' : ''}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma evidência de conteúdo disponível</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-4">
              {analysisData ? (
                <>
                  {/* Regex Matches */}
                  {analysisData.regex_matches && analysisData.regex_matches.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Code className="h-4 w-4" />
                          Correspondências de Regex ({analysisData.regex_matches.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysisData.regex_matches.map((match: any, idx: number) => (
                          <div key={idx} className="bg-muted p-3 rounded border">
                            <p className="font-mono text-xs text-muted-foreground mb-2">
                              Pattern: {match.pattern}
                            </p>
                            <p className="text-sm font-medium">
                              Encontrado: {match.matches?.join(', ') || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Localização: {match.location} ({match.count} vezes)
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* OCR Matches */}
                  {analysisData.ocr_matches && analysisData.ocr_matches.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <BarChart3 className="h-4 w-4" />
                          Correspondências OCR ({analysisData.ocr_matches.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysisData.ocr_matches.map((match: any, idx: number) => (
                          <div key={idx} className="bg-muted p-3 rounded border">
                            <p className="font-semibold text-sm">{match.term}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Encontrado {match.count} vez{match.count !== 1 ? 'es' : ''}
                            </p>
                          </div>
                        ))}
                        {analysisData.ocr_confidence && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm">
                              Confiança OCR: <span className="font-semibold">{analysisData.ocr_confidence.toFixed(2)}%</span>
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* OCR Text */}
                  {analysisData.ocr_text && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Texto OCR Extraído</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto border">
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {analysisData.ocr_text}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-muted-foreground text-center">Nenhum dado de análise disponível</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Screenshot Tab */}
            <TabsContent value="screenshot" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Screenshot da Evidência
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alert.screenshotUrl ? (
                    <div className="space-y-4">
                      <img
                        src={`/api/screenshot/${alert.id}`}
                        alt="Screenshot de evidência do alerta"
                        className="max-w-full h-auto rounded-lg border border-border"
                      />
                      <p className="text-xs text-muted-foreground">
                        Screenshot armazenado no S3/MinIO
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-muted-foreground">Nenhum screenshot disponível</p>
                      <p className="text-sm text-muted-foreground">
                        Execute o monitor novamente para gerar e fazer upload de um novo screenshot para o S3.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
