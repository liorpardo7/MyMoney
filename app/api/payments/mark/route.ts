import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function POST(request: NextRequest) {
  try {
    const { accountId, month, year } = await request.json()

    if (!accountId || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, month, year' },
        { status: 400 }
      )
    }

    // Find or create a plan for this month/year
    let plan = await bigqueryDB.findFirst('plans', { month, year })

    if (!plan) {
      plan = await bigqueryDB.create('plans', {
        id: `plan_${month}_${year}_${Date.now()}`,
        month,
        year,
        budget: 0, // Will be updated when we have the actual plan
        strategy: 'Manual Payment Tracking',
        createdAt: new Date().toISOString()
      })
    }

    // Create a transaction record to mark the payment as executed
    await bigqueryDB.create('transactions', {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accountId,
      postedAt: new Date().toISOString(),
      description: 'Payment marked as executed',
      amount: 0, // We don't track the exact amount here, just the fact that it was paid
      source: 'manual',
      metadata: JSON.stringify({
        planId: plan.id,
        markedAt: new Date().toISOString()
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Payment marked as executed'
    })
  } catch (error) {
    console.error('Mark payment API error:', error)
    return NextResponse.json(
      { error: `Failed to mark payment: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}