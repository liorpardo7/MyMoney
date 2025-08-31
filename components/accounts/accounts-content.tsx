'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatPercent, formatDate, getUtilizationBadgeColor } from '@/lib/utils'
import { CreditCard, Building, TrendingUp, Calendar, Plus, Edit } from 'lucide-react'
import { AddAccountDialog } from './add-account-dialog'
import { EditAccountDialog } from './edit-account-dialog'

interface Account {
  id: string
  displayName: string
  type: string
  last4?: string
  balance: number
  limit: number
  utilization: number
  apr: number
  dueDate?: string
  closeDate?: string
  issuer: string
  openedAt?: string
  statements: Array<{
    id: string
    periodStart: string
    periodEnd: string
    newBalance: number
    minPayment: number
  }>
}

async function fetchAccounts(): Promise<Account[]> {
  try {
    const response = await fetch('/api/accounts')
    if (!response.ok) {
      throw new Error('Failed to fetch accounts')
    }
    const data = await response.json()
    console.log('API response:', data)
    return data
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}

async function addAccount(accountData: any): Promise<void> {
  const response = await fetch('/api/accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add account')
  }
}

export function AccountsContent() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        console.log('Loading accounts...')
        const data = await fetchAccounts()
        console.log('Accounts loaded:', data)
        setAccounts(data)
      } catch (err) {
        console.error('Error loading accounts:', err)
        // Fallback to test data if API fails
        const testData: Account[] = [
          {
            id: 'test-1',
            displayName: 'Test Card',
            type: 'CARD',
            last4: '1234',
            balance: 0,
            limit: 1000,
            utilization: 0,
            apr: 0,
            dueDate: undefined,
            closeDate: undefined,
            issuer: 'BANK',
            openedAt: undefined,
            statements: []
          }
        ]
        setAccounts(testData)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadAccounts()
  }, [])

  const handleAccountUpdated = async () => {
    // Refresh the accounts list
    const newData = await fetchAccounts()
    setAccounts(newData)
  }

  const handleEditRow = (accountId: string) => {
    if (editingId === accountId) {
      // Save the changes
      saveAccountChanges(accountId)
    } else {
      // Start editing
      const account = accounts.find(acc => acc.id === accountId)
      if (account) {
        setEditingId(accountId)
        setEditingData({
          displayName: account.displayName,
          creditLimit: account.limit.toString(),
          apr: account.apr.toString(),
          last4: account.last4 || '',
          closingDay: account.closeDate ? new Date(account.closeDate).getDate().toString() : ''
        })
      }
    }
  }

  const saveAccountChanges = async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: editingData.displayName,
          creditLimit: parseFloat(editingData.creditLimit) || null,
          apr: parseFloat(editingData.apr) || null,
          last4: editingData.last4 || null,
          closingDay: editingData.closingDay ? parseInt(editingData.closingDay) : null
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update account')
      }

      // Refresh accounts and exit edit mode
      await handleAccountUpdated()
      setEditingId(null)
      setEditingData({})
    } catch (error: any) {
      console.error('Failed to update account:', error)
      // Keep in edit mode on error
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setEditingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return <div>Loading accounts...</div>
  }

  // For debugging, show accounts count
  console.log('Accounts loaded:', accounts.length, accounts)

  // Calculate top-level metrics
  const totalCreditLimit = accounts.reduce((sum, acc) => sum + (acc.limit || 0), 0)
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  const totalUtilization = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0
  const cardAccounts = accounts.filter(acc => acc.type === 'CARD')
  const bankAccounts = accounts.filter(acc => acc.type === 'BANK')
  const loanAccounts = accounts.filter(acc => acc.type === 'LOAN')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Enhanced Accounts Page</h2>
      
      {/* Top Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCreditLimit)}</div>
            <p className="text-xs text-muted-foreground">
              Across {cardAccounts.length} credit cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Current outstanding balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {totalUtilization >= 90 ? 'Critical' : 
               totalUtilization >= 70 ? 'High' : 
               totalUtilization >= 50 ? 'Medium' : 
               totalUtilization >= 30 ? 'Low' : 'Optimal'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCreditLimit - totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Remaining credit capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Type Tabs */}
      <Tabs defaultValue="cards" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cards">
            Credit Cards ({cardAccounts.length})
          </TabsTrigger>
          <TabsTrigger value="banks">
            Bank Accounts ({bankAccounts.length})
          </TabsTrigger>
          <TabsTrigger value="loans">
            Loans ({loanAccounts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          <AccountsTable accounts={cardAccounts} type="CARD" onAccountUpdated={handleAccountUpdated} />
        </TabsContent>

        <TabsContent value="banks">
          <AccountsTable accounts={bankAccounts} type="BANK" onAccountUpdated={handleAccountUpdated} />
        </TabsContent>

        <TabsContent value="loans">
          <AccountsTable accounts={loanAccounts} type="LOAN" onAccountUpdated={handleAccountUpdated} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AccountsTable({ accounts, type, onAccountUpdated }: { accounts: Account[], type: string, onAccountUpdated: () => void }) {
  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <div className="mb-4">
              {type === 'CARD' && <CreditCard className="h-12 w-12 mx-auto" />}
              {type === 'BANK' && <Building className="h-12 w-12 mx-auto" />}
              {type === 'LOAN' && <TrendingUp className="h-12 w-12 mx-auto" />}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No {type === 'CARD' ? 'Credit Cards' : type === 'BANK' ? 'Bank Accounts' : 'Loans'} Found
            </h3>
            <p>Import statements to automatically add accounts.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Balance</TableHead>
              {type === 'CARD' && <TableHead>Limit</TableHead>}
              {type === 'CARD' && <TableHead>Utilization</TableHead>}
              <TableHead>APR</TableHead>
              {type === 'CARD' && <TableHead>Closing Date</TableHead>}
              <TableHead>Due Date</TableHead>
              <TableHead>Statements</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {type === 'CARD' && <CreditCard className="h-5 w-5 text-blue-600" />}
                    {type === 'BANK' && <Building className="h-5 w-5 text-green-600" />}
                    {type === 'LOAN' && <TrendingUp className="h-5 w-5 text-purple-600" />}
                    <div>
                      {editingId === account.id ? (
                        <Input
                          value={editingData.displayName || ''}
                          onChange={(e) => handleInputChange('displayName', e.target.value)}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <div className="font-medium">{account.displayName}</div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {account.issuer} • ****{account.last4}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(account.balance)}</div>
                    {type === 'CARD' && (
                      <div className="text-xs text-muted-foreground">
                        Available: {formatCurrency(account.limit - account.balance)}
                      </div>
                    )}
                  </div>
                </TableCell>
                {type === 'CARD' && (
                  <TableCell>
                    <div className="text-right">
                      {editingId === account.id ? (
                        <Input
                          type="number"
                          value={editingData.creditLimit || ''}
                          onChange={(e) => handleInputChange('creditLimit', e.target.value)}
                          className="h-8 text-sm text-right"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      ) : (
                        <div className="font-semibold">{formatCurrency(account.limit)}</div>
                      )}
                    </div>
                  </TableCell>
                )}
                {type === 'CARD' && (
                  <TableCell>
                    <div className="text-center">
                      <div className="font-semibold">{formatPercent(account.utilization)}</div>
                      <Badge className={`mt-1 ${getUtilizationBadgeColor(account.utilization)}`}>
                        {account.utilization >= 90 ? 'Critical' :
                         account.utilization >= 70 ? 'High' :
                         account.utilization >= 50 ? 'Medium' :
                         account.utilization >= 30 ? 'Low' : 'Optimal'}
                      </Badge>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="text-center">
                    {editingId === account.id ? (
                      <Input
                        type="number"
                        value={editingData.apr || ''}
                        onChange={(e) => handleInputChange('apr', e.target.value)}
                        className="h-8 text-sm text-center"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    ) : (
                      <div className="font-semibold">
                        {account.apr > 0 ? `${account.apr.toFixed(2)}%` : 'N/A'}
                      </div>
                    )}
                  </div>
                </TableCell>
                {type === 'CARD' && (
                  <TableCell>
                    {editingId === account.id ? (
                      <div className="text-center">
                        <Input
                          type="number"
                          value={editingData.closingDay || ''}
                          onChange={(e) => handleInputChange('closingDay', e.target.value)}
                          className="h-8 text-sm text-center"
                          placeholder="15"
                          min="1"
                          max="31"
                        />
                        <div className="text-xs text-muted-foreground">Day of month</div>
                      </div>
                    ) : (
                      account.closeDate ? (
                        <div className="text-center">
                          <div className="font-medium">{formatDate(account.closeDate)}</div>
                          <div className="text-xs text-muted-foreground">
                            Day {new Date(account.closeDate).getDate()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {account.dueDate ? (
                    <div className="text-center">
                      <div className="font-medium">{formatDate(account.dueDate)}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No due date</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-center">
                    <Badge variant="outline">
                      {account.statements.length}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {editingId === account.id ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditRow(account.id)}
                        >
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingId(null)
                            setEditingData({})
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditRow(account.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}