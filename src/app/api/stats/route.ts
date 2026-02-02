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

    // Get unique clients this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const { data: clientsData } = await supabase
      .from('tasks')
      .select('client_name')
      .gte('created_at', monthStart.toISOString())
      .not('client_name', 'is', null)

    const uniqueClients = new Set(clientsData?.map(t => t.client_name) || []).size

    // Get knowledge entries count
    const { count: knowledgeEntries } = await supabase
      .from('knowledge_entries')
      .select('*', { count: 'exact', head: true })

    // Get recent tasks for the queue
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get tasks needing review
    const { data: pendingReview } = await supabase
      .from('tasks')
      .select('*')
      .eq('needs_review', true)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      stats: {
        tasksToday: tasksToday || 0,
        tasksThisWeek: tasksThisWeek || 0,
        averageCompletionTime: 28, // Will calculate later when we have more data
        activeClients: uniqueClients,
        opportunitiesDetected: 0, // Will implement with opportunities table
        knowledgeEntries: knowledgeEntries || 0,
      },
      recentTasks: recentTasks || [],
      pendingReview: pendingReview || [],
    })
  } catch (error) {
    console.error('Stats API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
