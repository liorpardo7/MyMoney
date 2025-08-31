import { chromium, Browser, Page, BrowserContext } from 'playwright'
import { BigQueryDB } from '../lib/bigquery'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import { INSTITUTION_SCRAPERS, CUSTOM_LOGIN_METHODS } from './institution-specific-scrapers'
import { getInstitutionConfig } from './institution-config'

// Types for financial data
interface AccountBalance {
  institutionName: string
  accountName: string
  accountType: 'checking' | 'savings' | 'credit' | 'loan'
  currentBalance: number
  availableBalance?: number
  creditLimit?: number
  availableCredit?: number
  last4?: string
  paymentDueDate?: string
  minimumPayment?: number
  lastStatementBalance?: number
  extractedAt: Date
}

interface InstitutionConfig {
  name: string
  scriptName: string
  loginUrl: string
  username: string
  password: string
  selectors: {
    usernameField: string
    passwordField: string
    loginButton: string
    balanceSelectors: string[]
    accountNameSelectors: string[]
  }
  waitForSelectors?: string[]
  customExtractionLogic?: (page: Page) => Promise<AccountBalance[]>
}

// Get institution configuration
const INSTITUTIONS = getInstitutionConfig()

class FinancialDataScraper {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private db: BigQueryDB
  private results: AccountBalance[] = []
  private errors: string[] = []

  constructor() {
    this.db = new BigQueryDB()
  }

  async initialize() {
    console.log('🚀 Initializing Financial Data Scraper...')
    
    // Initialize database
    await this.db.initialize()
    
    // Launch Chrome with enhanced anti-detection configuration
    this.browser = await chromium.launch({
      headless: false,
      channel: 'chrome', // Use your installed Chrome instead of bundled Chromium
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=ScriptStreaming',
        '--disable-ipc-flooding-protection',
        '--disable-features=site-per-process',
        '--disable-site-isolation-trials',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"'
      ]
    })

    // Create context with realistic settings
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York'
    })

    console.log('✅ Browser initialized successfully')
  }

  async scrapeAllInstitutions() {
    if (!this.browser || !this.context) {
      throw new Error('Browser not initialized')
    }

    console.log(`📊 Starting to scrape ${INSTITUTIONS.length} financial institutions...`)

    for (const institution of INSTITUTIONS) {
      try {
        console.log(`\n🏦 Processing ${institution.name}...`)
        await this.scrapeInstitution(institution)
      } catch (error) {
        const errorMsg = `Error scraping ${institution.name}: ${error}`
        console.error(`❌ ${errorMsg}`)
        this.errors.push(errorMsg)
      }
    }

    console.log(`\n📈 Scraping completed. ${this.results.length} accounts processed, ${this.errors.length} errors.`)
  }

  private async scrapeInstitution(institution: InstitutionConfig): Promise<void> {
    const page = await this.context!.newPage()
    
    try {
      // Add anti-detection measures to the page
      await page.addInitScript(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Override plugins to look more human
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Override languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        
        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });
      
      // Navigate to login page
      console.log(`  🔗 Navigating to ${institution.loginUrl}`)
      await page.goto(institution.loginUrl, { waitUntil: 'networkidle' })
      
      // Wait for page to load
      await page.waitForTimeout(2000)
      
      // Fill login form
      console.log(`  🔐 Logging in as ${institution.username}`)
      
      // Check if this institution has a custom login method
      const customLoginMethod = CUSTOM_LOGIN_METHODS[institution.name as keyof typeof CUSTOM_LOGIN_METHODS]
      if (customLoginMethod) {
        console.log(`    🔧 Using custom login method for ${institution.name}`)
        await customLoginMethod(page, institution.username, institution.password)
      } else {
        await this.performLogin(page, institution)
      }
      
      // Wait for dashboard to load
      if (institution.waitForSelectors) {
        for (const selector of institution.waitForSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 10000 })
          } catch (error) {
            console.log(`    ⚠️  Selector ${selector} not found, continuing...`)
          }
        }
      }
      
      // Extract account data
      console.log(`  📊 Extracting account data...`)
      let accountBalances: AccountBalance[]
      
      // Use specialized scraper if available
      const specializedScraper = INSTITUTION_SCRAPERS[institution.name as keyof typeof INSTITUTION_SCRAPERS]
      if (specializedScraper) {
        console.log(`    🔧 Using specialized scraper for ${institution.name}`)
        accountBalances = await specializedScraper.extractAccountData(page)
      } else if (institution.customExtractionLogic) {
        accountBalances = await institution.customExtractionLogic(page)
      } else {
        accountBalances = await this.extractAccountData(page, institution)
      }
      
      // Add institution name and timestamp
      accountBalances = accountBalances.map(balance => ({
        ...balance,
        institutionName: institution.name,
        extractedAt: new Date()
      }))
      
      this.results.push(...accountBalances)
      console.log(`    ✅ Extracted ${accountBalances.length} accounts`)
      
      // Take screenshot for verification
      const screenshotPath = `screenshots/${institution.scriptName}_${Date.now()}.png`
      await page.screenshot({ path: screenshotPath, fullPage: true })
      console.log(`    📸 Screenshot saved to ${screenshotPath}`)
      
    } catch (error) {
      throw new Error(`Failed to scrape ${institution.name}: ${error}`)
    } finally {
      await page.close()
    }
  }

  private async performLogin(page: Page, institution: InstitutionConfig): Promise<void> {
    try {
      // Wait for username field
      await page.waitForSelector(institution.selectors.usernameField, { timeout: 10000 })
      
      // Fill username
      await page.fill(institution.selectors.usernameField, institution.username)
      await page.waitForTimeout(1000)
      
      // Fill password
      await page.fill(institution.selectors.passwordField, institution.password)
      await page.waitForTimeout(1000)
      
      // Click login button
      await page.click(institution.selectors.loginButton)
      
      // Wait for navigation
      await page.waitForTimeout(3000)
      
      // Check if login was successful (look for dashboard elements or error messages)
      const errorSelectors = [
        '.error',
        '.alert',
        '[data-testid*="error"]',
        '.login-error'
      ]
      
      for (const errorSelector of errorSelectors) {
        const errorElement = await page.$(errorSelector)
        if (errorElement) {
          const errorText = await errorElement.textContent()
          if (errorText && errorText.toLowerCase().includes('invalid')) {
            throw new Error(`Login failed: ${errorText}`)
          }
        }
      }
      
    } catch (error) {
      throw new Error(`Login failed: ${error}`)
    }
  }

  private async extractAccountData(page: Page, institution: InstitutionConfig): Promise<AccountBalance[]> {
    const accountBalances: AccountBalance[] = []
    
    try {
      // Try to find account containers
      const accountSelectors = [
        '.account-tile',
        '.account-card',
        '[data-testid*="account"]',
        '.dbk-accts-account',
        '.tiles-layout__tile'
      ]
      
      let accountElements: any[] = []
      for (const selector of accountSelectors) {
        accountElements = await page.$$(selector)
        if (accountElements.length > 0) break
      }
      
      if (accountElements.length === 0) {
        console.log('    ⚠️  No account elements found, trying alternative extraction...')
        return await this.extractAccountDataAlternative(page, institution)
      }
      
      console.log(`    📋 Found ${accountElements.length} account elements`)
      
      for (let i = 0; i < accountElements.length; i++) {
        try {
          const accountElement = accountElements[i]
          const accountData = await this.extractSingleAccount(accountElement, institution)
          if (accountData) {
            accountBalances.push(accountData)
          }
        } catch (error) {
          console.log(`      ⚠️  Error extracting account ${i + 1}: ${error}`)
        }
      }
      
    } catch (error) {
      console.log(`    ⚠️  Error in main extraction: ${error}`)
      // Fallback to alternative extraction
      return await this.extractAccountDataAlternative(page, institution)
    }
    
    return accountBalances
  }

  private async extractSingleAccount(accountElement: any, institution: InstitutionConfig): Promise<AccountBalance | null> {
    try {
      // Extract account name
      let accountName = 'Unknown Account'
      for (const selector of institution.selectors.accountNameSelectors) {
        try {
          const nameElement = await accountElement.$(selector)
          if (nameElement) {
            const nameText = await nameElement.textContent()
            if (nameText && nameText.trim()) {
              accountName = nameText.trim()
              break
            }
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      // Extract balance information
      let currentBalance = 0
      let availableBalance = 0
      let creditLimit = 0
      let availableCredit = 0
      let last4 = ''
      
      // Try to extract balance from various selectors
      for (const selector of institution.selectors.balanceSelectors) {
        try {
          const balanceElements = await accountElement.$$(selector)
          for (const element of balanceElements) {
            const text = await element.textContent()
            if (text) {
              const amount = this.parseAmount(text)
              if (amount !== null) {
                // Determine what type of balance this is based on context
                if (text.toLowerCase().includes('available') || text.toLowerCase().includes('credit')) {
                  availableCredit = amount
                } else if (text.toLowerCase().includes('limit')) {
                  creditLimit = amount
                } else {
                  currentBalance = amount
                }
                break
              }
            }
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      // Determine account type based on context
      let accountType: 'checking' | 'savings' | 'credit' | 'loan' = 'checking'
      if (accountName.toLowerCase().includes('credit') || accountName.toLowerCase().includes('card')) {
        accountType = 'credit'
      } else if (accountName.toLowerCase().includes('savings')) {
        accountType = 'savings'
      } else if (accountName.toLowerCase().includes('loan')) {
        accountType = 'loan'
      }
      
      // Extract last 4 digits if available
      const last4Match = accountName.match(/\*(\d{4})/)
      if (last4Match) {
        last4 = last4Match[1]
      }
      
      return {
        institutionName: institution.name,
        accountName,
        accountType,
        currentBalance,
        availableBalance,
        creditLimit,
        availableCredit,
        last4,
        extractedAt: new Date()
      }
      
    } catch (error) {
      console.log(`      ⚠️  Error extracting single account: ${error}`)
      return null
    }
  }

  private async extractAccountDataAlternative(page: Page, institution: InstitutionConfig): Promise<AccountBalance[]> {
    // Alternative extraction method - look for balance patterns in the entire page
    const accountBalances: AccountBalance[] = []
    
    try {
      // Look for common balance patterns
      const balancePatterns = [
        /\$[\d,]+\.?\d*/g,
        /[\d,]+\.?\d*\s*(?:dollars?|USD)/gi
      ]
      
      const pageText = await page.textContent('body')
      if (pageText) {
        for (const pattern of balancePatterns) {
          const matches = pageText.match(pattern)
          if (matches) {
            for (const match of matches) {
              const amount = this.parseAmount(match)
              if (amount !== null && amount > 0) {
                accountBalances.push({
                  institutionName: institution.name,
                  accountName: `Account ${accountBalances.length + 1}`,
                  accountType: 'checking',
                  currentBalance: amount,
                  extractedAt: new Date()
                })
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.log(`    ⚠️  Alternative extraction failed: ${error}`)
    }
    
    return accountBalances
  }

  private parseAmount(text: string): number | null {
    try {
      // Remove currency symbols and commas, extract numeric value
      const cleanText = text.replace(/[$,]/g, '').trim()
      const match = cleanText.match(/[\d,]+\.?\d*/)
      if (match) {
        const amount = parseFloat(match[0].replace(/,/g, ''))
        return isNaN(amount) ? null : amount
      }
      return null
    } catch (error) {
      return null
    }
  }

  async saveToDatabase() {
    if (this.results.length === 0) {
      console.log('⚠️  No results to save to database')
      return
    }

    console.log(`💾 Saving ${this.results.length} account records to database...`)
    
    try {
      // Create a temporary table for the new data
      const tempTableName = `temp_accounts_${Date.now()}`
      
      // Insert the scraped data
      await this.db.insert(tempTableName, this.results)
      
      // Update existing accounts or insert new ones
      for (const balance of this.results) {
        // Check if account exists
        const existingAccount = await this.db.query(`
          SELECT id FROM accounts 
          WHERE institutionId = (SELECT id FROM institutions WHERE name = ?)
          AND displayName = ?
        `, [balance.institutionName, balance.accountName])
        
        if (existingAccount.length > 0) {
          // Update existing account
          await this.db.query(`
            UPDATE accounts 
            SET updatedAt = CURRENT_TIMESTAMP()
            WHERE id = ?
          `, [existingAccount[0].id])
          
          // Insert new statement record
          await this.db.insert('statements', [{
            id: uuidv4(),
            accountId: existingAccount[0].id,
            periodStart: new Date(),
            periodEnd: new Date(),
            closeDate: new Date(),
            newBalance: balance.currentBalance,
            minPayment: balance.minimumPayment || 0,
            createdAt: new Date()
          }])
        } else {
          // Insert new account
          const accountId = uuidv4()
          await this.db.insert('accounts', [{
            id: accountId,
            institutionId: await this.getOrCreateInstitutionId(balance.institutionName),
            type: balance.accountType,
            displayName: balance.accountName,
            last4: balance.last4,
            currency: 'USD',
            creditLimit: balance.creditLimit,
            createdAt: new Date(),
            updatedAt: new Date()
          }])
          
          // Insert statement record
          await this.db.insert('statements', [{
            id: uuidv4(),
            accountId,
            periodStart: new Date(),
            periodEnd: new Date(),
            closeDate: new Date(),
            newBalance: balance.currentBalance,
            minPayment: balance.minimumPayment || 0,
            createdAt: new Date()
          }])
        }
      }
      
      console.log('✅ Data saved to database successfully')
      
    } catch (error) {
      console.error('❌ Error saving to database:', error)
      throw error
    }
  }

  private async getOrCreateInstitutionId(institutionName: string): Promise<string> {
    // Check if institution exists
    const existing = await this.db.query(`
      SELECT id FROM institutions WHERE name = ?
    `, [institutionName])
    
    if (existing.length > 0) {
      return existing[0].id
    }
    
    // Create new institution
    const institutionId = uuidv4()
    await this.db.insert('institutions', [{
      id: institutionId,
      name: institutionName,
      kind: 'bank',
      website: '',
      createdAt: new Date()
    }])
    
    return institutionId
  }

  async generateReport(): Promise<void> {
    console.log('\n📊 Generating Scraping Report...')
    
    const report = {
      timestamp: new Date().toISOString(),
      totalAccounts: this.results.length,
      institutions: [...new Set(this.results.map(r => r.institutionName))],
      totalBalance: this.results.reduce((sum, r) => sum + r.currentBalance, 0),
      accountTypes: this.results.reduce((acc, r) => {
        acc[r.accountType] = (acc[r.accountType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      errors: this.errors,
      results: this.results
    }
    
    // Save report to file
    const reportPath = `reports/scraping_report_${Date.now()}.json`
    fs.mkdirSync('reports', { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📄 Report saved to ${reportPath}`)
    console.log(`\n📈 Summary:`)
    console.log(`   Total Accounts: ${report.totalAccounts}`)
    console.log(`   Institutions: ${report.institutions.join(', ')}`)
    console.log(`   Total Balance: $${report.totalBalance.toFixed(2)}`)
    console.log(`   Errors: ${report.errors.length}`)
  }

  async cleanup() {
    console.log('🧹 Cleaning up...')
    
    if (this.context) {
      await this.context.close()
    }
    
    if (this.browser) {
      await this.browser.close()
    }
    
    console.log('✅ Cleanup completed')
  }
}

// Main execution function
async function main() {
  const scraper = new FinancialDataScraper()
  
  try {
    // Create necessary directories
    fs.mkdirSync('screenshots', { recursive: true })
    fs.mkdirSync('reports', { recursive: true })
    
    await scraper.initialize()
    await scraper.scrapeAllInstitutions()
    await scraper.saveToDatabase()
    await scraper.generateReport()
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await scraper.cleanup()
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { FinancialDataScraper, AccountBalance, InstitutionConfig }
