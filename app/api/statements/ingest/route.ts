import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'
import { StatementSchema, StatementData } from '@/parsers/gpt5-schema'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the incoming data
    const validatedData = StatementSchema.parse(body)
    
    // Find or create institution
    let institution = await bigqueryDB.findFirst('institutions', { name: validatedData.issuer })
    
    if (!institution) {
      // Try to map issuer name to known kinds
      const issuerKindMap: Record<string, any> = {
        'SYNCHRONY': 'SYNCHRONY',
        'CAPITAL ONE': 'CAPITALONE',
        'CHASE': 'CHASE',
        'CREDIT ONE': 'CREDITONE',
        'MISSION LANE': 'MISSIONLANE',
        'APPLE': 'APPLE',
        'FIRST INTERSTATE': 'FIRSTINTERSTATE',
        'BEST EGG': 'BESTEGG',
        'UPSTART': 'UPSTART'
      }
      
      const issuerKind = issuerKindMap[validatedData.issuer.toUpperCase()] || 'OTHER'
      
      institution = await bigqueryDB.create('institutions', {
        id: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: validatedData.issuer,
        kind: issuerKind,
        createdAt: new Date().toISOString()
      })
    }

    // Find or create account
    let account = await bigqueryDB.findFirst('accounts', {
      institutionId: institution.id,
      last4: validatedData.account_last4,
      type: validatedData.account_type
    })

    if (!account) {
      account = await bigqueryDB.create('accounts', {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        institutionId: institution.id,
        type: validatedData.account_type,
        displayName: `${validatedData.issuer} ****${validatedData.account_last4}`,
        last4: validatedData.account_last4,
        creditLimit: validatedData.credit_limit,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    // Check if statement already exists (idempotent ingestion)
    const existingStatement = await bigqueryDB.findFirst('statements', {
      accountId: account.id,
      periodStart: new Date(validatedData.period_start).toISOString(),
      periodEnd: new Date(validatedData.period_end).toISOString()
    })

    if (existingStatement) {
      return NextResponse.json({
        success: true,
        message: 'Statement already exists',
        statementId: existingStatement.id
      })
    }

    // Create statement
    const statement = await bigqueryDB.create('statements', {
      id: `stmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accountId: account.id,
      periodStart: new Date(validatedData.period_start).toISOString(),
      periodEnd: new Date(validatedData.period_end).toISOString(),
      closeDate: new Date(validatedData.close_date).toISOString(),
      dueDate: validatedData.due_date ? new Date(validatedData.due_date).toISOString() : null,
      newBalance: validatedData.new_balance,
      minPayment: validatedData.min_payment || 0,
      parsedBy: 'gpt5',
      createdAt: new Date().toISOString()
    })

    // Create APR history entries
    for (const apr of validatedData.aprs) {
      await bigqueryDB.create('aprHistory', {
        id: `apr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accountId: account.id,
        aprType: apr.type,
        aprPct: apr.apr_pct,
        effective: new Date(validatedData.close_date).toISOString()
      })
    }

    // Create limit history if credit limit is provided
    if (validatedData.credit_limit) {
      await bigqueryDB.create('limitHistory', {
        id: `lim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accountId: account.id,
        limit: validatedData.credit_limit,
        effective: new Date(validatedData.close_date).toISOString()
      })
    }

    // Create promotions
    for (const promo of validatedData.promotions) {
      if (promo.start_date && promo.end_date) {
        await bigqueryDB.create('promotions', {
          id: `pro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          accountId: account.id,
          promoType: promo.type,
          startDate: new Date(promo.start_date).toISOString(),
          endDate: new Date(promo.end_date).toISOString(),
          notes: promo.notes
        })
      }
    }

    // Create transactions
    for (const txn of validatedData.transactions) {
      await bigqueryDB.create('transactions', {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accountId: account.id,
        postedAt: new Date(txn.date).toISOString(),
        description: txn.description,
        amount: txn.amount,
        source: 'statement'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Statement ingested successfully',
      statementId: statement.id,
      accountId: account.id
    })
  } catch (error) {
    console.error('Ingest API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Server error: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    )
  }
}