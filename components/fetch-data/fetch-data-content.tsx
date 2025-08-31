'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Shield, AlertTriangle, CheckCircle, Clock, Globe } from 'lucide-react'

interface FetchTask {
  id: string
  issuer: string
  accountId: string
  accountName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  lastRun?: string
  nextRun?: string
  error?: string
}

interface Institution {
  id: string
  name: string
  kind: string
  website?: string
}

async function fetchTasks(): Promise<FetchTask[]> {
  const response = await fetch('/api/fetch/tasks')
  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }
  return response.json()
}

async function fetchInstitutions(): Promise<Institution[]> {
  const response = await fetch('/api/institutions')
  if (!response.ok) {
    throw new Error('Failed to fetch institutions')
  }
  return response.json()
}

export function FetchDataContent() {
  const [selectedIssuer, setSelectedIssuer] = useState<string>('')
  const [running, setRunning] = useState<string>('')

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['fetch-tasks'],
    queryFn: fetchTasks,
    refetchInterval: 5000, // Refresh every 5 seconds when tasks are running
  })

  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: fetchInstitutions,
  })

  const handleRunFetch = async (issuer: string) => {
    setRunning(issuer)
    try {
      const response = await fetch(`/api/fetch/${issuer}`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to start fetch task')
      }
      
      // Refresh tasks list
      refetch()
    } catch (error) {
      console.error('Fetch error:', error)
      alert('Failed to start fetch task')
    } finally {
      setRunning('')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Determine support status based on institution kind
  const getInstitutionSupport = (institution: Institution) => {
    const supportMap: Record<string, { supported: boolean; features: string[]; notes: string }> = {
      'CHASE': {
        supported: true,
        features: ['Balance', 'Due Date', 'Close Date', 'Transactions'],
        notes: 'Full support with 2FA handling'
      },
      'CAPITALONE': {
        supported: true,
        features: ['Balance', 'Due Date', 'Available Credit'],
        notes: 'Requires manual 2FA approval'
      },
      'SYNCHRONY': {
        supported: true,
        features: ['Balance', 'Due Date', 'Promotions'],
        notes: 'Multiple brand support'
      },
      'APPLE': {
        supported: false,
        features: [],
        notes: 'API access not available'
      },
      'CREDITONE': {
        supported: true,
        features: ['Balance', 'Due Date'],
        notes: 'Basic support'
      },
      'MISSIONLANE': {
        supported: true,
        features: ['Balance', 'Due Date'],
        notes: 'Basic support'
      },
      'FIRSTINTERSTATE': {
        supported: false,
        features: [],
        notes: 'Online banking not yet supported'
      },
      'BESTEGG': {
        supported: false,
        features: [],
        notes: 'Loan portal not yet supported'
      },
      'UPSTART': {
        supported: false,
        features: [],
        notes: 'Loan portal not yet supported'
      }
    }

    return supportMap[institution.kind] || {
      supported: false,
      features: [],
      notes: 'Support status not determined'
    }
  }

  return (
    <Tabs defaultValue="tasks" className="space-y-6">
      <TabsList>
        <TabsTrigger value="tasks">Fetch Tasks</TabsTrigger>
        <TabsTrigger value="supported">Supported Issuers</TabsTrigger>
        <TabsTrigger value="security">Security & Privacy</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Quick Fetch
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!institutions ? (
                <div className="text-center py-8">Loading institutions...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {institutions
                    .filter(institution => getInstitutionSupport(institution).supported)
                    .map((institution) => {
                      const support = getInstitutionSupport(institution)
                      return (
                        <div key={institution.kind} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{institution.name}</h4>
                            <Badge variant="outline">
                              {support.features.length} features
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {support.notes}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleRunFetch(institution.kind)}
                            disabled={running === institution.kind}
                            className="w-full"
                          >
                            {running === institution.kind ? 'Starting...' : 'Fetch Now'}
                          </Button>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading tasks...</div>
              ) : !tasks || tasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Fetch Tasks</h3>
                  <p>Run your first fetch task to see results here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Issuer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          {task.accountName}
                        </TableCell>
                        <TableCell>{task.issuer}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                          {task.error && (
                            <div className="text-xs text-red-600 mt-1">
                              {task.error}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          {task.nextRun ? new Date(task.nextRun).toLocaleString() : 'Manual'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRunFetch(task.issuer)}
                            disabled={task.status === 'running'}
                          >
                            Run Again
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="supported">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Supported Issuers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!institutions ? (
              <div className="text-center py-8">Loading institutions...</div>
            ) : (
              <div className="space-y-4">
                {institutions.map((institution) => {
                  const support = getInstitutionSupport(institution)
                  return (
                    <div key={institution.kind} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{institution.name}</h4>
                        <Badge variant={support.supported ? 'default' : 'secondary'}>
                          {support.supported ? 'Supported' : 'Not Supported'}
                        </Badge>
                      </div>
                      
                      {support.supported ? (
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Features: </span>
                            <span className="text-sm text-muted-foreground">
                              {support.features.join(', ')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{support.notes}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{support.notes}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2 text-green-800">
                <CheckCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium">Secure by Design</div>
                  <ul className="text-sm text-green-700 mt-1 space-y-1">
                    <li>• All credentials encrypted with your vault passcode</li>
                    <li>• Browser automation runs locally on your machine</li>
                    <li>• No credentials stored in plain text</li>
                    <li>• Headful browsing with manual 2FA approval</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium">Important Considerations</div>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Respect website terms of service</li>
                    <li>• Use fetch features responsibly and sparingly</li>
                    <li>• Always verify fetched data accuracy</li>
                    <li>• Keep your credentials secure</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">How It Works</h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Encrypted credentials are retrieved from your vault</li>
                <li>2. A secure browser session is launched locally</li>
                <li>3. The automation logs in using your credentials</li>
                <li>4. You manually approve any 2FA prompts</li>
                <li>5. Account data is extracted and normalized</li>
                <li>6. Results are saved to your local database</li>
                <li>7. Browser session is closed and cleaned up</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">Data Collected</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Current account balances</li>
                <li>• Credit limits and available credit</li>
                <li>• Payment due dates and amounts</li>
                <li>• Statement close dates</li>
                <li>• Active promotions and offers</li>
                <li>• Recent transaction summaries</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}