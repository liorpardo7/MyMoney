'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface UtilizationChartProps {
  data: {
    totalBalance: number
    totalLimit: number
    overallUtilization: number
  }
}

export function UtilizationChart({ data }: UtilizationChartProps) {
  const chartData = [
    {
      name: 'Used Credit',
      value: data.totalBalance,
      color: data.overallUtilization > 30 ? '#ef4444' : data.overallUtilization > 10 ? '#f59e0b' : '#10b981'
    },
    {
      name: 'Available Credit',
      value: data.totalLimit - data.totalBalance,
      color: '#e5e7eb'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(value),
                  ''
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-4">
          <div className="text-2xl font-bold">
            {((data.totalBalance / data.totalLimit) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">
            Overall Utilization
          </div>
        </div>
      </CardContent>
    </Card>
  )
}