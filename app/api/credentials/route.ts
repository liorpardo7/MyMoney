import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'
import { vault } from '@/lib/crypto-vault'
import { z } from 'zod'

const CredentialSchema = z.object({
  institutionId: z.string(),
  username: z.string(),
  password: z.string(),
  securityQA: z.string().optional(),
  notes: z.string().optional()
})

export async function GET() {
  try {
    if (!vault.isUnlocked()) {
      return NextResponse.json(
        { error: 'Vault is locked. Please unlock it first.' },
        { status: 401 }
      )
    }

    // Get credentials with institution data
    const credentials = await bigqueryDB.query(`
      SELECT 
        c.id,
        c.institutionId,
        i.name as institutionName,
        i.kind as institutionKind,
        c.username,
        c.hasPassword,
        c.hasSecurityQA,
        c.notes,
        c.lastUsed,
        c.createdAt
      FROM \`mymoney.credentials\` c
      JOIN \`mymoney.institutions\` i ON c.institutionId = i.id
      WHERE c.isActive = true
      ORDER BY c.createdAt DESC
    `)

    // Return credentials without sensitive data
    const safeCredentials = credentials.map((cred: any) => ({
      id: cred.id,
      institutionId: cred.institutionId,
      institutionName: cred.institutionName,
      institutionKind: cred.institutionKind,
      username: cred.username ? '***' : null, // Mask username
      hasPassword: !!cred.hasPassword,
      hasSecurityQA: !!cred.hasSecurityQA,
      notes: cred.notes,
      lastUsed: cred.lastUsed,
      createdAt: cred.createdAt
    }))

    return NextResponse.json(safeCredentials)
  } catch (error) {
    console.error('Get credentials error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!vault.isUnlocked()) {
      return NextResponse.json(
        { error: 'Vault is locked. Please unlock it first.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = CredentialSchema.parse(body)

    // Encrypt sensitive data
    const encryptedUsername = await vault.encrypt(validatedData.username)
    const encryptedPassword = await vault.encrypt(validatedData.password)
    const encryptedSecurityQA = validatedData.securityQA 
      ? await vault.encrypt(validatedData.securityQA)
      : null

    // Check if credential already exists for this institution
    const existingCredential = await bigqueryDB.findFirst('credentials', {
      institutionId: validatedData.institutionId,
      isActive: true
    })

    if (existingCredential) {
      // Update existing credential
      const updatedCredential = await bigqueryDB.update('credentials', {
        username: encryptedUsername,
        password: encryptedPassword,
        securityQA: encryptedSecurityQA,
        notes: validatedData.notes,
        updatedAt: new Date().toISOString()
      }, {
        id: existingCredential.id
      })

      return NextResponse.json({
        success: true,
        message: 'Credential updated successfully',
        credentialId: existingCredential.id
      })
    } else {
      // Create new credential
      const newCredential = await bigqueryDB.create('credentials', {
        id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        institutionId: validatedData.institutionId,
        username: encryptedUsername,
        password: encryptedPassword,
        securityQA: encryptedSecurityQA,
        notes: validatedData.notes,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: 'Credential saved successfully',
        credentialId: newCredential.id
      })
    }
  } catch (error) {
    console.error('Save credential error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to save credential: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    )
  }
}