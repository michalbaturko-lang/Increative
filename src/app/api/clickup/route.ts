import { NextRequest, NextResponse } from 'next/server'
import { createClickUpClient } from '@/lib/clickup'

export async function GET(request: NextRequest) {
  const client = createClickUpClient()

  if (!client) {
    return NextResponse.json({
      success: false,
      error: 'ClickUp API key není nakonfigurován. Přidejte CLICKUP_API_KEY do environment variables.',
    }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'summary'

  try {
    switch (action) {
      case 'workspaces': {
        const data = await client.getWorkspaces()
        return NextResponse.json({ success: true, ...data })
      }

      case 'spaces': {
        const workspaceId = searchParams.get('workspaceId')
        if (!workspaceId) {
          return NextResponse.json({ success: false, error: 'workspaceId is required' }, { status: 400 })
        }
        const data = await client.getSpaces(workspaceId)
        return NextResponse.json({ success: true, ...data })
      }

      case 'lists': {
        const spaceId = searchParams.get('spaceId')
        if (!spaceId) {
          return NextResponse.json({ success: false, error: 'spaceId is required' }, { status: 400 })
        }
        const data = await client.getLists(spaceId)
        return NextResponse.json({ success: true, ...data })
      }

      case 'tasks': {
        const listId = searchParams.get('listId')
        if (!listId) {
          return NextResponse.json({ success: false, error: 'listId is required' }, { status: 400 })
        }
        const data = await client.getTasks(listId, { archived: false })
        return NextResponse.json({ success: true, ...data })
      }

      case 'all':
      case 'summary':
      default: {
        // Get everything - tasks from all workspaces
        const data = await client.getAllTasks()
        return NextResponse.json({ success: true, ...data })
      }
    }
  } catch (error) {
    console.error('ClickUp API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
