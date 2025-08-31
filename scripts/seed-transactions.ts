import { bigqueryDB } from '../lib/bigquery'

interface Transaction {
  id: string
  accountId: string
  postedAt: string
  description: string
  amount: number
  category: string
  source: string
  metadata?: string
}

const SAMPLE_TRANSACTIONS: Transaction[] = [
  // Apple Card transactions
  {
    id: 'txn_apple_1',
    accountId: 'acc_apple_card',
    postedAt: '2025-07-15T10:30:00Z',
    description: 'Apple Store Purchase',
    amount: -1299.00,
    category: 'Electronics',
    source: 'Apple Card',
    metadata: 'iPhone 15 Pro'
  },
  {
    id: 'txn_apple_2',
    accountId: 'acc_apple_card',
    postedAt: '2025-07-18T14:20:00Z',
    description: 'Uber Ride',
    amount: -25.50,
    category: 'Transportation',
    source: 'Apple Card',
    metadata: 'Airport to Downtown'
  },
  {
    id: 'txn_apple_3',
    accountId: 'acc_apple_card',
    postedAt: '2025-07-20T19:15:00Z',
    description: 'Starbucks',
    amount: -6.75,
    category: 'Food & Dining',
    source: 'Apple Card',
    metadata: 'Venti Latte'
  },
  {
    id: 'txn_apple_4',
    accountId: 'acc_apple_card',
    postedAt: '2025-07-22T12:00:00Z',
    description: 'Amazon.com',
    amount: -89.99,
    category: 'Shopping',
    source: 'Apple Card',
    metadata: 'Wireless Headphones'
  },
  {
    id: 'txn_apple_5',
    accountId: 'acc_apple_card',
    postedAt: '2025-07-25T16:45:00Z',
    description: 'Payment Received',
    amount: 877.16,
    category: 'Payment',
    source: 'Apple Card',
    metadata: 'Statement Payment'
  },

  // Checking account transactions
  {
    id: 'txn_checking_1',
    accountId: 'acc_checking_001',
    postedAt: '2025-08-01T09:00:00Z',
    description: 'Salary Deposit',
    amount: 5000.00,
    category: 'Income',
    source: 'Employer',
    metadata: 'Monthly Salary'
  },
  {
    id: 'txn_checking_2',
    accountId: 'acc_checking_001',
    postedAt: '2025-08-03T14:30:00Z',
    description: 'Rent Payment',
    amount: -1800.00,
    category: 'Housing',
    source: 'Landlord',
    metadata: 'August Rent'
  },
  {
    id: 'txn_checking_3',
    accountId: 'acc_checking_001',
    postedAt: '2025-08-05T11:15:00Z',
    description: 'Grocery Store',
    amount: -156.78,
    category: 'Food & Dining',
    source: 'Local Market',
    metadata: 'Weekly Groceries'
  },
  {
    id: 'txn_checking_4',
    accountId: 'acc_checking_001',
    postedAt: '2025-08-07T16:20:00Z',
    description: 'Gas Station',
    amount: -45.67,
    category: 'Transportation',
    source: 'Shell',
    metadata: 'Fuel'
  },
  {
    id: 'txn_checking_5',
    accountId: 'acc_checking_001',
    postedAt: '2025-08-10T13:45:00Z',
    description: 'Utility Bill',
    amount: -89.99,
    category: 'Utilities',
    source: 'Electric Company',
    metadata: 'Electricity Bill'
  },

  // Credit card transactions
  {
    id: 'txn_credit_1',
    accountId: 'acc_credit_001',
    postedAt: '2025-08-01T10:00:00Z',
    description: 'Restaurant',
    amount: -67.89,
    category: 'Food & Dining',
    source: 'Credit Card',
    metadata: 'Dinner with Friends'
  },
  {
    id: 'txn_credit_2',
    accountId: 'acc_credit_001',
    postedAt: '2025-08-03T15:30:00Z',
    description: 'Online Shopping',
    amount: -234.56,
    category: 'Shopping',
    source: 'Credit Card',
    metadata: 'Clothing Store'
  },
  {
    id: 'txn_credit_3',
    accountId: 'acc_credit_001',
    postedAt: '2025-08-05T12:15:00Z',
    description: 'Movie Theater',
    amount: -32.50,
    category: 'Entertainment',
    source: 'Credit Card',
    metadata: 'Movie Tickets'
  },
  {
    id: 'txn_credit_4',
    accountId: 'acc_credit_001',
    postedAt: '2025-08-07T18:45:00Z',
    description: 'Coffee Shop',
    amount: -12.75,
    category: 'Food & Dining',
    source: 'Credit Card',
    metadata: 'Coffee & Pastry'
  },
  {
    id: 'txn_credit_5',
    accountId: 'acc_credit_001',
    postedAt: '2025-08-10T14:20:00Z',
    description: 'Payment Received',
    amount: 1003.39,
    category: 'Payment',
    source: 'Credit Card',
    metadata: 'Statement Payment'
  }
]

async function seedTransactions() {
  try {
    console.log('Seeding transactions...')
    
    // Initialize BigQuery connection
    await bigqueryDB.initialize()
    
    let successCount = 0
    let errorCount = 0
    
    for (const transaction of SAMPLE_TRANSACTIONS) {
      try {
        await bigqueryDB.create('transactions', transaction)
        successCount++
        console.log(`✓ Created transaction: ${transaction.description} - $${transaction.amount}`)
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`- Transaction ${transaction.description} already exists`)
        } else {
          errorCount++
          console.error(`✗ Error creating transaction ${transaction.description}:`, error.message)
        }
      }
    }
    
    console.log(`\nTransaction seeding complete:`)
    console.log(`- Successfully created: ${successCount}`)
    console.log(`- Errors: ${errorCount}`)
    
  } catch (error) {
    console.error('Error in transaction seeding:', error)
  }
}

if (require.main === module) {
  seedTransactions()
}

export { seedTransactions, SAMPLE_TRANSACTIONS }
