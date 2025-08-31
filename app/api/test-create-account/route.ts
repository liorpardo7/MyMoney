import { NextRequest, NextResponse } from 'next/server'
import { BigQuery } from '@google-cloud/bigquery'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { displayName, type, last4, institutionId, creditLimit, apr } = body

    console.log('Creating test account with data:', body)

    // Initialize BigQuery client directly
    const bigquery = new BigQuery({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'mymoney-470619',
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || join(process.cwd(), 'mymoney-470619-2f22e813a9d7.json')
    })

    // Generate unique ID
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    // Create account with no null values
    const accountData = {
      id: accountId,
      institutionId,
      type,
      displayName,
      last4: last4 || '',
      currency: 'USD',
      openedAt: now,
      closedAt: now, // Use current date instead of null
      creditLimit: creditLimit || 0,
      originalPrincipal: 0, // Use 0 instead of null
      termMonths: 0, // Use 0 instead of null
      secured: false,
      createdAt: now,
      updatedAt: now
    }

    console.log('Account data to insert:', accountData)

    try {
      // Use direct BigQuery table insert
      const table = bigquery.dataset('mymoney').table('accounts')
      await table.insert([accountData])
      console.log('Account created successfully')
    } catch (createError) {
      console.error('Failed to create account:', createError)
      return NextResponse.json(
        { error: `Failed to create account: ${createError instanceof Error ? createError.message : String(createError)}` },
        { status: 500 }
      )
    }

    // Try to create institution
    try {
      const instTable = bigquery.dataset('mymoney').table('institutions')
      await instTable.insert([{
        id: institutionId,
        name: institutionId,
        kind: institutionId,
        website: '',
        createdAt: now
      }])
      console.log('Institution created successfully')
    } catch (instError) {
      console.log('Institution creation skipped (might already exist):', instError)
    }

    // Try to create APR history
    if (apr && type === 'CARD') {
      try {
        const aprTable = bigquery.dataset('mymoney').table('aprHistory')
        await aprTable.insert([{
          id: `apr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          accountId,
          aprType: 'PURCHASE',
          aprPct: apr,
          effective: now
        }])
        console.log('APR history created successfully')
      } catch (aprError) {
        console.error('Failed to create APR history:', aprError)
      }
    }

    // Try to create limit history
    if (creditLimit && type === 'CARD') {
      try {
        const limitTable = bigquery.dataset('mymoney').table('limitHistory')
        await limitTable.insert([{
          id: `limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          accountId,
          limit: creditLimit,
          effective: now
        }])
        console.log('Limit history created successfully')
      } catch (limitError) {
        console.error('Failed to create limit history:', limitError)
      }
    }

    return NextResponse.json({
      success: true,
      account: accountData,
      message: 'Test account created successfully'
    })
  } catch (error) {
    console.error('Test create account error:', error)
    return NextResponse.json(
      { error: `Failed to create test account: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
