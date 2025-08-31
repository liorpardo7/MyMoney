'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react'

interface Alert {
  type: 'overlimit' | 'late_risk' | 'promo_expiring'
  message: string
  severity: 'high' | 'medium' | 'low'
  accountId?: string
}

interface AlertsWidgetProps {
  alerts: Alert[]
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'overlimit':
        return <AlertTriangle className="h-4 w-4" />
      case 'late_risk':
        return <Clock className="h-4 w-4" />
      case 'promo_expiring':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <div className="text-green-600 mb-2">✓</div>
            <p>All good! No alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-2">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <Badge 
                      variant="outline" 
                      className="mt-1 text-xs"
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}