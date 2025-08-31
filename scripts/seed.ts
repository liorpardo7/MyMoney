import { bigqueryDB } from '../lib/bigquery'

async function seed() {
  try {
    console.log('🌱 Initializing BigQuery database structure...')
    
    // Initialize BigQuery database
    await bigqueryDB.initialize()
    
    console.log('✅ Database structure initialized!')
    
    // Seed initial institution data
    const institutions = [
      { id: 'chase', name: 'Chase', kind: 'CHASE', website: 'https://chase.com' },
      { id: 'capitalone', name: 'Capital One', kind: 'CAPITALONE', website: 'https://capitalone.com' },
      { id: 'synchrony', name: 'Synchrony Bank', kind: 'SYNCHRONY', website: 'https://synchronybank.com' },
      { id: 'creditone', name: 'Credit One Bank', kind: 'CREDITONE', website: 'https://creditonebank.com' },
      { id: 'missionlane', name: 'Mission Lane', kind: 'MISSIONLANE', website: 'https://missionlane.com' },
      { id: 'apple', name: 'Apple Card', kind: 'APPLE', website: 'https://card.apple.com' },
      { id: 'firstinterstate', name: 'First Interstate Bank', kind: 'FIRSTINTERSTATE', website: 'https://firstinterstate.com' },
      { id: 'bestegg', name: 'Best Egg', kind: 'BESTEGG', website: 'https://bestegg.com' },
      { id: 'upstart', name: 'Upstart', kind: 'UPSTART', website: 'https://upstart.com' }
    ]

    console.log('📊 Created:')
    for (const institution of institutions) {
      await bigqueryDB.upsert('institutions', 
        { ...institution, createdAt: new Date().toISOString() },
        { id: institution.id }
      )
      console.log(`  - ${institution.name} (${institution.kind})`)
    }

    console.log('\n🚀 Next steps:')
    console.log('  1. Import real PDF statements to create accounts')
    console.log('  2. Configure login credentials in Settings > Vault')
    console.log('  3. Use Fetch Data to scrape live account information')
    console.log('\n☁️  Your data is now safely stored in BigQuery cloud storage!')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

seed()
