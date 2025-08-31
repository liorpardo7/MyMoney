'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { vault, storeSecret, retrieveSecret } from '@/lib/crypto-vault'
import { Shield, Key, Database, AlertTriangle, CheckCircle } from 'lucide-react'

export function SettingsContent() {
  const [vaultUnlocked, setVaultUnlocked] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [databaseUrl, setDatabaseUrl] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setVaultUnlocked(vault.isUnlocked())
    
    // Load settings if vault is unlocked
    if (vault.isUnlocked()) {
      loadSettings()
    }
  }, [])

  const loadSettings = async () => {
    try {
      const apiKey = await retrieveSecret('openai_api_key')
      if (apiKey) setOpenaiKey(apiKey)
      
      const dbUrl = await retrieveSecret('database_url')
      if (dbUrl) setDatabaseUrl(dbUrl)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleUnlockVault = async () => {
    setLoading(true)
    try {
      const success = await vault.unlock(passcode)
      if (success) {
        setVaultUnlocked(true)
        await loadSettings()
      } else {
        alert('Invalid passcode')
      }
    } catch (error) {
      console.error('Failed to unlock vault:', error)
      alert('Failed to unlock vault')
    }
    setLoading(false)
  }

  const handleLockVault = () => {
    vault.lock()
    setVaultUnlocked(false)
    setPasscode('')
    setOpenaiKey('')
    setDatabaseUrl('')
  }

  const handleSaveSettings = async () => {
    if (!vaultUnlocked) return
    
    setLoading(true)
    try {
      if (openaiKey) {
        await storeSecret('openai_api_key', openaiKey)
      }
      
      if (databaseUrl) {
        await storeSecret('database_url', databaseUrl)
      }
      
      alert('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    }
    setLoading(false)
  }

  return (
    <Tabs defaultValue="vault" className="space-y-6">
      <TabsList>
        <TabsTrigger value="vault">Vault & Security</TabsTrigger>
        <TabsTrigger value="api">API Keys</TabsTrigger>
        <TabsTrigger value="database">Database</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
      </TabsList>

      <TabsContent value="vault">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Vault Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {vaultUnlocked ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Shield className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">
                    Vault Status: {vaultUnlocked ? 'Unlocked' : 'Locked'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {vaultUnlocked 
                      ? 'Your credentials are accessible' 
                      : 'Enter passcode to access encrypted credentials'
                    }
                  </div>
                </div>
              </div>
              <Badge variant={vaultUnlocked ? 'default' : 'secondary'}>
                {vaultUnlocked ? 'Unlocked' : 'Locked'}
              </Badge>
            </div>

            {!vaultUnlocked ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="passcode">Vault Passcode</Label>
                  <Input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter your vault passcode"
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleUnlockVault} 
                  disabled={!passcode || loading}
                  className="w-full"
                >
                  {loading ? 'Unlocking...' : 'Unlock Vault'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Vault is unlocked</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    You can now access and modify your encrypted credentials.
                  </p>
                </div>
                <Button 
                  onClick={handleLockVault} 
                  variant="outline"
                  className="w-full"
                >
                  Lock Vault
                </Button>
              </div>
            )}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium">Security Notice</div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your passcode encrypts all sensitive data including API keys and credentials. 
                    Keep it secure and don't share it with anyone.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="api">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!vaultUnlocked ? (
              <div className="text-center text-muted-foreground py-8">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Unlock the vault to manage API keys</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Required for GPT-5 statement parsing
                  </p>
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Saving...' : 'Save API Keys'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="database">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg">
              <div className="font-medium mb-2">Current Database</div>
              <div className="text-sm text-muted-foreground">
                SQLite (Local file-based database)
              </div>
              <Badge variant="outline" className="mt-2">
                Local-first
              </Badge>
            </div>

            {vaultUnlocked && (
              <div>
                <Label htmlFor="database-url">Custom Database URL (Optional)</Label>
                <Input
                  id="database-url"
                  type="password"
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                  placeholder="postgresql://user:password@localhost:5432/creditcontrol"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to use local SQLite database
                </p>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-800">
                <div className="font-medium">Local-first Architecture</div>
                <p className="text-sm text-blue-700 mt-1">
                  By default, all your data is stored locally in an SQLite database. 
                  This ensures privacy and works offline.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="about">
        <Card>
          <CardHeader>
            <CardTitle>About Personal Credit Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Version</h3>
              <p className="text-muted-foreground">1.0.0</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Local-first personal finance platform</li>
                <li>• GPT-5 powered statement parsing</li>
                <li>• AZEO credit optimization strategy</li>
                <li>• Encrypted credential storage</li>
                <li>• Automated payment planning</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Privacy & Security</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• All data stored locally by default</li>
                <li>• End-to-end encryption for sensitive data</li>
                <li>• No data sent to external services (except OpenAI for parsing)</li>
                <li>• Open source and auditable</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 border rounded-lg">
              <div className="text-sm text-muted-foreground">
                <strong>Disclaimer:</strong> This software is for informational purposes only. 
                Always verify financial calculations and consult with financial professionals 
                for important decisions.
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}