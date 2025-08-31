'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calculator, Calendar, TrendingUp, CheckCircle } from 'lucide-react'

interface AllocationPlan {
  totalBudget: number
  totalAllocated: number
  remaining: number
  allocations: Array<{
    accountId: string
    accountName: string
    amount: number
    rationale: string
    dueBy?: string
    willReport0: boolean
    priority: number
  }>
  strategy: string
  objectives: string[]
}

async function fetchAllocationPlan(budget: number, month: number, year: number): Promise<AllocationPlan> {
  const response = await fetch(`/api/plans/suggest?budget=${budget}&month=${month}&year=${year}`)
  if (!response.ok) {
    throw new Error('Failed to fetch allocation plan')
  }
  return response.json()
}

export function PayThisMonthContent() {
  const [budget, setBudget] = useState([1000])
  const [targetMonth] = useState(new Date().getMonth() + 1)
  const [targetYear] = useState(new Date().getFullYear())
  const [planGenerated, setPlanGenerated] = useState(false)

  const { data: plan, isLoading, refetch } = useQuery({
    queryKey: ['allocation-plan', budget[0], targetMonth, targetYear],
    queryFn: () => fetchAllocationPlan(budget[0], targetMonth, targetYear),
    enabled: planGenerated,
  })

  const handleGeneratePlan = () => {
    setPlanGenerated(true)
    refetch()
  }

  const handleMarkExecuted = async (accountId: string) => {
    try {
      await fetch('/api/payments/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, month: targetMonth, year: targetYear })
      })
      // Refresh the plan
      refetch()
    } catch (error) {
      console.error('Failed to mark payment as executed:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Budget Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Monthly Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="budget">Available Budget</Label>
              <span className="text-2xl font-bold">{formatCurrency(budget[0])}</span>
            </div>
            
            <Slider
              id="budget"
              min={100}
              max={5000}
              step={50}
              value={budget}
              onValueChange={setBudget}
              className="w-full"
            />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>$100</span>
              <span>$5,000</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Target Month: {new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            <Button onClick={handleGeneratePlan} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Plan */}
      {plan && (
        <div className="space-y-6">
          {/* Plan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Allocation Strategy: {plan.strategy}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(plan.totalBudget)}</div>
                  <div className="text-sm text-muted-foreground">Total Budget</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(plan.totalAllocated)}</div>
                  <div className="text-sm text-muted-foreground">Allocated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(plan.remaining)}</div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Objectives:</h4>
                <div className="space-y-1">
                  {plan.objectives.map((objective, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{objective}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allocation Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Payment Allocations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Rationale</TableHead>
                    <TableHead>Pay By</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.allocations.map((allocation, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {allocation.accountName}
                      </TableCell>
                      <TableCell className="text-lg font-semibold">
                        {formatCurrency(allocation.amount)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{allocation.rationale}</span>
                      </TableCell>
                      <TableCell>
                        {allocation.dueBy ? (
                          <div className="text-sm">
                            {formatDate(allocation.dueBy)}
                            <div className="text-xs text-muted-foreground">
                              {Math.ceil((new Date(allocation.dueBy).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Flexible</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {allocation.willReport0 && (
                            <Badge className="bg-green-100 text-green-800">
                              Reports $0
                            </Badge>
                          )}
                          {allocation.priority <= 2 && (
                            <Badge className="bg-red-100 text-red-800">
                              High Priority
                            </Badge>
                          )}
                          {allocation.rationale.includes('AZEO') && (
                            <Badge className="bg-blue-100 text-blue-800">
                              AZEO Strategy
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkExecuted(allocation.accountId)}
                        >
                          Mark Paid
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => {
                  const csv = [
                    ['Account', 'Amount', 'Rationale', 'Pay By', 'Will Report 0'],
                    ...plan.allocations.map(a => [
                      a.accountName,
                      a.amount.toString(),
                      a.rationale,
                      a.dueBy || '',
                      a.willReport0.toString()
                    ])
                  ].map(row => row.join(',')).join('\n')
                  
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `payment-plan-${targetMonth}-${targetYear}.csv`
                  a.click()
                }}>
                  Export CSV
                </Button>
                
                <Button variant="outline" onClick={() => {
                  const json = JSON.stringify(plan, null, 2)
                  const blob = new Blob([json], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `payment-plan-${targetMonth}-${targetYear}.json`
                  a.click()
                }}>
                  Export JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}