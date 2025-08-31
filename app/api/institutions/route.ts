import { NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function GET() {
  try {
    const institutions = await bigqueryDB.query(`
      SELECT id, name, kind, website 
      FROM \`mymoney.institutions\` 
      ORDER BY name ASC
    `)

    return NextResponse.json(institutions)
  } catch (error) {
    console.error('Get institutions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    )
  }
}
