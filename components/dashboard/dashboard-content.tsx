'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent, formatDate, calculateUtilization, getUtilizationBadgeColor } from '@/lib/utils'
import { CreditCard, TrendingUp, Calendar, AlertTriangle } from 'lucide-react'
import { UtilizationChart } from './utilization-chart'
import { AccountsHeatmap } from './accounts-heatmap'
import { UpcomingPayments } from './upcoming-payments'
import { AlertsWidget } from './alerts-widget'

interface DashboardData {
  totalBalance: number
  totalLimit: number
  overallUtilization: number
  cardsReporting: number
  totalCards: number
  nextDueDate?: string
  nextCloseDate?: string
  accounts: Array<{
    id: string
    displayName: string
    balance: number
    limit: number
    utilization: number
    dueDate?: string
    closeDate?: string
    issuer: string
  }>
  alerts: Array<{
    type: 'overlimit' | 'late_risk' | 'promo_expiring'
    message: string
    severity: 'high' | 'medium' | 'low'
    accountId?: string
  }>
}

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch('/api/dashboard')
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  return response.json()
}

export function DashboardContent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  })

  if (isLoading) {
    return <div>Loading dashboard...</div>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p>Start by importing statements or adding accounts to see your dashboard.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(data.totalLimit)} limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(data.overallUtilization)}</div>
            <Badge className={getUtilizationBadgeColor(data.overallUtilization)}>
              {data.overallUtilization >= 30 ? 'High' : data.overallUtilization >= 10 ? 'Medium' : 'Low'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cards Reporting</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.cardsReporting}</div>
            <p className="text-xs text-muted-foreground">
              of {data.totalCards} cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Due Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.nextDueDate ? formatDate(data.nextDueDate) : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Close: {data.nextCloseDate ? formatDate(data.nextCloseDate) : 'Unknown'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          <UtilizationChart data={data} />
          <AccountsHeatmap accounts={data.accounts} />
        </div>

        {/* Right Column - Alerts & Calendar */}
        <div className="space-y-6">
          <AlertsWidget alerts={data.alerts} />
          <UpcomingPayments accounts={data.accounts} />
        </div>
      </div>
    </div>
  )
}