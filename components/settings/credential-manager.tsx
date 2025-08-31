'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { vault } from '@/lib/crypto-vault'
import { Key, Plus, Trash2, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react'

interface Institution {
  id: string
  name: string
  kind: string
  website?: string
}

interface Credential {
  id: string
  institutionId: string
  institutionName: string
  institutionKind: string
  username?: string
  hasPassword: boolean
  hasSecurityQA: boolean
  notes?: string
  lastUsed?: string
  createdAt: string
}

async function fetchInstitutions(): Promise<Institution[]> {
  const response = await fetch('/api/institutions')
  if (!response.ok) throw new Error('Failed to fetch institutions')
  return response.json()
}

async function fetchCredentials(): Promise<Credential[]> {
  const response = await fetch('/api/credentials')
  if (!response.ok) throw new Error('Failed to fetch credentials')
  return response.json()
}

export function CredentialManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedInstitution, setSelectedInstitution] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [securityQA, setSecurityQA] = useState('')
  const [notes, setNotes] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [vaultUnlocked, setVaultUnlocked] = useState(false)

  const queryClient = useQueryClient()

  useEffect(() => {
    setVaultUnlocked(vault.isUnlocked())
  }, [])

  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: fetchInstitutions,
  })

  const { data: credentials, isLoading } = useQuery({
    queryKey: ['credentials'],
    queryFn: fetchCredentials,
    enabled: vaultUnlocked,
  })

  const saveCredentialMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to save credential')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] })
      setIsDialogOpen(false)
      resetForm()
    },
  })

  const deleteCredentialMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/credentials/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete credential')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] })
    },
  })

  const resetForm = () => {
    setSelectedInstitution('')
    setUsername('')
    setPassword('')
    setSecurityQA('')
    setNotes('')
    setShowPassword(false)
  }

  const handleSave = () => {
    if (!selectedInstitution || !username || !password) {
      alert('Please fill in all required fields')
      return
    }

    saveCredentialMutation.mutate({
      institutionId: selectedInstitution,
      username,
      password,
      securityQA: securityQA || undefined,
      notes: notes || undefined,
    })
  }

  if (!vaultUnlocked) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Vault Locked</h3>
            <p>Unlock the vault to manage login credentials</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Login Credentials
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Login Credential</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="institution">Institution</Label>
                  <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select institution" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions?.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="username">Username/Email</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your login username or email"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your login password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="securityQA">Security Questions (Optional)</Label>
                  <Textarea
                    id="securityQA"
                    value={securityQA}
                    onChange={(e) => setSecurityQA(e.target.value)}
                    placeholder="JSON format: {&quot;What is your mother's maiden name?&quot;: &quot;Smith&quot;}"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special login instructions..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saveCredentialMutation.isPending}
                  >
                    {saveCredentialMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading credentials...</div>
        ) : !credentials || credentials.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Credentials Stored</h3>
            <p>Add login credentials to enable automatic data fetching</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institution</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((cred) => (
                <TableRow key={cred.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{cred.institutionName}</div>
                      <Badge variant="outline" className="text-xs">
                        {cred.institutionKind}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{cred.username || 'Not set'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {cred.hasPassword && (
                        <Badge className="bg-green-100 text-green-800">Password</Badge>
                      )}
                      {cred.hasSecurityQA && (
                        <Badge className="bg-blue-100 text-blue-800">Security Q&A</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {cred.lastUsed 
                      ? new Date(cred.lastUsed).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCredentialMutation.mutate(cred.id)}
                      disabled={deleteCredentialMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <div className="font-medium">Security Notice</div>
              <p className="text-sm text-yellow-700 mt-1">
                All credentials are encrypted with your vault passcode and stored locally. 
                Never share your credentials or passcode with anyone.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}