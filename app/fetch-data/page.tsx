import { FetchDataContent } from '@/components/fetch-data/fetch-data-content'

export default function FetchDataPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fetch Data</h1>
        <p className="text-muted-foreground">
          Automatically fetch account balances and statements using secure browser automation
        </p>
      </div>
      
      <FetchDataContent />
    </div>
  )
}