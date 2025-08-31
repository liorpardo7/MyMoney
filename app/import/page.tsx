import { ImportContent } from '@/components/import/import-content'

export default function ImportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Statements</h1>
        <p className="text-muted-foreground">
          Upload PDF statements to automatically extract and parse financial data
        </p>
      </div>
      
      <ImportContent />
    </div>
  )
}