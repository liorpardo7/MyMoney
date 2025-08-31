#!/usr/bin/env tsx

import { exec } from 'child_process'
import { promisify } from 'util'
import { chromium, Browser, BrowserContext, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

interface AccountBalance {
  institutionName: string
  accountName: string
  accountType: 'checking' | 'savings' | 'credit' | 'loan'
  currentBalance: number
  availableBalance?: number
  creditLimit?: number
  availableCredit?: number
  last4?: string
  minimumPayment?: number
  extractedAt: Date
}

class ChromeProfileScraper {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  
  async scrapeFirstInterstateBank(): Promise<AccountBalance[]> {
    console.log('🏦 Starting First Interstate Bank scraping with Chrome profile...')
    
    try {
      // Launch Chrome with your profile using Playwright
      console.log('🚀 Launching Chrome with your profile...')
      
      this.context = await chromium.launchPersistentContext(
        '/Users/liorpardo/Library/Application Support/Google/Chrome/Default',
        {
          headless: false,
          channel: 'chrome',
          args: [
            '--profile-directory=Default',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--disable-popup-blocking',
            '--disable-translate',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-features=ScriptStreaming'
          ]
        }
      )
      
      this.browser = this.context.browser()
      
      console.log('✅ Chrome launched successfully with your profile')
      console.log('📝 Chrome should remember your login credentials and "Online Banking" selection')
      
      // Navigate to the login page
      const page = await this.context.newPage()
      await page.goto('https://www.firstinterstatebank.com/login')
      
      // Wait for the page to load
      await page.waitForTimeout(3000)
      
      // Take a screenshot to see the current state
      await page.screenshot({ path: 'screenshots/firstinterstate-before-signin.png' })
      console.log('📸 Screenshot saved: firstinterstate-before-signin.png')
      
      // Look for and click the Sign In button using the specific selector
      console.log('🔍 Looking for Sign In button...')
      const signInButton = await page.$('button.btn.btn-orange-dark[type="submit"]')
      
      if (signInButton) {
        console.log('✅ Found Sign In button, clicking automatically...')
        await signInButton.click()
        console.log('✅ Clicked Sign In button')
        
        // Wait for navigation
        await page.waitForTimeout(5000)
        
        // Take screenshot after login
        await page.screenshot({ path: 'screenshots/firstinterstate-after-signin.png' })
        console.log('📸 Screenshot saved: firstinterstate-after-signin.png')
        
        // Now extract account data
        console.log('📊 Extracting account data...')
        return await this.extractAccountData(page)
        
      } else {
        throw new Error('Sign In button not found')
      }
      
    } catch (error) {
      console.error('❌ Error during scraping:', error)
      throw error
    }
  }
  
  private async waitForUserInput(prompt: string): Promise<void> {
    return new Promise((resolve) => {
      console.log(prompt)
      process.stdin.once('data', () => {
        resolve()
      })
    })
  }
  
  private async extractAccountData(page: Page): Promise<AccountBalance[]> {
    const accountBalances: AccountBalance[] = []
    
    try {
      console.log('    🔍 Looking for account data...')
      
      // Try multiple possible selectors for the accounts list
      const possibleSelectors = [
        '.dbk-accts-accounts-list__list',
        '.account-list',
        '.accounts-container',
        '[data-testid*="account"]',
        '.account-tile'
      ]
      
      let accountsFound = false
      for (const selector of possibleSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 })
          console.log(`    ✅ Found accounts using selector: ${selector}`)
          accountsFound = true
          break
        } catch (error) {
          console.log(`    ⚠️  Selector ${selector} not found, trying next...`)
        }
      }
      
      if (!accountsFound) {
        console.log('    ⚠️  No account selectors found, trying to extract from page content...')
        return await this.extractFromPageContent(page)
      }
      
      // Extract accounts from the HTML structure
      const accounts = await page.$$('.dbk-accts-account')
      
      for (const account of accounts) {
        try {
          // Extract account name
          const nameElement = await account.$('.dbk-accts-account__title span')
          const accountName = nameElement ? await nameElement.textContent() : 'Unknown Account'
          
          // Extract balance information
          const balanceElements = await account.$$('.dbk-accts-account-attr__value span')
          let currentBalance = 0
          let availableBalance = 0
          let creditLimit = 0
          let availableCredit = 0
          let last4 = ''
          
          // Extract last 4 digits from account name
          const last4Match = accountName?.match(/\*(\d{4})/)
          if (last4Match) {
            last4 = last4Match[1]
          }
          
          // Determine account type and extract balances
          let accountType: 'checking' | 'savings' | 'credit' | 'loan' = 'checking'
          
          if (accountName?.toLowerCase().includes('credit') || accountName?.toLowerCase().includes('card')) {
            accountType = 'credit'
            // For credit cards, look for outstanding balance and available credit
            for (const balanceElement of balanceElements) {
              const text = await balanceElement.textContent()
              if (text) {
                const amount = this.parseAmount(text)
                if (amount !== null) {
                  if (text.toLowerCase().includes('outstanding')) {
                    currentBalance = amount
                  } else if (text.toLowerCase().includes('available')) {
                    availableCredit = amount
                  }
                }
              }
            }
          } else {
            // For checking/savings accounts
            if (accountName?.toLowerCase().includes('savings')) {
              accountType = 'savings'
            }
            
            for (const balanceElement of balanceElements) {
              const text = await balanceElement.textContent()
              if (text) {
                const amount = this.parseAmount(text)
                if (amount !== null) {
                  if (text.toLowerCase().includes('available')) {
                    availableBalance = amount
                  } else if (text.toLowerCase().includes('current')) {
                    currentBalance = amount
                  }
                }
              }
            }
          }
          
          if (accountName && (currentBalance > 0 || availableBalance > 0 || availableCredit > 0)) {
            accountBalances.push({
              institutionName: 'First Interstate Bank',
              accountName: accountName.trim(),
              accountType,
              currentBalance,
              availableBalance,
              creditLimit,
              availableCredit,
              last4,
              extractedAt: new Date()
            })
          }
        } catch (error) {
          console.log(`    ⚠️  Error extracting account: ${error}`)
        }
      }
      
    } catch (error) {
      console.log(`    ⚠️  Error in account extraction: ${error}`)
    }
    
    return accountBalances
  }
  
  private async extractFromPageContent(page: Page): Promise<AccountBalance[]> {
    const accountBalances: AccountBalance[] = []
    
    try {
      console.log('    🔍 Attempting to extract from page content...')
      
      // Get the page text content
      const pageText = await page.textContent('body')
      if (!pageText) {
        console.log('    ⚠️  No page content found')
        return accountBalances
      }
      
      // Look for balance patterns
      const balancePatterns = [
        /\$[\d,]+\.?\d*/g,
        /[\d,]+\.?\d*\s*(?:dollars?|USD)/gi
      ]
      
      const balances = []
      for (const pattern of balancePatterns) {
        const matches = pageText.match(pattern)
        if (matches) {
          balances.push(...matches)
        }
      }
      
      // Look for account name patterns
      const accountPatterns = [
        /(?:account|card)\s*[#\*]?\d+/gi,
        /(?:checking|savings|credit)\s*(?:account|card)/gi
      ]
      
      const accountNames = []
      for (const pattern of accountPatterns) {
        const matches = pageText.match(pattern)
        if (matches) {
          accountNames.push(...matches)
        }
      }
      
      console.log(`    📊 Found ${balances.length} balance patterns and ${accountNames.length} account patterns`)
      
      // Create account entries from found patterns
      if (balances.length > 0) {
        for (let i = 0; i < Math.min(balances.length, 5); i++) { // Limit to 5 accounts
          const balance = this.parseAmount(balances[i])
          if (balance !== null && balance > 0) {
            const accountName = accountNames[i] || `Account ${i + 1}`
            accountBalances.push({
              institutionName: 'First Interstate Bank',
              accountName: accountName.trim(),
              accountType: 'checking',
              currentBalance: balance,
              extractedAt: new Date()
            })
          }
        }
      }
      
      console.log(`    ✅ Extracted ${accountBalances.length} accounts from page content`)
      
    } catch (error) {
      console.log(`    ⚠️  Error extracting from page content: ${error}`)
    }
    
    return accountBalances
  }
  
  private parseAmount(text: string): number | null {
    try {
      if (!text) return null
      
      // Remove currency symbols, commas, and extra text
      const cleanText = text.replace(/[$,]/g, '').trim()
      
      // Look for numeric patterns
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
  
  async cleanup(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close()
      }
      if (this.browser) {
        await this.browser.close()
      }
      console.log('🧹 Cleaned up browser')
    } catch (error) {
      console.log('⚠️  Error during cleanup:', error)
    }
  }
}

// Main execution
async function main() {
  const scraper = new ChromeProfileScraper()
  
  try {
    const accounts = await scraper.scrapeFirstInterstateBank()
    console.log(`📊 Extracted ${accounts.length} accounts`)
    
    if (accounts.length > 0) {
      console.log('📋 Account details:')
      accounts.forEach((account, index) => {
        console.log(`  ${index + 1}. ${account.accountName}: $${account.currentBalance}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Scraping failed:', error)
  } finally {
    await scraper.cleanup()
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { ChromeProfileScraper }
