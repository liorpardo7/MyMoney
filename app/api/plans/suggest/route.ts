import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'
import { AllocationEngine, AccountWithDetails } from '@/lib/allocation-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const budget = parseFloat(searchParams.get('budget') || '0')
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')

    if (!budget || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required parameters: budget, month, year' },
        { status: 400 }
      )
    }

    // First check if there are any accounts
    const accountCount = await bigqueryDB.query('SELECT COUNT(*) as count FROM `mymoney.accounts`')
    const hasAccounts = accountCount[0]?.count > 0
    
    if (!hasAccounts) {
      return NextResponse.json({
        totalBudget: budget,
        totalAllocated: 0,
        remaining: budget,
        allocations: [],
        strategy: 'No accounts available',
        objectives: ['Import statements or add accounts to generate a plan']
      })
    }

    // Fetch accounts with their latest data using BigQuery
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

    // Transform accounts to the format expected by AllocationEngine
    const accountsWithDetails: AccountWithDetails[] = accounts.map((account: any) => {
      const currentLimit = account.currentLimit || account.creditLimit || 0
      const currentBalance = account.statementBalance ? Number(account.statementBalance) : 0
      const currentApr = account.currentApr ? Number(account.currentApr) : 0
      const minPayment = account.statementMinPayment ? Number(account.statementMinPayment) : 0

      return {
        ...account,
        institution: {
          id: account.institutionId,
          name: account.institutionName,
          kind: account.institutionKind,
          createdAt: new Date(account.createdAt)
        },
        statements: [{
          id: 'temp',
          accountId: account.id,
          periodStart: new Date(account.statementCloseDate || account.createdAt),
          periodEnd: new Date(account.statementCloseDate || account.createdAt),
          closeDate: new Date(account.statementCloseDate || account.createdAt),
          dueDate: account.statementDueDate ? new Date(account.statementDueDate) : undefined,
          newBalance: currentBalance,
          minPayment,
          createdAt: new Date(account.createdAt)
        }],
        currentBalance,
        currentLimit,
        currentApr,
        dueDate: account.statementDueDate ? new Date(account.statementDueDate) : undefined,
        closeDate: account.statementCloseDate ? new Date(account.statementCloseDate) : undefined,
        minPayment
      }
    })

    // Generate allocation plan
    const engine = new AllocationEngine({
      accounts: accountsWithDetails,
      monthlyBudget: budget,
      targetMonth: month,
      targetYear: year
    })

    const plan = engine.generatePlan()

    // Transform allocations to include account names
    const allocationsWithNames = plan.allocations.map(allocation => {
      const account = accountsWithDetails.find(acc => acc.id === allocation.accountId)
      return {
        ...allocation,
        accountName: account?.displayName || 'Unknown Account',
        dueBy: allocation.dueBy?.toISOString()
      }
    })

    return NextResponse.json({
      ...plan,
      allocations: allocationsWithNames
    })
  } catch (error) {
    console.error('Plans API error:', error)
    return NextResponse.json(
      { error: `Failed to generate plan: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}