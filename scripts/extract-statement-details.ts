import { readFileSync } from 'fs'
import { readdirSync } from 'fs'
import { join } from 'path'
import pdf from 'pdf-parse'
import { bigqueryDB } from '../lib/bigquery'

interface StatementDetails {
  filename: string
  accountNumber: string
  last4: string
  institution: string
  statementPeriod?: string
  newBalance?: number
  previousBalance?: number
  paymentDue?: number
  paymentDueDate?: string
  creditLimit?: number
  availableCredit?: number
  transactions: TransactionInfo[]
  rawText?: string
}

interface TransactionInfo {
  date: string
  description: string
  amount: number
  type: 'PURCHASE' | 'PAYMENT' | 'FEE' | 'INTEREST' | 'CREDIT' | 'UNKNOWN'
}

async function extractStatementDetails(filepath: string): Promise<StatementDetails> {
  try {
    console.log(`\n📄 Extracting details from: ${filepath}`)
    
    const dataBuffer = readFileSync(filepath)
    const data = await pdf(dataBuffer)
    const text = data.text
    
    const details: StatementDetails = {
      filename: filepath.split('/').pop() || '',
      accountNumber: '',
      last4: '',
      institution: '',
      transactions: [],
      rawText: text
    }
    
    // Extract account number and last 4 digits
    const accountPatterns = [
      /Account Number[:\s]*(\d{4}[\s-]*\d{4}[\s-]*\d{4}[\s-]*\d{4})/i,
      /Account[:\s]*(\d{4}[\s-]*\d{4}[\s-]*\d{4}[\s-]*\d{4})/i,
      /(\d{4}[\s-]*\d{4}[\s-]*\d{4}[\s-]*\d{4})/,
      /Card ending in (\d{4})/i,
      /ending (\d{4})/i
    ]
    
    for (const pattern of accountPatterns) {
      const match = text.match(pattern)
      if (match) {
        details.accountNumber = match[1].replace(/\s+/g, '')
        details.last4 = details.accountNumber.slice(-4)
        break
      }
    }
    
    // Extract institution
    const institutionPatterns = [
      /(CREDIT ONE BANK|CHASE|MISSION LANE|APPLE CARD|CAPITAL ONE|AMERICAN EXPRESS|FIRST INTERSTATE BANK|AMAZON)/i,
      /(Bank|Card|Credit|Financial)/i
    ]
    
    for (const pattern of institutionPatterns) {
      const match = text.match(pattern)
      if (match) {
        details.institution = match[0]
        break
      }
    }
    
    // Extract statement period
    const periodPatterns = [
      /(?:Statement Period|Billing Period|Period)[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}\s+(?:to|through|-)\s+[A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
      /([A-Za-z]+\s+\d{1,2},?\s+\d{4}\s+(?:to|through|-)\s+[A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
      /(Jul \d{1,2}, \d{4} - Aug \d{1,2}, \d{4})/i
    ]
    
    for (const pattern of periodPatterns) {
      const match = text.match(pattern)
      if (match) {
        details.statementPeriod = match[1]
        break
      }
    }
    
    // Extract balance information
    const balancePatterns = [
      /(?:New Balance|Current Balance|Statement Balance)[:\s]*\$?([\d,]+\.?\d*)/i,
      /Balance[:\s]*\$?([\d,]+\.?\d*)/i
    ]
    
    for (const pattern of balancePatterns) {
      const match = text.match(pattern)
      if (match) {
        details.newBalance = parseFloat(match[1].replace(/,/g, ''))
        break
      }
    }
    
    // Extract credit limit
    const limitPatterns = [
      /(?:Credit Limit|Available Credit|Credit Line)[:\s]*\$?([\d,]+\.?\d*)/i,
      /Limit[:\s]*\$?([\d,]+\.?\d*)/i
    ]
    
    for (const pattern of limitPatterns) {
      const match = text.match(pattern)
      if (match) {
        details.creditLimit = parseFloat(match[1].replace(/,/g, ''))
        break
      }
    }
    
    // Extract available credit
    const availablePatterns = [
      /(?:Available Credit|Available Amount)[:\s]*\$?([\d,]+\.?\d*)/i
    ]
    
    for (const pattern of availablePatterns) {
      const match = text.match(pattern)
      if (match) {
        details.availableCredit = parseFloat(match[1].replace(/,/g, ''))
        break
      }
    }
    
    // Extract payment due information
    const paymentPatterns = [
      /(?:Payment Due|Minimum Payment)[:\s]*\$?([\d,]+\.?\d*)/i,
      /Due[:\s]*\$?([\d,]+\.?\d*)/i
    ]
    
    for (const pattern of paymentPatterns) {
      const match = text.match(pattern)
      if (match) {
        details.paymentDue = parseFloat(match[1].replace(/,/g, ''))
        break
      }
    }
    
    // Extract payment due date
    const dueDatePatterns = [
      /(?:Payment Due Date|Due Date)[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
      /Due[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
    ]
    
    for (const pattern of dueDatePatterns) {
      const match = text.match(pattern)
      if (match) {
        details.paymentDueDate = match[1]
        break
      }
    }
    
    // Extract transaction information
    const lines = text.split('\n')
    const transactionLines = lines.filter(line => 
      line.includes('$') && 
      (line.includes('PURCHASE') || line.includes('PAYMENT') || line.includes('FEE') || 
       line.includes('INTEREST') || line.includes('CREDIT') || line.includes('DEBIT') ||
       /\d{2}\/\d{2}\/\d{4}/.test(line) || /\d{2}\/\d{2}/.test(line))
    )
    
    // Parse transactions (simplified for now)
    for (const line of transactionLines.slice(0, 10)) { // Limit to first 10 for analysis
      const transaction = parseTransactionLine(line)
      if (transaction) {
        details.transactions.push(transaction)
      }
    }
    
    console.log(`  Account: ${details.accountNumber || 'Not found'}`)
    console.log(`  Last4: ${details.last4 || 'Not found'}`)
    console.log(`  Institution: ${details.institution || 'Not found'}`)
    console.log(`  Period: ${details.statementPeriod || 'Not found'}`)
    console.log(`  New Balance: ${details.newBalance ? `$${details.newBalance}` : 'Not found'}`)
    console.log(`  Credit Limit: ${details.creditLimit ? `$${details.creditLimit}` : 'Not found'}`)
    console.log(`  Available Credit: ${details.availableCredit ? `$${details.availableCredit}` : 'Not found'}`)
    console.log(`  Payment Due: ${details.paymentDue ? `$${details.paymentDue}` : 'Not found'}`)
    console.log(`  Due Date: ${details.paymentDueDate || 'Not found'}`)
    console.log(`  Transactions found: ${details.transactions.length}`)
    
    return details
    
  } catch (error) {
    console.error(`  Error extracting from ${filepath}:`, error)
    return {
      filename: filepath.split('/').pop() || '',
      accountNumber: 'ERROR',
      last4: 'ERROR',
      institution: 'ERROR',
      transactions: []
    }
  }
}

function parseTransactionLine(line: string): TransactionInfo | null {
  try {
    // Look for date patterns
    const datePatterns = [
      /(\d{2}\/\d{2}\/\d{4})/,
      /(\d{2}\/\d{2})/,
      /([A-Za-z]+\s+\d{1,2},?\s+\d{4})/
    ]
    
    let date = ''
    for (const pattern of datePatterns) {
      const match = line.match(pattern)
      if (match) {
        date = match[1]
        break
      }
    }
    
    // Look for amount patterns
    const amountPattern = /\$?([\d,]+\.?\d*)/
    const amountMatch = line.match(amountPattern)
    if (!amountMatch) return null
    
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''))
    
    // Determine transaction type
    let type: TransactionInfo['type'] = 'UNKNOWN'
    if (line.includes('PURCHASE') || line.includes('DEBIT')) type = 'PURCHASE'
    else if (line.includes('PAYMENT') || line.includes('CREDIT')) type = 'PAYMENT'
    else if (line.includes('FEE')) type = 'FEE'
    else if (line.includes('INTEREST')) type = 'INTEREST'
    
    // Extract description (everything between date and amount)
    const description = line.replace(date, '').replace(amountMatch[0], '').trim()
    
    return {
      date,
      description: description || 'Unknown',
      amount,
      type
    }
  } catch (error) {
    return null
  }
}

async function extractAllStatementDetails() {
  try {
    console.log('🔍 Extracting detailed information from all statements...\n')
    
    const statementsDir = 'steatments'
    const files = readdirSync(statementsDir).filter(file => file.endsWith('.pdf'))
    
    console.log(`Found ${files.length} PDF statement files\n`)
    
    const results: StatementDetails[] = []
    
    for (const file of files) {
      const filepath = join(statementsDir, file)
      const details = await extractStatementDetails(filepath)
      results.push(details)
    }
    
    console.log('\n📊 === COMPREHENSIVE SUMMARY ===')
    console.log(`Total statements analyzed: ${results.length}`)
    
    const withAccountInfo = results.filter(r => r.accountNumber && r.accountNumber !== 'ERROR')
    const withoutAccountInfo = results.filter(r => !r.accountNumber || r.accountNumber === 'ERROR')
    
    console.log(`\n✅ Statements with account info: ${withAccountInfo.length}`)
    console.log(`❌ Statements without account info: ${withoutAccountInfo.length}`)
    
    console.log('\n=== DETAILED ACCOUNT INFORMATION ===')
    withAccountInfo.forEach((details, index) => {
      console.log(`\n${index + 1}. ${details.filename}`)
      console.log(`   Account: ${details.accountNumber}`)
      console.log(`   Last4: ${details.last4}`)
      console.log(`   Institution: ${details.institution}`)
      console.log(`   Period: ${details.statementPeriod || 'Unknown'}`)
      console.log(`   Balance: ${details.newBalance ? `$${details.newBalance}` : 'Unknown'}`)
      console.log(`   Credit Limit: ${details.creditLimit ? `$${details.creditLimit}` : 'Unknown'}`)
      console.log(`   Available Credit: ${details.availableCredit ? `$${details.availableCredit}` : 'Unknown'}`)
      console.log(`   Payment Due: ${details.paymentDue ? `$${details.paymentDue}` : 'Unknown'}`)
      console.log(`   Due Date: ${details.paymentDueDate || 'Unknown'}`)
      console.log(`   Transactions: ${details.transactions.length} found`)
    })
    
    if (withoutAccountInfo.length > 0) {
      console.log('\n=== STATEMENTS NEEDING MANUAL REVIEW ===')
      withoutAccountInfo.forEach((details, index) => {
        console.log(`${index + 1}. ${details.filename}`)
        console.log(`   Institution: ${details.institution || 'Unknown'}`)
        console.log(`   Period: ${details.statementPeriod || 'Unknown'}`)
      })
    }
    
    return results
    
  } catch (error) {
    console.error('Error extracting statement details:', error)
    return []
  }
}

if (require.main === module) {
  extractAllStatementDetails()
}
