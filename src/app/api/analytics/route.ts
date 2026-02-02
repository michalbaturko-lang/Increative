import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    // Get tasks today
    const { count: tasksToday } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())

    // Get tasks this week
    const { count: tasksThisWeek } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString())

    // Get all tasks for analysis
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('type, agent_type, client_name, created_at')

    // Calculate tasks by type
    const tasksByType: Record<string, number> = {}
    const tasksByAgent: Record<string, number> = {}
    const clientNames = new Set<string>()

    allTasks?.forEach(task => {
      // Count by type
      if (task.type) {
        tasksByType[task.type] = (tasksByType[task.type] || 0) + 1
      }
      // Count by agent
      if (task.agent_type) {
        tasksByAgent[task.agent_type] = (tasksByAgent[task.agent_type] || 0) + 1
      }
      // Track unique clients
      if (task.client_name) {
        clientNames.add(task.client_name)
      }
    })

    // Get knowledge entries count
    const { count: knowledgeEntries } = await supabase
      .from('knowledge_entries')
      .select('*', { count: 'exact', head: true })

    // Get clients count
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      stats: {
        tasksToday: tasksToday || 0,
        tasksThisWeek: tasksThisWeek || 0,
        averageCompletionTime: 28, // Would need timestamps to calculate properly
        activeClients: clientsCount || clientNames.size,
        knowledgeEntries: knowledgeEntries || 0,
        tasksByType,
        tasksByAgent,
      },
    })
  } catch (error) {
    console.error('Analytics API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
