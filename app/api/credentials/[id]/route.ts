import { NextRequest, NextResponse } from 'next/server'
import { bigqueryDB } from '@/lib/bigquery'
import { vault } from '@/lib/crypto-vault'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!vault.isUnlocked()) {
      return NextResponse.json(
        { error: 'Vault is locked. Please unlock it first.' },
        { status: 401 }
      )
    }

    const { id } = params

    await bigqueryDB.update('credentials', {
      isActive: false,
      updatedAt: new Date().toISOString()
    }, {
      id
    })

    return NextResponse.json({
      success: true,
      message: 'Credential deleted successfully'
    })
  } catch (error) {
    console.error('Delete credential error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to delete credential: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!vault.isUnlocked()) {
      return NextResponse.json(
        { error: 'Vault is locked. Please unlock it first.' },
        { status: 401 }
      )
    }

    const { id } = params

    const credential = await bigqueryDB.query(`
      SELECT 
        c.*,
        i.name as institutionName,
        i.kind as institutionKind
      FROM \`mymoney.credentials\` c
      JOIN \`mymoney.institutions\` i ON c.institutionId = i.id
      WHERE c.id = @credentialId AND c.isActive = true
    `, [id])

    if (!credential || credential.length === 0) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    const cred = credential[0]

    // Decrypt sensitive data for authorized access
    const decryptedUsername = await vault.decrypt(cred.username)
    const decryptedPassword = await vault.decrypt(cred.password)
    const decryptedSecurityQA = cred.securityQA 
      ? await vault.decrypt(cred.securityQA)
      : null

    // Update last used timestamp
    await bigqueryDB.update('credentials', {
      lastUsed: new Date().toISOString()
    }, {
      id
    })

    return NextResponse.json({
      id: cred.id,
      institutionId: cred.institutionId,
      institutionName: cred.institutionName,
      institutionKind: cred.institutionKind,
      username: decryptedUsername,
      password: decryptedPassword,
      securityQA: decryptedSecurityQA,
      notes: cred.notes
    })
  } catch (error) {
    console.error('Get credential error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to retrieve credential: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    )
  }
}