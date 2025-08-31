import { PayThisMonthContent } from '@/components/pay-this-month/pay-this-month-content'

export default function PayThisMonthPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pay This Month</h1>
        <p className="text-muted-foreground">
          Optimize your monthly payments for maximum credit score improvement and minimum interest
        </p>
      </div>
      
      <PayThisMonthContent />
    </div>
  )
}