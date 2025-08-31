'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { StatementData } from '@/parsers/gpt5-schema'

interface ParseResult {
  success: boolean
  data?: StatementData
  error?: string
  filename: string
}

export function ImportContent() {
  const [files, setFiles] = useState<File[]>([])
  const [parsing, setParsing] = useState(false)
  const [results, setResults] = useState<ParseResult[]>([])
  const [selectedResult, setSelectedResult] = useState<ParseResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
      setResults([])
      setSelectedResult(null)
    }
  }

  const handleParse = async () => {
    if (files.length === 0) return

    setParsing(true)
    const newResults: ParseResult[] = []

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/statements/parse', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()
        newResults.push({
          ...result,
          filename: file.name
        })
      } catch (error) {
        newResults.push({
          success: false,
          error: `Failed to parse ${file.name}: ${error}`,
          filename: file.name
        })
      }
    }

    setResults(newResults)
    setParsing(false)
  }

  const handleIngest = async (result: ParseResult) => {
    if (!result.success || !result.data) return

    try {
      const response = await fetch('/api/statements/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.data),
      })

      if (response.ok) {
        // Update result to show it was ingested
        setResults(prev => prev.map(r => 
          r.filename === result.filename 
            ? { ...r, ingested: true }
            : r
        ))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to ingest statement')
      }
    } catch (error) {
      console.error('Ingestion error:', error)
      // Show error to user
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Statements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="statements">Select PDF Files</Label>
            <Input
              id="statements"
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>
          
          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Files:</h4>
              <div className="space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                    <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleParse} 
            disabled={files.length === 0 || parsing}
            className="w-full"
          >
            {parsing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Parsing Statements...
              </>
            ) : (
              'Parse Statements'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Results List */}
          <Card>
            <CardHeader>
              <CardTitle>Parse Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedResult?.filename === result.filename
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium text-sm">{result.filename}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {result.success && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleIngest(result)
                            }}
                            disabled={(result as any).ingested}
                          >
                            {(result as any).ingested ? 'Ingested' : 'Ingest'}
                          </Button>
                        )}
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                    
                    {!result.success && result.error && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Statement Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedResult ? (
                selectedResult.success && selectedResult.data ? (
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="transactions">Transactions</TabsTrigger>
                      <TabsTrigger value="raw">Raw Data</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid gap-4">
                        <div>
                          <Label>Issuer</Label>
                          <p className="font-medium">{selectedResult.data.issuer}</p>
                        </div>
                        <div>
                          <Label>Account</Label>
                          <p className="font-medium">****{selectedResult.data.account_last4}</p>
                        </div>
                        <div>
                          <Label>Statement Period</Label>
                          <p className="font-medium">
                            {selectedResult.data.period_start} to {selectedResult.data.period_end}
                          </p>
                        </div>
                        <div>
                          <Label>New Balance</Label>
                          <p className="font-medium text-lg">
                            ${selectedResult.data.new_balance.toFixed(2)}
                          </p>
                        </div>
                        {selectedResult.data.credit_limit && (
                          <div>
                            <Label>Credit Limit</Label>
                            <p className="font-medium">
                              ${selectedResult.data.credit_limit.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="transactions">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedResult.data.transactions.map((txn, index) => (
                          <div key={index} className="flex justify-between text-sm p-2 border rounded">
                            <div>
                              <p className="font-medium">{txn.description}</p>
                              <p className="text-muted-foreground">{txn.date}</p>
                            </div>
                            <p className={`font-medium ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${Math.abs(txn.amount).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="raw">
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                        {JSON.stringify(selectedResult.data, null, 2)}
                      </pre>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center text-red-600 py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Parse Failed</h3>
                    <p className="text-sm">{selectedResult.error}</p>
                  </div>
                )
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a parsed statement to preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}