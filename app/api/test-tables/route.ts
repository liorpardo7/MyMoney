import { NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function GET() {
  try {
    console.log('Testing database tables...')
    
    // Test if tables exist and have data
    const results: any = {}
    
    try {
      const institutions = await bigqueryDB.query('SELECT * FROM `mymoney.institutions` LIMIT 5')
      results.institutions = { count: institutions.length, data: institutions }
    } catch (error) {
      results.institutions = { error: error instanceof Error ? error.message : String(error) }
    }
    
    try {
      const accounts = await bigqueryDB.query('SELECT * FROM `mymoney.accounts` LIMIT 5')
      results.accounts = { count: accounts.length, data: accounts }
    } catch (error) {
      results.accounts = { error: error instanceof Error ? error.message : String(error) }
    }
    
    try {
      const statements = await bigqueryDB.query('SELECT * FROM `mymoney.statements` LIMIT 5')
      results.statements = { count: statements.length, data: statements }
    } catch (error) {
      results.statements = { error: error instanceof Error ? error.message : String(error) }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database tables test completed',
      results
    })
  } catch (error) {
    console.error('Database tables test failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
