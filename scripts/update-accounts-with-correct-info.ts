import { bigqueryDB } from '../lib/bigquery'

interface CorrectCardInfo {
  displayName: string
  last4: string
  creditLimit: number
  closingDay: number
  institutionId: string
}

const correctCardInfo: CorrectCardInfo[] = [
  { displayName: 'Mission Lane', last4: '3967', creditLimit: 4400, closingDay: 17, institutionId: 'missionlane' },
  { displayName: 'CreditOne 6922', last4: '6922', creditLimit: 1250, closingDay: 17, institutionId: 'creditone' },
  { displayName: 'CreditOne 3153', last4: '3153', creditLimit: 1700, closingDay: 17, institutionId: 'creditone' },
  { displayName: 'CreditOne 1501', last4: '1501', creditLimit: 1050, closingDay: 17, institutionId: 'creditone' },
  { displayName: 'Capital One 8662', last4: '8662', creditLimit: 1250, closingDay: 20, institutionId: 'capitalone' },
  { displayName: 'Capital One 0010', last4: '0010', creditLimit: 1750, closingDay: 20, institutionId: 'capitalone' },
  { displayName: 'FIB 1057', last4: '1057', creditLimit: 1000, closingDay: 17, institutionId: 'fib' },
  { displayName: 'Apple Card', last4: '', creditLimit: 1000, closingDay: 30, institutionId: 'inst_apple' },
  { displayName: 'Amazon Store 5856', last4: '5856', creditLimit: 450, closingDay: 17, institutionId: 'amazon' },
  { displayName: 'Chase 5725', last4: '5725', creditLimit: 1000, closingDay: 17, institutionId: 'chase' }
]

async function updateAccountsWithCorrectInfo() {
  try {
    console.log('Updating accounts with correct credit limits and closing dates...\n')
    
    for (const cardInfo of correctCardInfo) {
      try {
        console.log(`Processing ${cardInfo.displayName}...`)
        
        // Find the account by last4 and institution
        let accountQuery: string
        let queryParams: any[]
        
        if (cardInfo.last4) {
          accountQuery = `SELECT id, displayName, creditLimit FROM \`mymoney.accounts\` WHERE last4 = ? AND institutionId = ?`
          queryParams = [cardInfo.last4, cardInfo.institutionId]
        } else {
          // For Apple Card which has no last4
          accountQuery = `SELECT id, displayName, creditLimit FROM \`mymoney.accounts\` WHERE displayName = ? AND institutionId = ?`
          queryParams = [cardInfo.displayName, cardInfo.institutionId]
        }
        
        const existingAccounts = await bigqueryDB.query(accountQuery, queryParams)
        
        if (existingAccounts.length === 0) {
          console.log(`  ❌ Account ${cardInfo.displayName} not found in database`)
          continue
        }
        
        const account = existingAccounts[0]
        console.log(`  Found account: ${account.id}`)
        console.log(`  Current credit limit: ${account.creditLimit ? `$${account.creditLimit}` : 'Not set'}`)
        console.log(`  New credit limit: $${cardInfo.creditLimit}`)
        
        // Update the account with correct credit limit
        const updateAccountSql = `UPDATE \`mymoney.accounts\` SET creditLimit = ?, updatedAt = ? WHERE id = ?`
        await bigqueryDB.query(updateAccountSql, [cardInfo.creditLimit, new Date().toISOString(), account.id])
        console.log(`  ✅ Account credit limit updated`)
        
        // Add or update limit history
        const limitHistoryId = `limit_${cardInfo.institutionId}_${cardInfo.last4 || 'apple'}_${Date.now()}`
        const now = new Date().toISOString()
        
        // Check if limit history already exists
        const existingLimitQuery = `SELECT id FROM \`mymoney.limitHistory\` WHERE accountId = ? ORDER BY effective DESC LIMIT 1`
        const existingLimits = await bigqueryDB.query(existingLimitQuery, [account.id])
        
        if (existingLimits.length === 0 || existingLimits[0].limit !== cardInfo.creditLimit) {
          // Add new limit history entry
          const limitSql = `INSERT INTO \`mymoney.limitHistory\` (id, accountId, \`limit\`, effective) VALUES (?, ?, ?, ?)`
          await bigqueryDB.query(limitSql, [limitHistoryId, account.id, cardInfo.creditLimit, now])
          console.log(`  ✅ Limit history created`)
        } else {
          console.log(`  ℹ️  Limit history already up to date`)
        }
        
        console.log(`  ${cardInfo.displayName} updated successfully!`)
        console.log(`  Closing day: ${cardInfo.closingDay}${getOrdinalSuffix(cardInfo.closingDay)}`)
        console.log('')
        
      } catch (error) {
        console.error(`  Error updating ${cardInfo.displayName}:`, error)
      }
    }
    
    console.log('All accounts updated with correct information!')
    
  } catch (error) {
    console.error('Error updating accounts:', error)
  }
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

async function main() {
  try {
    console.log('Starting to update accounts with correct information...')
    await updateAccountsWithCorrectInfo()
    console.log('Account updates completed!')
  } catch (error) {
    console.error('Account updates failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
