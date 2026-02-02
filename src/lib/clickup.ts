/**
 * ClickUp API Integration
 * Documentation: https://developer.clickup.com/docs/authentication
 *
 * Hierarchy: Workspace → Space → Folder → List → Task
 */

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2'

interface ClickUpConfig {
  apiKey: string
}

// Types
export interface ClickUpWorkspace {
  id: string
  name: string
  color: string
  avatar: string | null
  members: { user: { id: number; username: string; email: string } }[]
}

export interface ClickUpSpace {
  id: string
  name: string
  private: boolean
  statuses: { status: string; color: string }[]
}

export interface ClickUpList {
  id: string
  name: string
  content: string
  status: { status: string; color: string }
  task_count: number
}

export interface ClickUpTask {
  id: string
  name: string
  description: string
  status: { status: string; color: string }
  priority: { priority: string; color: string } | null
  assignees: { id: number; username: string; email: string; profilePicture: string }[]
  due_date: string | null
  start_date: string | null
  time_estimate: number | null
  url: string
  list: { id: string; name: string }
  folder: { id: string; name: string }
  space: { id: string }
  date_created: string
  date_updated: string
}

export interface ClickUpTasksResponse {
  tasks: ClickUpTask[]
}

class ClickUpClient {
  private apiKey: string

  constructor(config: ClickUpConfig) {
    this.apiKey = config.apiKey
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${CLICKUP_API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`ClickUp API Error: ${response.status} - ${error.err || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get all workspaces (teams) the user has access to
   */
  async getWorkspaces(): Promise<{ teams: ClickUpWorkspace[] }> {
    return this.request('/team')
  }

  /**
   * Get all spaces in a workspace
   */
  async getSpaces(workspaceId: string): Promise<{ spaces: ClickUpSpace[] }> {
    return this.request(`/team/${workspaceId}/space`)
  }

  /**
   * Get all lists in a space (includes folderless lists)
   */
  async getLists(spaceId: string): Promise<{ lists: ClickUpList[] }> {
    return this.request(`/space/${spaceId}/list`)
  }

  /**
   * Get all folder lists in a space
   */
  async getFolderLists(folderId: string): Promise<{ lists: ClickUpList[] }> {
    return this.request(`/folder/${folderId}/list`)
  }

  /**
   * Get tasks from a list
   */
  async getTasks(listId: string, options?: {
    archived?: boolean
    page?: number
    subtasks?: boolean
    statuses?: string[]
  }): Promise<ClickUpTasksResponse> {
    const params = new URLSearchParams()
    if (options?.archived !== undefined) params.set('archived', String(options.archived))
    if (options?.page !== undefined) params.set('page', String(options.page))
    if (options?.subtasks !== undefined) params.set('subtasks', String(options.subtasks))
    if (options?.statuses) options.statuses.forEach(s => params.append('statuses[]', s))

    const queryString = params.toString()
    return this.request(`/list/${listId}/task${queryString ? `?${queryString}` : ''}`)
  }

  /**
   * Get a single task by ID
   */
  async getTask(taskId: string): Promise<ClickUpTask> {
    return this.request(`/task/${taskId}`)
  }

  /**
   * Get all tasks across all workspaces (convenience method)
   * This fetches the hierarchy and returns tasks from all lists
   */
  async getAllTasks(): Promise<{
    workspaces: ClickUpWorkspace[]
    tasks: ClickUpTask[]
    summary: {
      totalTasks: number
      byStatus: Record<string, number>
      byPriority: Record<string, number>
    }
  }> {
    // Get workspaces
    const { teams: workspaces } = await this.getWorkspaces()
    const allTasks: ClickUpTask[] = []

    for (const workspace of workspaces) {
      // Get spaces
      const { spaces } = await this.getSpaces(workspace.id)

      for (const space of spaces) {
        // Get lists in space
        const { lists } = await this.getLists(space.id)

        for (const list of lists) {
          // Get tasks in list
          try {
            const { tasks } = await this.getTasks(list.id, { archived: false })
            allTasks.push(...tasks)
          } catch (e) {
            console.error(`Failed to get tasks from list ${list.id}:`, e)
          }
        }
      }
    }

    // Calculate summary
    const byStatus: Record<string, number> = {}
    const byPriority: Record<string, number> = {}

    for (const task of allTasks) {
      const status = task.status?.status || 'unknown'
      byStatus[status] = (byStatus[status] || 0) + 1

      const priority = task.priority?.priority || 'none'
      byPriority[priority] = (byPriority[priority] || 0) + 1
    }

    return {
      workspaces,
      tasks: allTasks,
      summary: {
        totalTasks: allTasks.length,
        byStatus,
        byPriority,
      },
    }
  }
}

// Factory function
export function createClickUpClient(apiKey?: string): ClickUpClient | null {
  const key = apiKey || process.env.CLICKUP_API_KEY
  if (!key) {
    return null
  }
  return new ClickUpClient({ apiKey: key })
}

// Default export for convenience
export default ClickUpClient
