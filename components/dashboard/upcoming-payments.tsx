'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, Clock } from 'lucide-react'

interface Account {
  id: string
  displayName: string
  balance: number
  dueDate?: string
  closeDate?: string
}

interface UpcomingPaymentsProps {
  accounts: Account[]
}

export function UpcomingPayments({ accounts }: UpcomingPaymentsProps) {
  const accountsWithDates = accounts
    .filter(account => account.dueDate || account.closeDate)
    .sort((a, b) => {
      const aDate = new Date(a.dueDate || a.closeDate!)
      const bDate = new Date(b.dueDate || b.closeDate!)
      return aDate.getTime() - bDate.getTime()
    })

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'bg-red-100 text-red-800'
    if (days <= 3) return 'bg-orange-100 text-orange-800'
    if (days <= 7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {accountsWithDates.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No upcoming payment dates</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accountsWithDates.slice(0, 5).map((account) => {
              const dueDate = account.dueDate
              const closeDate = account.closeDate
              const primaryDate = dueDate || closeDate!
              const daysUntil = getDaysUntil(primaryDate)
              
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{account.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {dueDate ? 'Due' : 'Closes'}: {formatDate(primaryDate)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(account.balance)}
                    </div>
                    <Badge className={getUrgencyColor(daysUntil)}>
                      {daysUntil < 0 
                        ? `${Math.abs(daysUntil)}d overdue`
                        : daysUntil === 0 
                        ? 'Today'
                        : `${daysUntil}d`
                      }
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}