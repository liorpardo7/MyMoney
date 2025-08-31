#!/usr/bin/env tsx

import { FinancialDataScraper } from './financial-data-scraper'
import { getInstitutionByScriptName, getInstitutionByName } from './institution-config'
import * as fs from 'fs'

// Command line argument parsing
const args = process.argv.slice(2)
const command = args[0]

// Help function
function showHelp() {
  console.log(`
🚀 Financial Data Scraper

Usage:
  npm run scraper:all                    # Scrape all institutions
  npm run scraper:single <scriptName>    # Scrape single institution by script name
  npm run scraper:institution <name>     # Scrape single institution by name
  npm run scraper:help                   # Show this help

Available script names:
  - firstinterstatebank
  - capitalone
  - chase
  - missionlane
  - CreditOne
  - mysynchrony

Examples:
  npm run scraper:single firstinterstatebank
  npm run scraper:institution "First Interstate Bank"
  npm run scraper:all
`)
}

// Main execution function
async function main() {
  try {
    // Create necessary directories
    fs.mkdirSync('screenshots', { recursive: true })
    fs.mkdirSync('reports', { recursive: true })
    
    const scraper = new FinancialDataScraper()
    
    switch (command) {
      case 'all':
        console.log('🏦 Starting full financial data scraping...')
        await scraper.initialize()
        await scraper.scrapeAllInstitutions()
        await scraper.saveToDatabase()
        await scraper.generateReport()
        break
        
      case 'single':
        const scriptName = args[1]
        if (!scriptName) {
          console.error('❌ Please provide a script name')
          showHelp()
          process.exit(1)
        }
        
        const institution = getInstitutionByScriptName(scriptName)
        if (!institution) {
          console.error(`❌ Institution with script name "${scriptName}" not found`)
          process.exit(1)
        }
        
        console.log(`🏦 Starting scraping for ${institution.name}...`)
        await scraper.initialize()
        await scraper.scrapeInstitution(institution)
        await scraper.saveToDatabase()
        await scraper.generateReport()
        break
        
      case 'institution':
        const institutionName = args[1]
        if (!institutionName) {
          console.error('❌ Please provide an institution name')
          showHelp()
          process.exit(1)
        }
        
        const inst = getInstitutionByName(institutionName)
        if (!inst) {
          console.error(`❌ Institution "${institutionName}" not found`)
          process.exit(1)
        }
        
        console.log(`🏦 Starting scraping for ${inst.name}...`)
        await scraper.initialize()
        await scraper.scrapeInstitution(inst)
        await scraper.saveToDatabase()
        await scraper.generateReport()
        break
        
      case 'help':
      case '--help':
      case '-h':
        showHelp()
        break
        
      default:
        console.error(`❌ Unknown command: ${command}`)
        showHelp()
        process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    // Cleanup will be handled by the scraper
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}
