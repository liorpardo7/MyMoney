import { InstitutionConfig } from './financial-data-scraper'

// Configuration for each financial institution
export const INSTITUTIONS: InstitutionConfig[] = [
  {
    name: 'First Interstate Bank',
    scriptName: 'firstinterstatebank',
    loginUrl: 'https://www.firstinterstatebank.com/login',
    username: 'liorpardo7',
    password: 'Liorly207',
    selectors: {
      usernameField: 'input[name="username"], input[type="text"]',
      passwordField: 'input[name="password"], input[type="password"]',
      loginButton: 'button[type="submit"], input[type="submit"]',
      balanceSelectors: [
        '.dbk-accts-account-attr__value span',
        '[data-testid*="balance"]',
        '.balance'
      ],
      accountNameSelectors: [
        '.dbk-accts-account__title span',
        '[data-testid*="account-name"]',
        '.account-name'
      ]
    },
    waitForSelectors: ['.dbk-accts-accounts-list__list', '.account-tile']
  },
  {
    name: 'Capital One',
    scriptName: 'capitalone',
    loginUrl: 'https://verified.capitalone.com/auth/signin?Product=ENTERPRISE',
    username: 'liorpardo',
    password: 'Pardo5050',
    selectors: {
      usernameField: 'input[name="username"], input[type="text"]',
      passwordField: 'input[name="password"], input[type="password"]',
      loginButton: 'button[type="submit"], input[type="submit"]',
      balanceSelectors: [
        '.primary-detail__balance__dollar',
        '[data-testid*="balance"]',
        '.balance'
      ],
      accountNameSelectors: [
        '.primary-detail__identity__img[alt]',
        '[data-testid*="account-name"]',
        '.account-name'
      ]
    },
    waitForSelectors: ['.tiles-layout', '.account-tile']
  },
  {
    name: 'Chase',
    scriptName: 'chase',
    loginUrl: 'https://secure.chase.com/web/auth/dashboard#/dashboard/overview',
    username: 'liorpardo7',
    password: 'Pardo5050@',
    selectors: {
      usernameField: 'input[name="username"], input[type="text"]',
      passwordField: 'input[name="password"], input[type="password"]',
      loginButton: 'button[type="submit"], input[type="submit"]',
      balanceSelectors: [
        '[data-testid="dataItem-value"]',
        '.primary-value',
        '.balance'
      ],
      accountNameSelectors: [
        '[data-testid="accounts-name-link"]',
        '.account-name',
        '.card-name'
      ]
    },
    waitForSelectors: ['#CARD_ACCOUNTS', '.account-tile']
  },
  {
    name: 'Mission Lane',
    scriptName: 'missionlane',
    loginUrl: 'https://www.missionlane.com/login',
    username: 'hacvana@gmail.com',
    password: 'Liorly207@@',
    selectors: {
      usernameField: 'input[name="email"], input[type="email"], input[type="text"]',
      passwordField: 'input[name="password"], input[type="password"]',
      loginButton: 'button[type="submit"], input[type="submit"]',
      balanceSelectors: [
        'h2[aria-level="2"]',
        '.balance',
        '[data-testid*="balance"]'
      ],
      accountNameSelectors: [
        '[data-testid="P3Component"]',
        '.card-name',
        '.account-name'
      ]
    },
    waitForSelectors: ['.css-146c3p1', 'h2[aria-level="2"]']
  },
  {
    name: 'Credit One',
    scriptName: 'CreditOne',
    loginUrl: 'https://www.creditonebank.com/login',
    username: 'liorpardo',
    password: '7Ggy@M8Fv9',
    selectors: {
      usernameField: 'input[name="username"], input[type="text"]',
      passwordField: 'input[name="password"], input[type="password"]',
      loginButton: 'button[type="submit"], input[type="submit"]',
      balanceSelectors: [
        '.current-balance',
        '.available-credit .amount',
        '.balance'
      ],
      accountNameSelectors: [
        '.card-name',
        '.account-card-title',
        '.account-name'
      ]
    },
    waitForSelectors: ['.dashboard-container', '.account-card']
  },
  {
    name: 'Synchrony Bank',
    scriptName: 'mysynchrony',
    loginUrl: 'https://www.mysynchrony.com/login',
    username: 'liorpardo',
    password: 'Pardo5050@',
    selectors: {
      usernameField: 'input[name="username"], input[type="text"]',
      passwordField: 'input[name="password"], input[type="password"]',
      loginButton: 'button[type="submit"], input[type="submit"]',
      balanceSelectors: [
        '[data-cy="section-1.value"]',
        '.sc-dNiKSF',
        '.balance'
      ],
      accountNameSelectors: [
        '.sc-keCyev',
        '.account-name',
        '.card-name'
      ]
    },
    waitForSelectors: ['.sc-jmUXcl', '.sc-ckxRkO']
  }
]

// Environment-specific configurations
export const getInstitutionConfig = (): InstitutionConfig[] => {
  // You can override credentials from environment variables for security
  const configs = [...INSTITUTIONS]
  
  // Override with environment variables if they exist
  configs.forEach(config => {
    const envUsername = process.env[`${config.scriptName.toUpperCase()}_USERNAME`]
    const envPassword = process.env[`${config.scriptName.toUpperCase()}_PASSWORD`]
    
    if (envUsername) config.username = envUsername
    if (envPassword) config.password = envPassword
  })
  
  return configs
}

// Helper function to get config by script name
export const getInstitutionByScriptName = (scriptName: string): InstitutionConfig | undefined => {
  return INSTITUTIONS.find(inst => inst.scriptName === scriptName)
}

// Helper function to get config by institution name
export const getInstitutionByName = (name: string): InstitutionConfig | undefined => {
  return INSTITUTIONS.find(inst => inst.name === name)
}
