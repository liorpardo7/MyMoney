// Custom interfaces for BigQuery compatibility
export interface Account {
  id: string
  institutionId: string
  type: string
  displayName: string
  last4?: string
  currency: string
  openedAt?: Date
  closedAt?: Date
  creditLimit?: number
  originalPrincipal?: number
  termMonths?: number
  secured?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Statement {
  id: string
  accountId: string
  periodStart: Date
  periodEnd: Date
  closeDate: Date
  dueDate?: Date
  newBalance: number
  minPayment: number
  pdfPath?: string
  parsedBy?: string
  createdAt: Date
}

export interface Institution {
  id: string
  name: string
  kind: string
  website?: string
  createdAt: Date
}

export interface AccountWithDetails extends Account {
  institution: Institution
  statements: Statement[]
  currentBalance: number
  currentLimit: number
  currentApr: number
  dueDate?: Date
  closeDate?: Date
  minPayment: number
}

export interface AllocationInput {
  accounts: AccountWithDetails[]
  monthlyBudget: number
  targetMonth: number
  targetYear: number
}

export interface AllocationResult {
  accountId: string
  amount: number
  rationale: string
  dueBy?: Date
  willReport0: boolean
  priority: number
}

export interface AllocationPlan {
  totalBudget: number
  totalAllocated: number
  remaining: number
  allocations: AllocationResult[]
  strategy: string
  objectives: string[]
}

export class AllocationEngine {
  private accounts: AccountWithDetails[]
  private budget: number
  private targetDate: Date

  constructor(input: AllocationInput) {
    this.accounts = input.accounts
    this.budget = input.monthlyBudget
    this.targetDate = new Date(input.targetYear, input.targetMonth - 1, 1)
  }

  generatePlan(): AllocationPlan {
    const allocations: AllocationResult[] = []
    let remainingBudget = this.budget
    const objectives: string[] = []

    // Step 1: Reserve minimum payments
    const totalMinPayments = this.accounts.reduce((sum, acc) => sum + acc.minPayment, 0)
    
    if (totalMinPayments > this.budget) {
      throw new Error(`Budget ${this.budget} is insufficient for minimum payments ${totalMinPayments}`)
    }

    // Add minimum payments
    for (const account of this.accounts) {
      if (account.minPayment > 0) {
        allocations.push({
          accountId: account.id,
          amount: account.minPayment,
          rationale: 'Minimum payment required',
          dueBy: account.dueDate,
          willReport0: false,
          priority: 1
        })
      }
    }

    remainingBudget -= totalMinPayments
    objectives.push(`Reserved $${totalMinPayments} for minimum payments`)

    // Step 2: Fix over-limit accounts
    const overLimitAccounts = this.accounts.filter(acc => 
      acc.type === 'CARD' && acc.currentLimit > 0 && 
      (acc.currentBalance / acc.currentLimit) > 1.0
    )

    for (const account of overLimitAccounts) {
      const excessAmount = account.currentBalance - account.currentLimit
      const paymentNeeded = Math.min(excessAmount + 10, remainingBudget) // +$10 buffer
      
      if (paymentNeeded > 0) {
        allocations.push({
          accountId: account.id,
          amount: paymentNeeded,
          rationale: 'Fix over-limit status',
          dueBy: this.getPayByDate(account.closeDate),
          willReport0: false,
          priority: 2
        })
        remainingBudget -= paymentNeeded
        objectives.push(`Fixed over-limit on ${account.displayName}`)
      }
    }

    // Step 3: AZEO Strategy - Choose reporter card
    const cardAccounts = this.accounts.filter(acc => acc.type === 'CARD' && acc.currentBalance > 0)
    const reporterCard = this.chooseReporterCard(cardAccounts)

    if (reporterCard) {
      objectives.push(`Selected ${reporterCard.displayName} as reporter card`)
    }

    // Step 4: Drive non-reporter cards to $0
    const nonReporterCards = cardAccounts.filter(acc => acc.id !== reporterCard?.id)
    
    for (const account of nonReporterCards.sort((a, b) => b.currentApr - a.currentApr)) {
      const payoffAmount = Math.min(account.currentBalance - account.minPayment, remainingBudget)
      
      if (payoffAmount > 0) {
        allocations.push({
          accountId: account.id,
          amount: payoffAmount,
          rationale: 'AZEO: Drive to $0 balance',
          dueBy: this.getPayByDate(account.closeDate),
          willReport0: payoffAmount >= (account.currentBalance - account.minPayment),
          priority: 3
        })
        remainingBudget -= payoffAmount
        
        if (payoffAmount >= (account.currentBalance - account.minPayment)) {
          objectives.push(`${account.displayName} will report $0`)
        }
      }
    }

    // Step 5: Ensure reporter card has optimal balance ($20-$40)
    if (reporterCard && remainingBudget > 0) {
      const currentBalance = reporterCard.currentBalance
      const targetBalance = 30 // Optimal AZEO balance
      
      if (currentBalance > targetBalance + 50) {
        const paydownAmount = Math.min(currentBalance - targetBalance, remainingBudget)
        allocations.push({
          accountId: reporterCard.id,
          amount: paydownAmount,
          rationale: `AZEO: Optimize reporter balance to ~$${targetBalance}`,
          dueBy: this.getPayByDate(reporterCard.closeDate),
          willReport0: false,
          priority: 4
        })
        remainingBudget -= paydownAmount
        objectives.push(`Optimized reporter card balance`)
      }
    }

    // Step 6: Avalanche remaining budget by APR
    const remainingAccounts = this.accounts
      .filter(acc => acc.currentBalance > 0)
      .sort((a, b) => b.currentApr - a.currentApr)

    for (const account of remainingAccounts) {
      if (remainingBudget <= 0) break
      
      const additionalPayment = Math.min(account.currentBalance, remainingBudget)
      if (additionalPayment > 10) { // Only if meaningful amount
        allocations.push({
          accountId: account.id,
          amount: additionalPayment,
          rationale: `Avalanche: Highest APR (${account.currentApr}%)`,
          dueBy: this.getPayByDate(account.closeDate),
          willReport0: false,
          priority: 5
        })
        remainingBudget -= additionalPayment
        objectives.push(`Applied avalanche method`)
      }
    }

    return {
      totalBudget: this.budget,
      totalAllocated: this.budget - remainingBudget,
      remaining: remainingBudget,
      allocations: this.consolidateAllocations(allocations),
      strategy: 'AZEO + Avalanche',
      objectives
    }
  }

  private chooseReporterCard(cards: AccountWithDetails[]): AccountWithDetails | null {
    if (cards.length === 0) return null
    
    // Prefer mainstream issuers with highest limits
    const mainstreamissuers = ['CHASE', 'CAPITALONE', 'APPLE']
    
    return cards
      .filter(card => card.currentLimit > 0)
      .sort((a, b) => {
        // Prefer mainstream issuers
        const aMainstream = mainstreamissuers.includes(a.institution.kind) ? 1 : 0
        const bMainstream = mainstreamissuers.includes(b.institution.kind) ? 1 : 0
        
        if (aMainstream !== bMainstream) {
          return bMainstream - aMainstream
        }
        
        // Then by highest limit
        return b.currentLimit - a.currentLimit
      })[0]
  }

  private getPayByDate(closeDate?: Date): Date | undefined {
    if (!closeDate) return undefined
    
    // Pay 5 days before close date to ensure posting
    const payByDate = new Date(closeDate)
    payByDate.setDate(payByDate.getDate() - 5)
    
    return payByDate
  }

  private consolidateAllocations(allocations: AllocationResult[]): AllocationResult[] {
    const consolidated = new Map<string, AllocationResult>()
    
    for (const allocation of allocations) {
      const existing = consolidated.get(allocation.accountId)
      
      if (existing) {
        existing.amount += allocation.amount
        existing.rationale += ` + ${allocation.rationale}`
        existing.willReport0 = existing.willReport0 || allocation.willReport0
        existing.priority = Math.min(existing.priority, allocation.priority)
      } else {
        consolidated.set(allocation.accountId, { ...allocation })
      }
    }
    
    return Array.from(consolidated.values()).sort((a, b) => a.priority - b.priority)
  }
}