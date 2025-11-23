import React from 'react'
import { BrandAlert } from 'wasp/entities'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs'
import {
  Camera,
  Code,
  BarChart3,
  Link2,
  Clock,
  Activity,
} from 'lucide-react'

interface DetectionDetailsModalProps {
  alert: BrandAlert
  onClose: () => void
}

export default function DetectionDetailsModal({ alert, onClose }: DetectionDetailsModalProps) {
  const analysisData = alert.analysisData as any
  const alertMetadata = alert.alertMetadata as any

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {alert.title}
            <Badge className={getSeverityColor(alert.severity)}>
              {alert.severity.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>{alert.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-lg">{alert.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Confidence</label>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${alert.confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-lg font-semibold">
                        {alert.confidence}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Detectado em
                    </label>
                    <p className="text-sm">
                      {new Date(alert.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Tipo de Detecção
                    </label>
                    <p className="text-sm">{alert.detectionType}</p>
                  </div>
                </div>

                {alert.url && (
                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-muted-foreground">URL</label>
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all text-sm"
                    >
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
                <CardTitle>Content Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                {alert.content ? (
                  <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                      {alert.content.substring(0, 2000)}...
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No content evidence</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            {analysisData && (
              <>
                {/* Regex Matches */}
                {analysisData.regex_matches && analysisData.regex_matches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Code className="h-4 w-4" />
                        Regex Matches ({analysisData.regex_matches.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysisData.regex_matches.map((match: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                          <p className="font-mono text-xs text-gray-600">
                            Pattern: {match.pattern}
                          </p>
                          <p className="text-gray-700">
                            Found: {match.matches?.join(', ') || 'N/A'}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Location: {match.location} ({match.count} times)
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
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-4 w-4" />
                        OCR Matches ({analysisData.ocr_matches.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysisData.ocr_matches.map((match: any, idx: number) => (
                        <div key={idx} className="bg-muted p-3 rounded text-sm">
                          <p className="font-semibold">{match.term}</p>
                          <p className="text-muted-foreground text-xs">
                            Found {match.count} time{match.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      ))}
                      {analysisData.ocr_confidence && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground">
                            OCR Confidence: <span className="font-semibold">{analysisData.ocr_confidence.toFixed(2)}%</span>
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
                      <CardTitle className="text-sm">Extracted OCR Text</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">
                          {analysisData.ocr_text}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Screenshot Tab */}
          <TabsContent value="screenshot" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Camera className="h-4 w-4" />
                  Evidence Screenshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alert.screenshotUrl ? (
                  <div className="space-y-4">
                    <img
                      src={alert.screenshotUrl}
                      alt="Alert evidence"
                      className="max-w-full h-auto rounded-lg border border-border"
                    />
                    <a
                      href={alert.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Open in full size
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No screenshot available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
