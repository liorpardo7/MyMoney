import { z } from 'zod'

export const StatementSchema = z.object({
  issuer: z.string(),
  account_last4: z.string().nullable(),
  account_type: z.enum(['CARD', 'BANK', 'LOAN']),
  period_start: z.string(), // ISO date string
  period_end: z.string(),   // ISO date string
  close_date: z.string(),   // ISO date string
  due_date: z.string().nullable(), // ISO date string
  credit_limit: z.number().nullable(),
  new_balance: z.number(),
  min_payment: z.number().nullable(),
  aprs: z.array(z.object({
    type: z.enum(['purchase', 'cash', 'loan']),
    apr_pct: z.number()
  })),
  promotions: z.array(z.object({
    type: z.string(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    notes: z.string().nullable()
  })),
  transactions: z.array(z.object({
    date: z.string(), // ISO date string
    description: z.string(),
    amount: z.number() // positive for credits, negative for debits
  })),
  notes: z.array(z.string()),
  missing: z.array(z.string())
})

export type StatementData = z.infer<typeof StatementSchema>

export const STATEMENT_SYSTEM_PROMPT = `You are a financial document parser that converts bank, credit card, and loan PDF statements into structured JSON data.

CRITICAL INSTRUCTIONS:
1. Extract data EXACTLY as it appears in the document
2. Never invent or estimate values - if a field is missing, return null and add to "missing" array
3. For dates, use ISO format (YYYY-MM-DD)
4. For amounts, use positive numbers for credits/payments, negative for debits/charges
5. Be precise with account identification (last 4 digits, issuer name)
6. Capture ALL APR information found in the document
7. Identify any promotional offers or special terms

VALIDATION RULES:
- period_start must be before period_end
- close_date should be at or after period_end
- due_date should be after close_date (if present)
- new_balance should match the statement balance
- Transaction amounts should be consistent with statement math

If you cannot parse the document or it's not a financial statement, return an error in the "notes" field.`