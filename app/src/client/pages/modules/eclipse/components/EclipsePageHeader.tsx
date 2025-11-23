import { ReactNode } from 'react'
import { Button } from '../../../../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Breadcrumb {
  label: string
  href?: string
}

interface EclipsePageHeaderProps {
  icon: ReactNode
  title: string
  description: string
  breadcrumbs?: Breadcrumb[]
  actions?: ReactNode
  stats?: Array<{
    icon: ReactNode
    label: string
    value: string | number
    color?: string
  }>
}

export function EclipsePageHeader({
  icon,
  title,
  description,
  breadcrumbs,
  actions,
  stats,
}: EclipsePageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-gradient-to-r from-purple-500/10 via-purple-600/5 to-transparent border-b border-border">
      <div className="w-full px-8 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                {crumb.href ? (
                  <button
                    onClick={() => navigate(crumb.href!)}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Header Content */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              {icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Stats Bar */}
        {stats && stats.length > 0 && (
          <div className={`grid gap-4 ${stats.length === 4 ? 'grid-cols-4' : `grid-cols-${stats.length}`}`}>
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50"
              >
                {stat.icon}
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color || ''}`}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface EclipsePageContainerProps {
  children: ReactNode
  className?: string
}

export function EclipsePageContainer({ children, className = '' }: EclipsePageContainerProps) {
  return (
    <div className={`w-full px-8 py-8 ${className}`}>
      {children}
    </div>
  )
}

interface EclipsePageBackButtonProps {
  label?: string
  to: string
}

export function EclipsePageBackButton({ label = 'Voltar', to }: EclipsePageBackButtonProps) {
  const navigate = useNavigate()
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(to)}
      className="mb-4"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )
}
