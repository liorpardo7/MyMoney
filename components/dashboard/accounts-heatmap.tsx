'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent, getUtilizationBadgeColor } from '@/lib/utils'

interface Account {
  id: string
  displayName: string
  balance: number
  limit: number
  utilization: number
  issuer: string
}

interface AccountsHeatmapProps {
  accounts: Account[]
}

export function AccountsHeatmap({ accounts }: AccountsHeatmapProps) {
  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>No accounts found. Import statements or add accounts to get started.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{account.displayName}</h4>
                  <Badge variant="outline" className="text-xs">
                    {account.issuer}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(account.balance)} of {formatCurrency(account.limit)}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold">
                  {formatPercent(account.utilization)}
                </div>
                <Badge className={getUtilizationBadgeColor(account.utilization)}>
                  {account.utilization >= 90 ? 'Critical' :
                   account.utilization >= 70 ? 'High' :
                   account.utilization >= 50 ? 'Medium' :
                   account.utilization >= 30 ? 'Low' : 'Optimal'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}