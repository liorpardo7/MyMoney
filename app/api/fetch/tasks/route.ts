import { NextResponse } from 'next/server'

// Mock fetch tasks for demo - in production this would come from a job queue
export async function GET() {
  try {
    // TODO: Implement real task queue system
    // For now, return empty array until we have real fetch tasks
    return NextResponse.json([])
  } catch (error) {
    console.error('Fetch tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}