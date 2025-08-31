import { NextRequest, NextResponse } from 'next/server'
import { parseStatementWithGPT, parseStatementFallback } from '@/parsers/statement-router'
import pdf from 'pdf-parse'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Extract text from PDF
    const buffer = await file.arrayBuffer()
    const pdfData = await pdf(Buffer.from(buffer))
    const pdfText = pdfData.text

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not extract text from PDF' },
        { status: 400 }
      )
    }

    // Try GPT-5 parsing first
    let result = await parseStatementWithGPT(pdfText)
    
    // If GPT parsing fails, try fallback
    if (!result.success) {
      console.log('GPT parsing failed, trying fallback:', result.error)
      result = await parseStatementFallback(pdfText)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Parse API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Server error: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    )
  }
}