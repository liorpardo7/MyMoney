import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB, SCHEMAS } from '@/lib/bigquery'

export async function GET() {
  try {
    const tables = []
    
    // Get metadata for each table
    for (const [tableName, schema] of Object.entries(SCHEMAS)) {
      try {
        // Get row count
        const countResult = await bigqueryDB.query(
          `SELECT COUNT(*) as count FROM \`${bigqueryDB.datasetName}.${tableName}\``
        )
        const rowCount = countResult[0]?.count || 0
        
        tables.push({
          name: tableName,
          rowCount: Number(rowCount),
          schema: schema
        })
      } catch (error) {
        // Table might not exist yet, add with 0 count
        tables.push({
          name: tableName,
          rowCount: 0,
          schema: schema
        })
      }
    }
    
    return NextResponse.json(tables)
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    )
  }
}
