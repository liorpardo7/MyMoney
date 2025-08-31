import { bigqueryDB } from '../lib/bigquery'

async function verifyMissionLaneData() {
  try {
    console.log('Verifying Mission Lane data...')
    
    // Check if the account exists
    const accountQuery = `SELECT * FROM \`mymoney.accounts\` WHERE displayName = 'Mission Lane'`
    const accounts = await bigqueryDB.query(accountQuery)
    console.log('Mission Lane accounts found:', accounts.length)
    
    if (accounts.length > 0) {
      console.log('Account details:', accounts[0])
      
      // Check transactions for this account
      const transactionQuery = `SELECT COUNT(*) as count FROM \`mymoney.transactions\` WHERE accountId = ?`
      const transactionCount = await bigqueryDB.query(transactionQuery, [accounts[0].id])
      console.log('Transaction count:', transactionCount[0].count)
      
      // Check limit history
      const limitQuery = `SELECT * FROM \`mymoney.limitHistory\` WHERE accountId = ?`
      const limits = await bigqueryDB.query(limitQuery, [accounts[0].id])
      console.log('Limit history entries:', limits.length)
      if (limits.length > 0) {
        console.log('Latest limit:', limits[0])
      }
      
      // Check institution
      const institutionQuery = `SELECT * FROM \`mymoney.institutions\` WHERE id = 'missionlane'`
      const institutions = await bigqueryDB.query(institutionQuery)
      console.log('Institution found:', institutions.length > 0)
      if (institutions.length > 0) {
        console.log('Institution details:', institutions[0])
      }
    } else {
      console.log('No Mission Lane account found!')
    }
    
    // Check all accounts to see what's there
    const allAccountsQuery = `SELECT id, displayName, type, last4, creditLimit FROM \`mymoney.accounts\` ORDER BY createdAt DESC LIMIT 10`
    const allAccounts = await bigqueryDB.query(allAccountsQuery)
    console.log('\nRecent accounts:')
    allAccounts.forEach(acc => {
      console.log(`- ${acc.displayName} (${acc.type}) - Last4: ${acc.last4} - Limit: ${acc.creditLimit}`)
    })
    
  } catch (error) {
    console.error('Verification failed:', error)
  }
}

if (require.main === module) {
  verifyMissionLaneData()
}
