import OpenAI from 'openai'
import { StatementSchema, StatementData, STATEMENT_SYSTEM_PROMPT } from './gpt5-schema'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ParseResult {
  success: boolean
  data?: StatementData
  error?: string
  rawResponse?: string
}

export async function parseStatementWithGPT(pdfText: string): Promise<ParseResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview', // Use GPT-4 Turbo with JSON mode
      messages: [
        {
          role: 'system',
          content: STATEMENT_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Parse this financial statement and return structured JSON according to the schema:\n\n${pdfText}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for consistent parsing
    })

    const rawResponse = completion.choices[0]?.message?.content
    
    if (!rawResponse) {
      return {
        success: false,
        error: 'No response from OpenAI'
      }
    }

    try {
      const parsedJson = JSON.parse(rawResponse)
      const validatedData = StatementSchema.parse(parsedJson)
      
      return {
        success: true,
        data: validatedData,
        rawResponse
      }
    } catch (validationError) {
      return {
        success: false,
        error: `Validation failed: ${validationError instanceof z.ZodError 
          ? validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          : String(validationError)
        }`,
        rawResponse
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `OpenAI API error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

export async function parseStatementFallback(pdfText: string): Promise<ParseResult> {
  // Fallback parser using regex patterns for common statement formats
  // This is a simplified implementation - in production, you'd have more sophisticated parsing
  
  try {
    const lines = pdfText.split('\n').map(line => line.trim()).filter(Boolean)
    
    // Try to extract basic information using patterns
    const accountMatch = pdfText.match(/(?:Account|Card).*?(\d{4})/i)
    const balanceMatch = pdfText.match(/(?:New Balance|Current Balance|Balance).*?\$?([\d,]+\.?\d*)/i)
    const dueDateMatch = pdfText.match(/(?:Due Date|Payment Due).*?(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
    
    if (!balanceMatch) {
      return {
        success: false,
        error: 'Could not extract balance from statement'
      }
    }

    // Basic extracted data - this would need much more sophisticated parsing in production
    const fallbackData: StatementData = {
      issuer: 'UNKNOWN',
      account_last4: accountMatch?.[1] || null,
      account_type: 'CARD', // Default assumption
      period_start: new Date().toISOString().split('T')[0], // Placeholder
      period_end: new Date().toISOString().split('T')[0],   // Placeholder
      close_date: new Date().toISOString().split('T')[0],   // Placeholder
      due_date: dueDateMatch?.[1] ? new Date(dueDateMatch[1]).toISOString().split('T')[0] : null,
      credit_limit: null,
      new_balance: parseFloat(balanceMatch[1].replace(/,/g, '')),
      min_payment: null,
      aprs: [],
      promotions: [],
      transactions: [],
      notes: ['Parsed using fallback method - data may be incomplete'],
      missing: ['issuer', 'period_start', 'period_end', 'close_date', 'credit_limit', 'min_payment', 'aprs']
    }

    return {
      success: true,
      data: fallbackData
    }
  } catch (error) {
    return {
      success: false,
      error: `Fallback parsing failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}