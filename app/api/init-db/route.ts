import { NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function POST() {
  try {
    console.log('Initializing database tables...')
    
    // Initialize the database
    await bigqueryDB.initialize()
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    })
  } catch (error) {
    console.error('Database initialization failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
