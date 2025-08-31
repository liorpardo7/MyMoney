import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    let sql = `
      SELECT 
        s.*,
        a.displayName as accountName,
        a.type as accountType,
        i.name as institutionName
      FROM \`mymoney.statements\` s
      JOIN \`mymoney.accounts\` a ON s.accountId = a.id
      JOIN \`mymoney.institutions\` i ON a.institutionId = i.id
    `
    
    const params: any[] = []
    
    if (accountId && accountId !== 'all') {
      sql += ` WHERE s.accountId = ?`
      params.push(accountId)
    }
    
    sql += ` ORDER BY s.createdAt DESC LIMIT ?`
    params.push(limit)
    
    const statements = await bigqueryDB.query(sql, params)
    
    return NextResponse.json(statements)
  } catch (error) {
    console.error('Get statements error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountId, periodStart, periodEnd, closeDate, dueDate, newBalance, minPayment, pdfPath } = body

    // Validate required fields
    if (!accountId || !periodStart || !periodEnd || !closeDate || newBalance === undefined || minPayment === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, periodStart, periodEnd, closeDate, newBalance, minPayment' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const statementId = `stmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    // Create statement
    const statementData = {
      id: statementId,
      accountId,
      periodStart,
      periodEnd,
      closeDate,
      dueDate: dueDate || null,
      newBalance,
      minPayment,
      pdfPath: pdfPath || null,
      parsedBy: 'manual-entry',
      createdAt: now
    }

    await bigqueryDB.create('statements', statementData)

    return NextResponse.json({
      success: true,
      statement: statementData
    })
  } catch (error) {
    console.error('Create statement error:', error)
    return NextResponse.json(
      { error: 'Failed to create statement' },
      { status: 500 }
    )
  }
}
