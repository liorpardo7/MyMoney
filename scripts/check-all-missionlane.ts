import { bigqueryDB } from '../lib/bigquery'

async function checkAllMissionLane() {
  try {
    console.log('Checking all Mission Lane accounts...')
    
    // Get all Mission Lane accounts
    const accountQuery = `SELECT * FROM \`mymoney.accounts\` WHERE displayName = 'Mission Lane' ORDER BY createdAt DESC`
    const accounts = await bigqueryDB.query(accountQuery)
    
    console.log(`Found ${accounts.length} Mission Lane accounts:`)
    
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i]
      console.log(`\nAccount ${i + 1}:`)
      console.log(`  ID: ${account.id}`)
      console.log(`  Created: ${account.createdAt}`)
      
      // Check transactions for this account
      const transactionCountQuery = `SELECT COUNT(*) as count FROM \`mymoney.transactions\` WHERE accountId = ?`
      const transactionCount = await bigqueryDB.query(transactionCountQuery, [account.id])
      console.log(`  Transactions: ${transactionCount[0].count}`)
      
      // Check limit history for this account
      const limitCountQuery = `SELECT COUNT(*) as count FROM \`mymoney.limitHistory\` WHERE accountId = ?`
      const limitCount = await bigqueryDB.query(limitCountQuery, [account.id])
      console.log(`  Limit History: ${limitCount[0].count}`)
      
      if (transactionCount[0].count > 0) {
        console.log(`  *** This account has transactions! ***`)
        
        // Show a few sample transactions
        const sampleTransactionsQuery = `SELECT description, amount, postedAt FROM \`mymoney.transactions\` WHERE accountId = ? ORDER BY postedAt DESC LIMIT 3`
        const sampleTransactions = await bigqueryDB.query(sampleTransactionsQuery, [account.id])
        console.log(`  Sample transactions:`)
        sampleTransactions.forEach(txn => {
          console.log(`    - ${txn.description}: $${txn.amount} (${txn.postedAt})`)
        })
      }
    }
    
    // Check total transactions across all Mission Lane accounts
    const totalTransactionsQuery = `
      SELECT COUNT(*) as count 
      FROM \`mymoney.transactions\` t
      JOIN \`mymoney.accounts\` a ON t.accountId = a.id
      WHERE a.displayName = 'Mission Lane'
    `
    const totalTransactions = await bigqueryDB.query(totalTransactionsQuery)
    console.log(`\nTotal transactions across all Mission Lane accounts: ${totalTransactions[0].count}`)
    
  } catch (error) {
    console.error('Check failed:', error)
  }
}

if (require.main === module) {
  checkAllMissionLane()
}
