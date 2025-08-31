import { NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function GET() {
  try {
    // Test basic connection
    const testQuery = await bigqueryDB.query('SELECT 1 as test')
    
    // Check if dataset exists
    const datasets = await bigqueryDB.query(`
      SELECT schema_name 
      FROM \`mymoney-470619.INFORMATION_SCHEMA.SCHEMATA\`
      WHERE schema_name = 'mymoney'
    `)
    
    // Check if tables exist
    const tables = await bigqueryDB.query(`
      SELECT table_name 
      FROM \`mymoney-470619.mymoney.INFORMATION_SCHEMA.TABLES\`
    `)
    
    let accountCount = null
    let sampleAccounts = null
    let institutionCount = null
    let sampleInstitutions = null
    let statementCount = null
    let sampleStatements = null
    
    // Try to count accounts
    try {
      accountCount = await bigqueryDB.query('SELECT COUNT(*) as count FROM `mymoney-470619.mymoney.accounts`')
      
      // Get sample accounts
      if (accountCount[0]?.count > 0) {
        sampleAccounts = await bigqueryDB.query('SELECT * FROM `mymoney-470619.mymoney.accounts` LIMIT 3')
      }
      
      // Check institutions
      institutionCount = await bigqueryDB.query('SELECT COUNT(*) as count FROM `mymoney-470619.mymoney.institutions`')
      
      if (institutionCount[0]?.count > 0) {
        sampleInstitutions = await bigqueryDB.query('SELECT * FROM `mymoney-470619.mymoney.institutions` LIMIT 3')
      }
      
      // Check statements
      statementCount = await bigqueryDB.query('SELECT COUNT(*) as count FROM `mymoney-470619.mymoney.statements`')
      
      if (statementCount[0]?.count > 0) {
        sampleStatements = await bigqueryDB.query('SELECT * FROM `mymoney-470619.mymoney.statements` LIMIT 3')
      }
      
    } catch (error) {
      console.log('Error querying data:', error)
    }
    
    return NextResponse.json({
      success: true,
      testQuery,
      datasets,
      tables,
      accountCount,
      sampleAccounts,
      institutionCount,
      sampleInstitutions,
      statementCount,
      sampleStatements,
      message: 'BigQuery test completed'
    })
  } catch (error) {
    console.error('BigQuery test error:', error)
    return NextResponse.json(
      { error: 'BigQuery test failed', details: error },
      { status: 500 }
    )
  }
}
