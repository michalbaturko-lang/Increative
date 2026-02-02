import { NextRequest, NextResponse } from 'next/server'
import { createClickUpClient } from '@/lib/clickup'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const client = createClickUpClient()

  if (!client) {
    return NextResponse.json({
      success: false,
      error: 'ClickUp API key není nakonfigurován. Přidejte CLICKUP_API_KEY do environment variables.',
    }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'structure'

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

      case 'folders': {
        const spaceId = searchParams.get('spaceId')
        if (!spaceId) {
          return NextResponse.json({ success: false, error: 'spaceId is required' }, { status: 400 })
        }
        const data = await client.getFolders(spaceId)
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

      case 'folder-tasks': {
        // Get all tasks from all lists in a folder
        const folderId = searchParams.get('folderId')
        if (!folderId) {
          return NextResponse.json({ success: false, error: 'folderId is required' }, { status: 400 })
        }
        const { lists } = await client.getFolderLists(folderId)
        const allTasks: unknown[] = []
        for (const list of lists) {
          try {
            const { tasks } = await client.getTasks(list.id, { archived: false })
            allTasks.push(...tasks)
          } catch (e) {
            console.error(`Failed to get tasks from list ${list.id}:`, e)
          }
        }
        return NextResponse.json({ success: true, tasks: allTasks })
      }

      case 'recent': {
        // Get 30 most recent tasks across all folders (non-completed)
        const limit = parseInt(searchParams.get('limit') || '30')
        const { teams: workspaces } = await client.getWorkspaces()

        interface RecentTask {
          id: string
          name: string
          description?: string
          status: { status: string; color: string }
          priority: { priority: string; color: string } | null
          assignees: { username: string; email: string }[]
          due_date: string | null
          date_created: string
          date_updated: string
          url: string
          list: { id: string; name: string }
          folder: { id: string; name: string }
        }

        const allTasks: RecentTask[] = []

        for (const workspace of workspaces) {
          const { spaces } = await client.getSpaces(workspace.id)
          for (const space of spaces) {
            const { folders } = await client.getFolders(space.id)
            for (const folder of folders) {
              const listsToFetch = folder.lists || []
              if (listsToFetch.length === 0) {
                try {
                  const { lists } = await client.getFolderLists(folder.id)
                  listsToFetch.push(...lists)
                } catch {}
              }

              for (const list of listsToFetch) {
                try {
                  const { tasks } = await client.getTasks(list.id, { archived: false })
                  // Filter out completed tasks and add to array
                  for (const task of tasks) {
                    const status = task.status?.status?.toLowerCase() || ''
                    if (!status.includes('complete') && !status.includes('done') && !status.includes('closed')) {
                      allTasks.push(task as RecentTask)
                    }
                  }
                } catch {}
              }
            }
          }
        }

        // Sort by date_created descending (newest first)
        allTasks.sort((a, b) => {
          const dateA = parseInt(a.date_created) || 0
          const dateB = parseInt(b.date_created) || 0
          return dateB - dateA
        })

        // Return top N
        const recentTasks = allTasks.slice(0, limit)

        return NextResponse.json({
          success: true,
          tasks: recentTasks,
          total: allTasks.length,
        })
      }

      case 'structure':
      default: {
        // Get only structure (workspaces, spaces, folders) - no tasks
        const { teams: workspaces } = await client.getWorkspaces()
        const structure: {
          workspaces: typeof workspaces
          spaces: { id: string; name: string; workspaceId: string }[]
          folders: { id: string; name: string; spaceId: string; taskCount?: number }[]
        } = {
          workspaces,
          spaces: [],
          folders: [],
        }

        for (const workspace of workspaces) {
          const { spaces } = await client.getSpaces(workspace.id)
          for (const space of spaces) {
            structure.spaces.push({
              id: space.id,
              name: space.name,
              workspaceId: workspace.id,
            })

            const { folders } = await client.getFolders(space.id)
            for (const folder of folders) {
              // Calculate task count from lists if available
              const taskCount = folder.lists?.reduce((sum, list) => sum + (list.task_count || 0), 0) || 0
              structure.folders.push({
                id: folder.id,
                name: folder.name,
                spaceId: space.id,
                taskCount,
              })
            }
          }
        }

        return NextResponse.json({
          success: true,
          ...structure,
          summary: {
            totalClients: structure.folders.length,
            totalWorkspaces: structure.workspaces.length,
          }
        })
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
