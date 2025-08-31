#!/usr/bin/env tsx

import { BigQueryDB } from '../lib/bigquery'
import { getInstitutionConfig } from './institution-config'
import { INSTITUTION_SCRAPERS } from './institution-specific-scrapers'

async function testSetup() {
  console.log('🧪 Testing Financial Data Scraper Setup...\n')
  
  try {
    // Test 1: Check BigQuery connection
    console.log('1️⃣ Testing BigQuery connection...')
    const db = new BigQueryDB()
    await db.initialize()
    console.log('   ✅ BigQuery connection successful\n')
    
    // Test 2: Check institution configuration
    console.log('2️⃣ Testing institution configuration...')
    const institutions = getInstitutionConfig()
    console.log(`   ✅ Found ${institutions.length} institutions:`)
    institutions.forEach(inst => {
      console.log(`      - ${inst.name} (${inst.scriptName})`)
    })
    console.log()
    
    // Test 3: Check specialized scrapers
    console.log('3️⃣ Testing specialized scrapers...')
    const scraperCount = Object.keys(INSTITUTION_SCRAPERS).length
    console.log(`   ✅ Found ${scraperCount} specialized scrapers:`)
    Object.keys(INSTITUTION_SCRAPERS).forEach(name => {
      console.log(`      - ${name}`)
    })
    console.log()
    
    // Test 4: Validate configuration
    console.log('4️⃣ Validating configuration...')
    let configErrors = 0
    institutions.forEach(inst => {
      if (!inst.name || !inst.scriptName || !inst.loginUrl || !inst.username || !inst.password) {
        console.log(`   ❌ Invalid configuration for ${inst.name || 'Unknown'}`)
        configErrors++
      }
    })
    
    if (configErrors === 0) {
      console.log('   ✅ All institution configurations are valid\n')
    } else {
      console.log(`   ⚠️  Found ${configErrors} configuration errors\n`)
    }
    
    // Test 5: Check file structure
    console.log('5️⃣ Checking file structure...')
    const fs = require('fs')
    const path = require('path')
    
    const requiredFiles = [
      'scripts/financial-data-scraper.ts',
      'scripts/institution-specific-scrapers.ts',
      'scripts/institution-config.ts',
      'scripts/run-scraper.ts',
      'lib/bigquery.ts'
    ]
    
    let missingFiles = 0
    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`)
      } else {
        console.log(`   ❌ ${file} (missing)`)
        missingFiles++
      }
    })
    
    if (missingFiles === 0) {
      console.log('   ✅ All required files are present\n')
    } else {
      console.log(`   ⚠️  Found ${missingFiles} missing files\n`)
    }
    
    // Summary
    console.log('📊 Setup Test Summary:')
    console.log(`   - BigQuery: ✅ Connected`)
    console.log(`   - Institutions: ✅ ${institutions.length} configured`)
    console.log(`   - Scrapers: ✅ ${scraperCount} available`)
    console.log(`   - Configuration: ${configErrors === 0 ? '✅ Valid' : '❌ Errors found'}`)
    console.log(`   - Files: ${missingFiles === 0 ? '✅ Complete' : '❌ Missing files'}`)
    
    if (configErrors === 0 && missingFiles === 0) {
      console.log('\n🎉 Setup test passed! The scraper is ready to use.')
      console.log('\nNext steps:')
      console.log('   npm run scraper:help                    # View available commands')
      console.log('   npm run scraper:single firstinterstatebank  # Test with single institution')
      console.log('   npm run scraper:all                     # Run full scraping')
    } else {
      console.log('\n⚠️  Setup test failed. Please fix the issues above before using the scraper.')
    }
    
  } catch (error) {
    console.error('❌ Setup test failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  testSetup().catch(console.error)
}

export { testSetup }
