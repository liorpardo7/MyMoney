'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
}

interface EditAccountDialogProps {
  account: Account
  onAccountUpdated: () => void
}

export function EditAccountDialog({ account, onAccountUpdated }: EditAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: account.displayName,
    creditLimit: account.limit.toString(),
    apr: account.apr.toString(),
    last4: account.last4 || '',
    closingDay: account.closeDate ? new Date(account.closeDate).getDate().toString() : ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          creditLimit: parseFloat(formData.creditLimit) || null,
          apr: parseFloat(formData.apr) || null,
          last4: formData.last4 || null,
          closingDay: formData.closingDay ? parseInt(formData.closingDay) : null
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update account')
      }

      toast.success('Account updated successfully')
      onAccountUpdated()
      setOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update account information for {account.displayName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Account display name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="last4">Last 4 Digits</Label>
            <Input
              id="last4"
              value={formData.last4}
              onChange={(e) => handleInputChange('last4', e.target.value)}
              placeholder="1234"
              maxLength={4}
            />
          </div>

          {account.type === 'CARD' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => handleInputChange('creditLimit', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apr">APR (%)</Label>
                <Input
                  id="apr"
                  type="number"
                  value={formData.apr}
                  onChange={(e) => handleInputChange('apr', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closingDay">Closing Date (Day of Month)</Label>
                <Input
                  id="closingDay"
                  type="number"
                  value={formData.closingDay}
                  onChange={(e) => handleInputChange('closingDay', e.target.value)}
                  placeholder="15"
                  min="1"
                  max="31"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the day of the month when your statement closes (1-31)
                </p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
