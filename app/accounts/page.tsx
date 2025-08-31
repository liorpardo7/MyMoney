import { AccountsContent } from '@/components/accounts/accounts-content'

export default function AccountsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground">
          Manage your credit cards, bank accounts, and loans
        </p>
      </div>
      
      <AccountsContent />
    </div>
  )
}