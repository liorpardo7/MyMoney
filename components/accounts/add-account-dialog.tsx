'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X } from 'lucide-react'

interface AddAccountFormData {
  displayName: string
  type: 'CARD' | 'BANK' | 'LOAN'
  last4: string
  institutionId: string
  creditLimit?: number
  apr?: number
}

interface AddAccountDialogProps {
  onAddAccount: (data: AddAccountFormData) => Promise<void>
}

export function AddAccountDialog({ onAddAccount }: AddAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<AddAccountFormData>({
    displayName: '',
    type: 'CARD',
    last4: '',
    institutionId: '',
    creditLimit: undefined,
    apr: undefined
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await onAddAccount(formData)
      setIsOpen(false)
      setFormData({
        displayName: '',
        type: 'CARD',
        last4: '',
        institutionId: '',
        creditLimit: undefined,
        apr: undefined
      })
    } catch (error) {
      console.error('Failed to add account:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof AddAccountFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Account
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Add New Account</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Account Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="e.g., Chase Freedom Unlimited"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Account Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value as 'CARD' | 'BANK' | 'LOAN')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARD">Credit Card</SelectItem>
                  <SelectItem value="BANK">Bank Account</SelectItem>
                  <SelectItem value="LOAN">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="last4">Last 4 Digits</Label>
              <Input
                id="last4"
                value={formData.last4}
                onChange={(e) => handleInputChange('last4', e.target.value)}
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institutionId">Institution</Label>
              <Input
                id="institutionId"
                value={formData.institutionId}
                onChange={(e) => handleInputChange('institutionId', e.target.value)}
                placeholder="e.g., CHASE, CAPITALONE"
                required
                disabled={isLoading}
              />
            </div>

            {formData.type === 'CARD' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={formData.creditLimit || ''}
                    onChange={(e) => handleInputChange('creditLimit', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="5000"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apr">APR (%)</Label>
                  <Input
                    id="apr"
                    type="number"
                    step="0.01"
                    value={formData.apr || ''}
                    onChange={(e) => handleInputChange('apr', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="18.99"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Adding...' : 'Add Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
