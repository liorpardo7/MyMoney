'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { CalendarIcon, DollarSignIcon, FileTextIcon, CreditCardIcon, BuildingIcon } from 'lucide-react'

interface Statement {
  id: string
  accountId: string
  periodStart: string
  periodEnd: string
  closeDate: string
  dueDate?: string
  newBalance: number
  minPayment: number
  pdfPath: string
  parsedBy: string
  createdAt: string
  accountName?: string
  accountType?: string
  institutionName?: string
}

interface Account {
  id: string
  displayName: string
  type: string
  institutionName: string
  statementCount: number
  totalBalance: number
}

export default function StatementsPage() {
  const [statements, setStatements] = useState<Statement[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch statements with account and institution details
      const statementsResponse = await fetch('/api/statements')
      if (statementsResponse.ok) {
        const statementsData = await statementsResponse.json()
        setStatements(statementsData)
      }

      // Fetch accounts summary
      const accountsResponse = await fetch('/api/accounts')
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        setAccounts(accountsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStatements = selectedAccount === 'all' 
    ? statements 
    : statements.filter(stmt => stmt.accountId === selectedAccount)

  const totalBalance = filteredStatements.reduce((sum, stmt) => sum + stmt.newBalance, 0)
  const totalMinPayment = filteredStatements.reduce((sum, stmt) => sum + stmt.minPayment, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CARD':
        return <CreditCardIcon className="h-4 w-4" />
      case 'CHECKING':
        return <BuildingIcon className="h-4 w-4" />
      default:
        return <BuildingIcon className="h-4 w-4" />
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CARD':
        return 'bg-red-100 text-red-800'
      case 'CHECKING':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statements</h1>
          <p className="text-gray-600 mt-2">View and manage your financial statements</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Across {filteredStatements.length} statements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Min Payment</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMinPayment)}</div>
            <p className="text-xs text-muted-foreground">
              Minimum payments due
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">
              With statements
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="statements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="statements" className="space-y-6">
          {/* Account Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Filter by Account:</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.displayName} ({account.institutionName})
                </option>
              ))}
            </select>
          </div>

          {/* Statements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Statement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Min Payment</TableHead>
                    <TableHead>Close Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStatements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getAccountTypeIcon(statement.accountType || '')}
                          <div>
                            <div className="font-medium">{statement.accountName || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{statement.institutionName || 'Unknown'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(statement.newBalance)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(statement.minPayment)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-3 w-3 text-gray-400" />
                          <span>{formatDate(statement.closeDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {statement.dueDate ? (
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-3 w-3 text-gray-400" />
                            <span>{formatDate(statement.dueDate)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <FileTextIcon className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {statement.pdfPath.split('/').pop()}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Statements</TableHead>
                    <TableHead>Total Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.displayName}</TableCell>
                      <TableCell>
                        <Badge className={getAccountTypeColor(account.type)}>
                          {account.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.institutionName}</TableCell>
                      <TableCell>{account.statementCount}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(account.totalBalance || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
