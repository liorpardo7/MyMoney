import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { displayName, creditLimit, apr, last4, closingDay } = body

    // Validate that the account exists
    const existingAccount = await bigqueryDB.findUnique('mymoney-470619.mymoney.accounts', { id })
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    const updates: any = {
      updatedAt: now
    }

    // Update account fields if provided
    if (displayName !== undefined) {
      updates.displayName = displayName
    }
    if (last4 !== undefined) {
      updates.last4 = last4
    }
    if (creditLimit !== undefined) {
      updates.creditLimit = creditLimit
    }
    if (closingDay !== undefined && closingDay !== null) {
      // Calculate the next closing date based on the day of month
      const now = new Date()
      let nextCloseDate = new Date(now.getFullYear(), now.getMonth(), closingDay)
      
      // If the day has already passed this month, set it for next month
      if (nextCloseDate <= now) {
        nextCloseDate = new Date(now.getFullYear(), now.getMonth() + 1, closingDay)
      }
      
      updates.closeDate = nextCloseDate.toISOString()
    }

    // Update the account
    if (Object.keys(updates).length > 1) { // More than just updatedAt
      await bigqueryDB.update('mymoney-470619.mymoney.accounts', updates, { id })
    }

    // Update APR history if APR is provided
    if (apr !== undefined && apr !== null) {
      const aprHistoryId = `apr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await bigqueryDB.create('mymoney-470619.mymoney.aprHistory', {
        id: aprHistoryId,
        accountId: id,
        aprType: 'PURCHASE',
        aprPct: apr,
        effective: now
      })
    }

    // Update limit history if credit limit is provided
    if (creditLimit !== undefined && creditLimit !== null) {
      const limitHistoryId = `limit_${Date.now()}_${Math.random()}.toString(36).substr(2, 9)}`
      await bigqueryDB.create('mymoney-470619.mymoney.limitHistory', {
        id: limitHistoryId,
        accountId: id,
        limit: creditLimit,
        effective: now
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully'
    })
  } catch (error) {
    console.error('Update account error:', error)
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const account = await bigqueryDB.query(`
      SELECT 
        a.*,
        i.name as institutionName,
        i.kind as institutionKind,
        s.closeDate as latestCloseDate,
        s.dueDate as latestDueDate,
        s.newBalance as latestBalance,
        s.minPayment as latestMinPayment,
        l.limit as currentLimit,
        apr.aprPct as currentApr,
        COUNT(s.id) as statementCount
      FROM \`mymoney-470619.mymoney.accounts\` a
      JOIN \`mymoney-470619.mymoney.institutions\` i ON a.institutionId = i.id
      LEFT JOIN \`mymoney-470619.mymoney.statements\` s ON a.id = s.accountId
      LEFT JOIN (
        SELECT 
          accountId,
          limit,
          ROW_NUMBER() OVER (PARTITION BY accountId ORDER BY effective DESC) as rn
        FROM \`mymoney-470619.mymoney.limitHistory\`
      ) l ON a.id = l.accountId AND l.rn = 1
      LEFT JOIN (
        SELECT 
          accountId,
          aprPct,
          ROW_NUMBER() OVER (PARTITION BY accountId ORDER BY effective DESC) as rn
        FROM \`mymoney-470619.mymoney.aprHistory\`
      ) apr ON a.id = apr.accountId AND apr.rn = 1
      WHERE a.id = ?
      GROUP BY 
        a.id, a.institutionId, a.type, a.displayName, a.last4, a.currency,
        a.openedAt, a.closedAt, a.creditLimit, a.originalPrincipal, a.termMonths,
        a.secured, a.createdAt, a.updatedAt,
        i.name, i.kind,
        s.closeDate, s.dueDate, s.newBalance, s.minPayment,
        l.limit, apr.aprPct
    `, [id])

    if (!account || account.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const accountData = account[0]
    
    // Transform data to match expected format
    const transformedAccount = {
      id: accountData.id,
      displayName: accountData.displayName,
      type: accountData.type,
      last4: accountData.last4,
      balance: accountData.latestBalance || 0,
      limit: accountData.currentLimit || accountData.creditLimit || 0,
      utilization: (accountData.currentLimit || accountData.creditLimit) > 0 
        ? ((accountData.latestBalance || 0) / (accountData.currentLimit || accountData.creditLimit)) * 100 
        : 0,
      apr: accountData.currentApr || 0,
      dueDate: accountData.latestDueDate,
      closeDate: accountData.latestCloseDate,
      issuer: accountData.institutionKind,
      openedAt: accountData.openedAt,
      statements: [{
        id: 'temp',
        periodStart: accountData.latestCloseDate,
        periodEnd: accountData.latestCloseDate,
        newBalance: accountData.latestBalance || 0,
        minPayment: accountData.latestMinPayment || 0
      }]
    }

    return NextResponse.json(transformedAccount)
  } catch (error) {
    console.error('Get account error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    )
  }
}
