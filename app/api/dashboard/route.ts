import { NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function GET() {
  try {
    // First check if there are any accounts
    const accountCount = await bigqueryDB.query('SELECT COUNT(*) as count FROM `mymoney.accounts`')
    const hasAccounts = accountCount[0]?.count > 0
    
    if (!hasAccounts) {
      return NextResponse.json({
        totalBalance: 0,
        totalLimit: 0,
        overallUtilization: 0,
        cardsReporting: 0,
        totalCards: 0,
        nextDueDate: null,
        nextCloseDate: null,
        accounts: [],
        alerts: []
      })
    }
    
    // Fetch accounts with their latest statements and related data
    const accounts = await bigqueryDB.query(`
      SELECT 
        a.*,
        i.name as institutionName,
        i.kind as institutionKind,
        s.closeDate as statementCloseDate,
        s.dueDate as statementDueDate,
        s.newBalance as statementBalance,
        s.minPayment as statementMinPayment,
        l.limit as currentLimit,
        apr.aprPct as currentApr
      FROM \`mymoney.accounts\` a
      JOIN \`mymoney.institutions\` i ON a.institutionId = i.id
      LEFT JOIN (
        SELECT 
          accountId,
          closeDate,
          dueDate,
          newBalance,
          minPayment,
          ROW_NUMBER() OVER (PARTITION BY accountId ORDER BY closeDate DESC) as rn
        FROM \`mymoney.statements\`
      ) s ON a.id = s.accountId AND s.rn = 1
      LEFT JOIN (
        SELECT 
          accountId,
          limit,
          ROW_NUMBER() OVER (PARTITION BY accountId ORDER BY effective DESC) as rn
        FROM \`mymoney.limitHistory\`
      ) l ON a.id = l.accountId AND l.rn = 1
      LEFT JOIN (
        SELECT 
          accountId,
          aprPct,
          ROW_NUMBER() OVER (PARTITION BY accountId ORDER BY effective DESC) as rn
        FROM \`mymoney.aprHistory\`
      ) apr ON a.id = apr.accountId AND apr.rn = 1
      ORDER BY a.createdAt DESC
    `)

    // Calculate metrics
    let totalBalance = 0
    let totalLimit = 0
    let cardsReporting = 0
    const cardAccounts = accounts.filter((acc: any) => acc.type === 'CARD')
    
    const accountsData = accounts.map((account: any) => {
      const currentLimit = account.currentLimit || account.creditLimit || 0
      const balance = account.statementBalance ? Number(account.statementBalance) : 0
      
      if (account.type === 'CARD') {
        totalBalance += balance
        totalLimit += currentLimit
        if (balance > 0) cardsReporting++
      }

      return {
        id: account.id,
        displayName: account.displayName,
        balance,
        limit: currentLimit,
        utilization: currentLimit > 0 ? (balance / currentLimit) * 100 : 0,
        dueDate: account.statementDueDate,
        closeDate: account.statementCloseDate,
        issuer: account.institutionKind
      }
    })

    const overallUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0

    // Find next due and close dates
    const upcomingDates = accountsData
      .filter((acc: any) => acc.dueDate || acc.closeDate)
      .sort((a: any, b: any) => {
        const aDate = new Date(a.dueDate || a.closeDate!)
        const bDate = new Date(b.dueDate || b.closeDate!)
        return aDate.getTime() - bDate.getTime()
      })

    // Generate alerts
    const alerts = []
    
    // Over-limit alerts
    accountsData.forEach((account: any) => {
      if (account.limit > 0 && account.utilization > 100) {
        alerts.push({
          type: 'overlimit' as const,
          message: `${account.displayName} is over limit`,
          severity: 'high' as const,
          accountId: account.id
        })
      }
    })

    // High utilization alerts
    accountsData.forEach((account: any) => {
      if (account.utilization > 90 && account.utilization <= 100) {
        alerts.push({
          type: 'late_risk' as const,
          message: `${account.displayName} has high utilization (${account.utilization.toFixed(1)}%)`,
          severity: 'medium' as const,
          accountId: account.id
        })
      }
    })

    return NextResponse.json({
      totalBalance,
      totalLimit,
      overallUtilization,
      cardsReporting,
      totalCards: cardAccounts.length,
      nextDueDate: upcomingDates[0]?.dueDate,
      nextCloseDate: upcomingDates[0]?.closeDate,
      accounts: accountsData,
      alerts
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}