import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    let sql = `
      SELECT 
        t.*,
        a.displayName as accountName,
        a.type as accountType,
        i.name as institutionName
      FROM \`mymoney.transactions\` t
      JOIN \`mymoney.accounts\` a ON t.accountId = a.id
      JOIN \`mymoney.institutions\` i ON a.institutionId = i.id
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (accountId && accountId !== 'all') {
      sql += ` AND t.accountId = ?`
      params.push(accountId)
    }
    
    if (category && category !== 'all') {
      sql += ` AND t.category = ?`
      params.push(category)
    }
    
    if (startDate) {
      sql += ` AND t.postedAt >= ?`
      params.push(startDate)
    }
    
    if (endDate) {
      sql += ` AND t.postedAt <= ?`
      params.push(endDate)
    }
    
    sql += ` ORDER BY t.postedAt DESC LIMIT ?`
    params.push(limit)
    
    const transactions = await bigqueryDB.query(sql, params)
    
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountId, postedAt, description, amount, category, source, metadata } = body

    // Validate required fields
    if (!accountId || !postedAt || !description || amount === undefined || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, postedAt, description, amount, source' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create transaction
    const transactionData = {
      id: transactionId,
      accountId,
      postedAt,
      description,
      amount,
      category: category || null,
      source,
      metadata: metadata || null
    }

    await bigqueryDB.create('transactions', transactionData)

    return NextResponse.json({
      success: true,
      transaction: transactionData
    })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
