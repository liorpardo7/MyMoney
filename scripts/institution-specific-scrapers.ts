import { Page } from 'playwright'
import { AccountBalance } from './financial-data-scraper'

// Specialized scrapers for each institution based on their HTML structure

export class FirstInterstateBankScraper {
  static async extractAccountData(page: Page): Promise<AccountBalance[]> {
    const accountBalances: AccountBalance[] = []
    
    try {
      console.log('      🔍 Looking for account data...')
      
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
          console.log(`      ✅ Found accounts using selector: ${selector}`)
          accountsFound = true
          break
        } catch (error) {
          console.log(`      ⚠️  Selector ${selector} not found, trying next...`)
        }
      }
      
      if (!accountsFound) {
        console.log('      ⚠️  No account selectors found, trying to extract from page content...')
        return await extractFromPageContent(page)
      }
      
      // Extract accounts from the HTML structure provided in scripts.txt.html
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
                const amount = parseAmount(text)
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
                const amount = parseAmount(text)
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
          console.log(`    ⚠️  Error extracting First Interstate Bank account: ${error}`)
        }
      }
      
    } catch (error) {
      console.log(`    ⚠️  Error in First Interstate Bank extraction: ${error}`)
    }
    
    return accountBalances
  }
}

export class CapitalOneScraper {
  static async extractAccountData(page: Page): Promise<AccountBalance[]> {
    const accountBalances: AccountBalance[] = []
    
    try {
      // Wait for the tiles layout to load
      await page.waitForSelector('.tiles-layout', { timeout: 15000 })
      
      // Extract credit card accounts
      const accountTiles = await page.$$('.tiles-layout__tile .account-tile')
      
      for (const tile of accountTiles) {
        try {
          // Extract account name (card type)
          const nameElement = await tile.$('.primary-detail__identity__img[alt]')
          const accountName = nameElement ? await nameElement.getAttribute('alt') : 'Unknown Card'
          
          // Extract account number (last 4 digits)
          const numberElement = await tile.$('.primary-detail__identity__account-number')
          const accountNumber = numberElement ? await numberElement.textContent() : ''
          const last4 = accountNumber ? accountNumber.replace(/\D/g, '').slice(-4) : ''
          
          // Extract current balance
          const balanceElements = await tile.$$('.primary-detail__balance__dollar, .primary-detail__balance__superscript')
          let balanceText = ''
          for (const element of balanceElements) {
            const text = await element.textContent()
            if (text && text.trim()) {
              balanceText += text.trim()
            }
          }
          
          const currentBalance = parseAmount(balanceText) || 0
          
          if (accountName && currentBalance > 0) {
            accountBalances.push({
              institutionName: 'Capital One',
              accountName: `${accountName} ${last4 ? `*${last4}` : ''}`.trim(),
              accountType: 'credit',
              currentBalance,
              last4,
              extractedAt: new Date()
            })
          }
        } catch (error) {
          console.log(`    ⚠️  Error extracting Capital One account: ${error}`)
        }
      }
      
      // Extract rewards balance
      try {
        const rewardsTile = await page.$('.rewards-tile')
        if (rewardsTile) {
          const rewardsElements = await rewardsTile.$$('.primary-detail__balance-dollar, .primary-detail__balance-superscript')
          let rewardsText = ''
          for (const element of rewardsElements) {
            const text = await element.textContent()
            if (text && text.trim()) {
              rewardsText += text.trim()
            }
          }
          
          const rewardsBalance = parseAmount(rewardsText)
          if (rewardsBalance !== null && rewardsBalance > 0) {
            accountBalances.push({
              institutionName: 'Capital One',
              accountName: 'Rewards Cash',
              accountType: 'savings',
              currentBalance: rewardsBalance,
              extractedAt: new Date()
            })
          }
        }
      } catch (error) {
        console.log(`    ⚠️  Error extracting Capital One rewards: ${error}`)
      }
      
    } catch (error) {
      console.log(`    ⚠️  Error in Capital One extraction: ${error}`)
    }
    
    return accountBalances
  }
}

export class ChaseScraper {
  static async extractAccountData(page: Page): Promise<AccountBalance[]> {
    const accountBalances: AccountBalance[] = []
    
    try {
      // Wait for the credit cards section to load
      await page.waitForSelector('#CARD_ACCOUNTS', { timeout: 15000 })
      
      // Extract credit card information
      const accountTiles = await page.$$('.account-tile')
      
      for (const tile of accountTiles) {
        try {
          // Extract account name
          const nameElement = await tile.$('[data-testid="accounts-name-link"]')
          const accountName = nameElement ? await nameElement.textContent() : 'Unknown Card'
          
          // Extract last 4 digits
          const last4Match = accountName?.match(/\(\.\.\.(\d{4})\)/)
          const last4 = last4Match ? last4Match[1] : ''
          
          // Extract current balance
          const balanceElement = await tile.$('[data-testid="dataItem-value"]')
          const balanceText = balanceElement ? await balanceElement.textContent() : ''
          const currentBalance = parseAmount(balanceText) || 0
          
          // Extract available credit
          const availableCreditElement = await tile.$('[data-testid="918241290-availableCredit-dataItem"] [data-testid="dataItem-value"]')
          const availableCreditText = availableCreditElement ? await availableCreditElement.textContent() : ''
          const availableCredit = parseAmount(availableCreditText) || 0
          
          if (accountName && currentBalance > 0) {
            accountBalances.push({
              institutionName: 'Chase',
              accountName: accountName.trim(),
              accountType: 'credit',
              currentBalance,
              availableCredit,
              last4,
              extractedAt: new Date()
            })
          }
        } catch (error) {
          console.log(`    ⚠️  Error extracting Chase account: ${error}`)
        }
      }
      
    } catch (error) {
      console.log(`    ⚠️  Error in Chase extraction: ${error}`)
    }
    
    return accountBalances
  }
}

export class MissionLaneScraper {
  static async extractAccountData(page: Page): Promise<AccountBalance[]> {
    const accountBalances: AccountBalance[] = []
    
    try {
      // Wait for the account information to load
      await page.waitForSelector('.css-146c3p1', { timeout: 15000 })
      
      // Extract account name (Visa + last 4)
      const cardTypeElement = await page.$('[data-testid="P3Component"]')
      const cardType = cardTypeElement ? await cardTypeElement.textContent() : 'Visa'
      
      const last4Element = await page.$('[data-testid="P3Component"]:nth-child(2)')
      const last4 = last4Element ? await last4Element.textContent() : ''
      
      // Extract current balance
      const balanceElement = await page.$('h2[aria-level="2"]')
      const balanceText = balanceElement ? await balanceElement.textContent() : ''
      const currentBalance = parseAmount(balanceText) || 0
      
      // Extract available credit
      const availableElement = await page.$('h3[aria-level="3"]')
      const availableText = availableElement ? await availableElement.textContent() : ''
      const availableCredit = parseAmount(availableText) || 0
      
      if (currentBalance > 0) {
        accountBalances.push({
          institutionName: 'Mission Lane',
          accountName: `${cardType} ${last4 ? `*${last4}` : ''}`.trim(),
          accountType: 'credit',
          currentBalance,
          availableCredit,
          last4: last4 ? last4.replace(/\D/g, '') : '',
          extractedAt: new Date()
        })
      }
      
    } catch (error) {
      console.log(`    ⚠️  Error in Mission Lane extraction: ${error}`)
    }
    
    return accountBalances
  }
}

export class CreditOneScraper {
  static async extractAccountData(page: Page): Promise<AccountBalance[]> {
    const accountBalances: AccountBalance[] = []
    
    try {
      // Wait for the dashboard to load
      await page.waitForSelector('.dashboard-container', { timeout: 15000 })
      
      // Extract all account cards
      const accountCards = await page.$$('.account-card')
      
      for (const card of accountCards) {
        try {
          // Extract account name
          const nameElement = await card.$('.card-name .account-card-title')
          const accountName = nameElement ? await nameElement.textContent() : 'Unknown Card'
          
          // Extract last 4 digits
          const last4Match = accountName?.match(/(\d{4})$/)
          const last4 = last4Match ? last4Match[1] : ''
          
          // Extract current balance
          const balanceElement = await card.$('.current-balance')
          const balanceText = balanceElement ? await balanceElement.textContent() : ''
          const currentBalance = parseAmount(balanceText) || 0
          
          // Extract available credit
          const availableElement = await card.$('.available-credit .amount')
          const availableText = availableElement ? await availableElement.textContent() : ''
          const availableCredit = parseAmount(availableText) || 0
          
          if (accountName && currentBalance > 0) {
            accountBalances.push({
              institutionName: 'Credit One',
              accountName: accountName.trim(),
              accountType: 'credit',
              currentBalance,
              availableCredit,
              last4,
              extractedAt: new Date()
            })
          }
        } catch (error) {
          console.log(`    ⚠️  Error extracting Credit One account: ${error}`)
        }
      }
      
    } catch (error) {
      console.log(`    ⚠️  Error in Credit One extraction: ${error}`)
    }
    
    return accountBalances
  }
}

export class SynchronyBankScraper {
  static async extractAccountData(page: Page): Promise<AccountBalance[]> {
    const accountBalances: AccountBalance[] = []
    
    try {
      // Wait for the accounts grid to load
      await page.waitForSelector('.sc-jmUXcl', { timeout: 15000 })
      
      // Extract all account cards
      const accountCards = await page.$$('.sc-ckxRkO')
      
      for (const card of accountCards) {
        try {
          // Extract account name
          const nameElement = await card.$('.sc-keCyev')
          const accountName = nameElement ? await nameElement.textContent() : 'Unknown Account'
          
          // Extract last 4 digits
          const last4Element = await card.$('[data-cy="account-last-4"]')
          const last4 = last4Element ? await last4Element.textContent() : ''
          
          // Extract current balance
          const balanceElement = await card.$('[data-cy="section-1.value"]')
          const balanceText = balanceElement ? await balanceElement.textContent() : ''
          const currentBalance = parseAmount(balanceText) || 0
          
          // Extract available credit
          const availableElement = await card.$('[data-cy="section-2.value"]')
          const availableText = availableElement ? await availableElement.textContent() : ''
          const availableCredit = parseAmount(availableText) || 0
          
          // Extract minimum payment
          const minPaymentElement = await card.$('[data-cy="section-3.value"]')
          const minPaymentText = minPaymentElement ? await minPaymentElement.textContent() : ''
          const minimumPayment = parseAmount(minPaymentText) || 0
          
          if (accountName && currentBalance > 0) {
            accountBalances.push({
              institutionName: 'Synchrony Bank',
              accountName: accountName.trim(),
              accountType: 'credit',
              currentBalance,
              availableCredit,
              last4,
              minimumPayment,
              extractedAt: new Date()
            })
          }
        } catch (error) {
          console.log(`    ⚠️  Error extracting Synchrony Bank account: ${error}`)
        }
      }
      
    } catch (error) {
      console.log(`    ⚠️  Error in Synchrony Bank extraction: ${error}`)
    }
    
    return accountBalances
  }
}

// Helper function to extract account data from page content when selectors fail
async function extractFromPageContent(page: Page): Promise<AccountBalance[]> {
  const accountBalances: AccountBalance[] = []
  
  try {
    console.log('      🔍 Attempting to extract from page content...')
    
    // Get the page text content
    const pageText = await page.textContent('body')
    if (!pageText) {
      console.log('      ⚠️  No page content found')
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
    
    console.log(`      📊 Found ${balances.length} balance patterns and ${accountNames.length} account patterns`)
    
    // Create account entries from found patterns
    if (balances.length > 0) {
      for (let i = 0; i < Math.min(balances.length, 5); i++) { // Limit to 5 accounts
        const balance = parseAmount(balances[i])
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
    
    console.log(`      ✅ Extracted ${accountBalances.length} accounts from page content`)
    
  } catch (error) {
    console.log(`      ⚠️  Error extracting from page content: ${error}`)
  }
  
  return accountBalances
}

// Helper function to parse amount strings
function parseAmount(text: string): number | null {
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

// Custom login methods for institutions that need special handling
export const CUSTOM_LOGIN_METHODS = {
  'First Interstate Bank': async (page: Page, username: string, password: string) => {
    try {
      console.log('      🔍 Looking for login dropdown...')
      
      // Wait for the login dropdown to appear (don't wait for it to be visible)
      await page.waitForSelector('#login-select', { timeout: 15000 })
      console.log('      ✅ Found login dropdown')
      
      // Take a screenshot to debug the page state
      await page.screenshot({ path: 'screenshots/firstinterstate-login-dropdown.png' })
      console.log('      📸 Screenshot saved: firstinterstate-login-dropdown.png')
      
      // Log the dropdown HTML for debugging
      const dropdownHTML = await page.innerHTML('#login-select')
      console.log('      🔍 Dropdown HTML:', dropdownHTML)
      
      // Wait a moment for the dropdown to be fully interactive
      await page.waitForTimeout(2000)
      
      // Select "Online Banking" from the dropdown
      console.log('      🔍 Selecting Online Banking from dropdown...')
      await page.selectOption('#login-select', 'online')
      console.log('      ✅ Selected Online Banking')
      
      // Wait for the login form to appear
      await page.waitForTimeout(3000)
      
      // Take another screenshot to see if the form appeared
      await page.screenshot({ path: 'screenshots/firstinterstate-after-selection.png' })
      console.log('      📸 Screenshot saved: firstinterstate-after-selection.png')
      
      // Look for username field
      const usernameField = await page.$('input[name="username"], input[type="text"]')
      if (usernameField) {
        await usernameField.fill(username)
        console.log('      ✅ Filled username')
      } else {
        console.log('      ⚠️  Username field not found')
      }
      
      await page.waitForTimeout(1000)
      
      // Look for password field
      const passwordField = await page.$('input[name="password"], input[type="password"]')
      if (passwordField) {
        await passwordField.fill(password)
        console.log('      ✅ Filled password')
      } else {
        console.log('      ⚠️  Password field not found')
      }
      
      await page.waitForTimeout(1000)
      
      // Look for submit button
      const submitButton = await page.$('button[type="submit"], input[type="submit"]')
      if (submitButton) {
        await submitButton.click()
        console.log('      ✅ Clicked submit button')
      } else {
        console.log('      ⚠️  Submit button not found')
      }
      
      // Wait for navigation and page load
      await page.waitForTimeout(5000)
      
      // Wait for some indication that we're logged in
      try {
        await page.waitForSelector('body', { timeout: 10000 })
        console.log('      ✅ Page loaded after login')
        
        // Check if we're on a blocked/error page
        const pageTitle = await page.title()
        const pageUrl = page.url()
        
        console.log(`      📄 Page title: ${pageTitle}`)
        console.log(`      🔗 Current URL: ${pageUrl}`)
        
        // Check for common blocking indicators
        const blockedIndicators = [
          'Access Denied',
          'Blocked',
          'Suspicious Activity',
          'Security Check',
          'Verify Identity',
          'Captcha',
          'Robot Check'
        ]
        
        const pageContent = await page.textContent('body')
        let isBlocked = false
        
        for (const indicator of blockedIndicators) {
          if (pageContent?.toLowerCase().includes(indicator.toLowerCase())) {
            console.log(`      ⚠️  Page appears to be blocked: ${indicator}`)
            isBlocked = true
            break
          }
        }
        
        if (isBlocked) {
          console.log('      🔍 Taking screenshot of blocked page...')
          await page.screenshot({ path: 'screenshots/firstinterstate-blocked-page.png' })
          throw new Error('Page appears to be blocked after login')
        }
        
      } catch (error) {
        console.log('      ⚠️  Could not verify page load, continuing...')
      }
      
    } catch (error) {
      throw new Error(`Custom login failed: ${error}`)
    }
  }
}

// Export all scrapers
export const INSTITUTION_SCRAPERS = {
  'First Interstate Bank': FirstInterstateBankScraper,
  'Capital One': CapitalOneScraper,
  'Chase': ChaseScraper,
  'Mission Lane': MissionLaneScraper,
  'Credit One': CreditOneScraper,
  'Synchrony Bank': SynchronyBankScraper
}
