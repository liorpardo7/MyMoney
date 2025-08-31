import { BigQuery } from '@google-cloud/bigquery'
import { join } from 'path'

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'mymoney-470619',
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || join(process.cwd(), 'mymoney-470619-2f22e813a9d7.json')
})

// Database schema definitions
export const SCHEMAS = {
  institutions: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'name', type: 'STRING', mode: 'REQUIRED' },
    { name: 'kind', type: 'STRING', mode: 'REQUIRED' },
    { name: 'website', type: 'STRING', mode: 'NULLABLE' },
    { name: 'createdAt', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  accounts: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'institutionId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'type', type: 'STRING', mode: 'REQUIRED' },
    { name: 'displayName', type: 'STRING', mode: 'REQUIRED' },
    { name: 'last4', type: 'STRING', mode: 'NULLABLE' },
    { name: 'currency', type: 'STRING', mode: 'REQUIRED' },
    { name: 'openedAt', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'closedAt', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'creditLimit', type: 'INT64', mode: 'NULLABLE' },
    { name: 'originalPrincipal', type: 'INT64', mode: 'NULLABLE' },
    { name: 'termMonths', type: 'INT64', mode: 'NULLABLE' },
    { name: 'secured', type: 'BOOL', mode: 'NULLABLE' },
    { name: 'createdAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'updatedAt', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  credentials: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'institutionId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'username', type: 'STRING', mode: 'REQUIRED' },
    { name: 'password', type: 'STRING', mode: 'REQUIRED' },
    { name: 'securityQA', type: 'STRING', mode: 'NULLABLE' },
    { name: 'notes', type: 'STRING', mode: 'NULLABLE' },
    { name: 'isActive', type: 'BOOL', mode: 'REQUIRED' },
    { name: 'lastUsed', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'createdAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'updatedAt', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  statements: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'accountId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'periodStart', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'periodEnd', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'closeDate', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'dueDate', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'newBalance', type: 'FLOAT64', mode: 'REQUIRED' },
    { name: 'minPayment', type: 'FLOAT64', mode: 'REQUIRED' },
    { name: 'pdfPath', type: 'STRING', mode: 'NULLABLE' },
    { name: 'parsedBy', type: 'STRING', mode: 'NULLABLE' },
    { name: 'createdAt', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  transactions: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'accountId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'postedAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'description', type: 'STRING', mode: 'REQUIRED' },
    { name: 'amount', type: 'FLOAT64', mode: 'REQUIRED' },
    { name: 'category', type: 'STRING', mode: 'NULLABLE' },
    { name: 'source', type: 'STRING', mode: 'NULLABLE' },
    { name: 'metadata', type: 'STRING', mode: 'NULLABLE' }
  ],
  aprHistory: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'accountId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'aprType', type: 'STRING', mode: 'REQUIRED' },
    { name: 'aprPct', type: 'FLOAT64', mode: 'REQUIRED' },
    { name: 'effective', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  limitHistory: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'accountId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'limit', type: 'INT64', mode: 'REQUIRED' },
    { name: 'effective', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  autopays: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'accountId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'kind', type: 'STRING', mode: 'REQUIRED' },
    { name: 'amount', type: 'FLOAT64', mode: 'NULLABLE' },
    { name: 'dayOfMonth', type: 'INT64', mode: 'NULLABLE' },
    { name: 'enabled', type: 'BOOL', mode: 'REQUIRED' }
  ],
  promotions: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'accountId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'promoType', type: 'STRING', mode: 'REQUIRED' },
    { name: 'startDate', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'endDate', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'notes', type: 'STRING', mode: 'NULLABLE' }
  ],
  scoreSnapshots: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'date', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'bureau', type: 'STRING', mode: 'REQUIRED' },
    { name: 'score', type: 'INT64', mode: 'REQUIRED' },
    { name: 'model', type: 'STRING', mode: 'NULLABLE' }
  ],
  plans: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'month', type: 'INT64', mode: 'REQUIRED' },
    { name: 'year', type: 'INT64', mode: 'REQUIRED' },
    { name: 'budget', type: 'FLOAT64', mode: 'REQUIRED' },
    { name: 'strategy', type: 'STRING', mode: 'REQUIRED' },
    { name: 'createdAt', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  allocations: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'planId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'accountId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'amount', type: 'FLOAT64', mode: 'REQUIRED' },
    { name: 'rationale', type: 'STRING', mode: 'REQUIRED' },
    { name: 'dueBy', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'willReport0', type: 'BOOL', mode: 'REQUIRED' }
  ]
}

// Database operations
export class BigQueryDB {
  private dataset: string

  constructor(dataset?: string) {
    this.dataset = dataset || process.env.GOOGLE_CLOUD_DATASET || 'mymoney'
  }

  // Getter for dataset name
  get datasetName(): string {
    return this.dataset
  }

  // Initialize database and create tables
  async initialize() {
    try {
      // Create dataset if it doesn't exist
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'US'
      await bigquery.createDataset(this.dataset, { location })
      console.log(`Dataset ${this.dataset} created or already exists`)
    } catch (error) {
      console.log(`Dataset ${this.dataset} already exists`)
    }

    // Create all tables
    for (const [tableName, schema] of Object.entries(SCHEMAS)) {
      await this.createTable(tableName, schema)
    }
  }

  private async createTable(tableName: string, schema: any[]) {
    try {
      const table = bigquery.dataset(this.dataset).table(tableName)
      await table.create({
        schema: {
          fields: schema
        }
      })
      console.log(`Table ${tableName} created successfully`)
    } catch (error: any) {
      if (error.code === 409) {
        console.log(`Table ${tableName} already exists`)
      } else {
        console.error(`Error creating table ${tableName}:`, error)
      }
    }
  }

  // Generic query method
  async query(sql: string, params?: any[]) {
    const options: any = {
      query: sql,
      useLegacySql: false
    }

    // Only add params if they exist and are not null
    if (params && params.length > 0) {
      const validParams = params.filter(param => param !== null && param !== undefined)
      if (validParams.length > 0) {
        options.params = validParams
      }
    }

    const [job] = await bigquery.createQueryJob(options)
    const [rows] = await job.getQueryResults()
    return rows
  }

  // Generic insert method
  async insert(tableName: string, data: any[]) {
    const table = bigquery.dataset(this.dataset).table(tableName)
    await table.insert(data)
  }

  // Generic update method
  async update(tableName: string, data: any, where: any) {
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = ?`)
      .join(', ')
    
    const whereClause = Object.keys(where)
      .map((key, index) => `${key} = ?`)
      .join(' AND ')

    const sql = `UPDATE \`${this.dataset}.${tableName}\` SET ${setClause} WHERE ${whereClause}`
    
    const setValues = Object.values(data)
    const whereValues = Object.values(where)
    const params = [...setValues, ...whereValues]
    
    await this.query(sql, params)
  }

  // Generic delete method
  async delete(tableName: string, where: any) {
    const whereClause = Object.keys(where)
      .map((key, index) => `${key} = ?`)
      .join(' AND ')

    const sql = `DELETE FROM \`${this.dataset}.${tableName}\` WHERE ${whereClause}`
    
    const params = Object.values(where)
    await this.query(sql, params)
  }

  // Generic findMany method
  async findMany(tableName: string, options: {
    where?: any
    orderBy?: { [key: string]: 'asc' | 'desc' }
    take?: number
    skip?: number
    include?: any
  } = {}) {
    let sql = `SELECT * FROM \`${this.dataset}.${tableName}\``
    const params: any[] = []

    // Add WHERE clause
    if (options.where) {
      const whereClause = Object.keys(options.where)
        .map((key, index) => `${key} = ?`)
        .join(' AND ')
      sql += ` WHERE ${whereClause}`
      params.push(...Object.values(options.where))
    }

    // Add ORDER BY clause
    if (options.orderBy) {
      const orderClause = Object.entries(options.orderBy)
        .map(([key, direction]) => `${key} ${direction.toUpperCase()}`)
        .join(', ')
      sql += ` ORDER BY ${orderClause}`
    }

    // Add LIMIT clause
    if (options.take) {
      sql += ` LIMIT ${options.take}`
    }

    // Add OFFSET clause
    if (options.skip) {
      sql += ` OFFSET ${options.skip}`
    }

    return await this.query(sql, params)
  }

  // Generic findUnique method
  async findUnique(tableName: string, where: any) {
    const results = await this.findMany(tableName, { where, take: 1 })
    return results[0] || null
  }

  // Generic findFirst method
  async findFirst(tableName: string, where: any) {
    const results = await this.findMany(tableName, { where, take: 1 })
    return results[0] || null
  }

  // Generic create method
  async create(tableName: string, data: any) {
    const fields = Object.keys(data)
    const values = Object.values(data)
    
    // Filter out null/undefined values and their corresponding fields
    const validFields: string[] = []
    const validValues: any[] = []
    
    for (let i = 0; i < fields.length; i++) {
      if (values[i] !== null && values[i] !== undefined) {
        validFields.push(fields[i])
        validValues.push(values[i])
      }
    }
    
    if (validFields.length === 0) {
      throw new Error('No valid fields to insert')
    }
    
    const placeholders = validValues.map(() => '?').join(', ')
    const sql = `INSERT INTO \`${this.dataset}.${tableName}\` (${validFields.join(', ')}) VALUES (${placeholders})`
    
    await this.query(sql, validValues)
    return data
  }

  // Generic upsert method
  async upsert(tableName: string, data: any, where: any) {
    const existing = await this.findUnique(tableName, where)
    if (existing) {
      await this.update(tableName, data, where)
      return existing
    } else {
      return await this.create(tableName, data)
    }
  }
}

// Export singleton instance
export const bigqueryDB = new BigQueryDB()

// Export for backward compatibility
export const db = bigqueryDB
