import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'

export async function GET(
  request: NextRequest,
  { params }: { params: { tableName: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    
    const offset = (page - 1) * limit
    
    let sql = `SELECT * FROM \`${bigqueryDB.datasetName}.${params.tableName}\``
    const params_array: any[] = []
    
    // Add search functionality
    if (search) {
      // Get table schema to know which fields to search
      const schemaResult = await bigqueryDB.query(
        `SELECT column_name FROM \`${bigqueryDB['dataset']}.INFORMATION_SCHEMA.COLUMNS\` WHERE table_name = ?`,
        [params.tableName]
      )
      
      if (schemaResult.length > 0) {
        const searchableFields = schemaResult
          .map((col: any) => col.column_name)
          .filter((field: string) => field !== 'id') // Exclude ID field from search
        
        if (searchableFields.length > 0) {
          const searchConditions = searchableFields.map(field => `${field} LIKE ?`)
          sql += ` WHERE (${searchConditions.join(' OR ')})`
          searchableFields.forEach(() => params_array.push(`%${search}%`))
        }
      }
    }
    
    // Get total count for pagination
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
    const countResult = await bigqueryDB.query(countSql, params_array)
    const total = countResult[0]?.total || 0
    
    // Add pagination
    sql += ` ORDER BY id LIMIT ${limit} OFFSET ${offset}`
    
    const rows = await bigqueryDB.query(sql, params_array)
    
    return NextResponse.json({
      rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error(`Error fetching table ${params.tableName}:`, error)
    return NextResponse.json(
      { error: `Failed to fetch table ${params.tableName}` },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tableName: string } }
) {
  try {
    const body = await request.json()
    
    // Generate ID if not provided
    if (!body.id) {
      body.id = `${params.tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    // Add timestamps if they exist in schema
    const now = new Date().toISOString()
    if (body.createdAt === undefined) {
      body.createdAt = now
    }
    if (body.updatedAt === undefined) {
      body.updatedAt = now
    }
    
    const result = await bigqueryDB.create(params.tableName, body)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error creating row in ${params.tableName}:`, error)
    return NextResponse.json(
      { error: `Failed to create row in ${params.tableName}` },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tableName: string } }
) {
  try {
    const body = await request.json()
    const { where, data } = body
    
    // Add updated timestamp if it exists in schema
    if (data.updatedAt === undefined) {
      data.updatedAt = new Date().toISOString()
    }
    
    await bigqueryDB.update(params.tableName, data, where)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error updating row in ${params.tableName}:`, error)
    return NextResponse.json(
      { error: `Failed to update row in ${params.tableName}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tableName: string } }
) {
  try {
    const body = await request.json()
    const { where } = body
    
    await bigqueryDB.delete(params.tableName, where)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting row from ${params.tableName}:`, error)
    return NextResponse.json(
      { error: `Failed to delete row from ${params.tableName}` },
      { status: 500 }
    )
  }
}
