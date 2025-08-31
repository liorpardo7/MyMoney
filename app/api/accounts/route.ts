import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function GET() {
  try {
    // First check if there are any accounts
    const accountCount = await bigqueryDB.query('SELECT COUNT(*) as count FROM `mymoney-470619.mymoney.accounts`')
    const hasAccounts = accountCount[0]?.count > 0
    
    if (!hasAccounts) {
      return NextResponse.json([])
    }
    
    const accounts = await bigqueryDB.query(`
      SELECT * FROM \`mymoney-470619.mymoney.accounts\`
      ORDER BY createdAt DESC
    `)

    // Transform data to match expected format
    const transformedAccounts = accounts.map((account: any) => ({
      id: account.id,
      displayName: account.displayName,
      type: account.type,
      last4: account.last4,
      balance: 0, // No statements yet, so balance is 0
      limit: account.creditLimit || 0,
      utilization: account.creditLimit > 0 ? 0 : 0, // No balance, so utilization is 0
      apr: 0, // No APR data yet
      dueDate: null, // No statements yet
      closeDate: null, // No statements yet
      issuer: 'BANK', // Default to BANK since we're not joining institutions
      openedAt: account.openedAt || null,
      statements: [] // Empty array since no statements exist
    }))

    return NextResponse.json(transformedAccounts)
  } catch (error) {
    console.error('Get accounts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { displayName, type, last4, institutionId, creditLimit, apr } = body

    // Validate required fields
    if (!displayName || !type || !institutionId) {
      return NextResponse.json(
        { error: 'Missing required fields: displayName, type, institutionId' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    // Create account
    const accountData = {
      id: accountId,
      institutionId,
      type,
      displayName,
      last4: last4 || null,
      currency: 'USD',
      openedAt: now,
      closedAt: null,
      creditLimit: creditLimit || null,
      originalPrincipal: null,
      termMonths: null,
      secured: false,
      createdAt: now,
      updatedAt: now
    }

    await bigqueryDB.create('mymoney-470619.mymoney.accounts', accountData)

    // Create institution if it doesn't exist
    try {
      await bigqueryDB.create('mymoney-470619.mymoney.institutions', {
        id: institutionId,
        name: institutionId,
        kind: institutionId,
        website: null,
        createdAt: now
      })
    } catch (error) {
      // Institution might already exist, ignore error
      console.log('Institution creation skipped (might already exist):', error)
    }

    // Create APR history if APR is provided
    if (apr && type === 'CARD') {
      await bigqueryDB.create('mymoney-470619.mymoney.aprHistory', {
        id: `apr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accountId,
        aprType: 'PURCHASE',
        aprPct: apr,
        effective: now
      })
    }

    // Create limit history if credit limit is provided
    if (creditLimit && type === 'CARD') {
      await bigqueryDB.create('mymoney-470619.mymoney.limitHistory', {
        id: `limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accountId,
        limit: creditLimit,
        effective: now
      })
    }

    return NextResponse.json({
      success: true,
      account: accountData
    })
  } catch (error) {
    console.error('Create account error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}