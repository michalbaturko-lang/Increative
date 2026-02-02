import { NextRequest, NextResponse } from 'next/server'
import { executeAgentTask, AgentType } from '@/lib/claude'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskType, title, description, clientName, priority } = body

    // Map task type to agent type
    const agentTypeMap: Record<string, AgentType> = {
      content_creation: 'content_writer',
      seo_audit: 'seo_analyst',
      competitor_analysis: 'analyst',
      ads_campaign: 'ads_specialist',
      strategy_creation: 'analyst',
      client_analysis: 'analyst',
      report_generation: 'analyst',
      mvp_creation: 'content_writer',
      social_media: 'social_media',
      email_marketing: 'email_marketing',
      web_development: 'web_developer',
      custom: 'content_writer',
    }

    const agentType = agentTypeMap[taskType] || 'content_writer'
    const supabase = createServerClient()
    let dbError: string | null = null

    // STEP 1: Save task IMMEDIATELY with 'processing' status
    let taskId: string | null = null
    try {
      const { data: newTask, error } = await supabase.from('tasks').insert({
        type: taskType,
        title,
        description,
        status: 'processing',
        priority,
        client_name: clientName || null,
        agent_type: agentType,
        output: null,
        feedback: null,
        needs_review: false,
      }).select('id').single()

      if (error) {
        console.error('Failed to create task:', error)
        dbError = `DB Error: ${error.message}`
      } else {
        taskId = newTask.id
      }
    } catch (err) {
      console.error('Failed to save task to database:', err)
      dbError = `DB Exception: ${err instanceof Error ? err.message : 'Unknown'}`
    }

    // If we couldn't save the task, return error immediately
    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: dbError || 'Nepodařilo se uložit úkol do databáze. Zkontrolujte SUPABASE_SERVICE_ROLE_KEY.',
      }, { status: 500 })
    }

    // Build context
    const context = clientName
      ? `Klient: ${clientName}\nPriorita: ${priority}`
      : `Priorita: ${priority}`

    // STEP 2: Execute the task with intelligent Agent <-> Supervisor loop
    const result = await executeAgentTask({
      agentType,
      task: `${title}\n\n${description}`,
      context,
    })

    // Determine final status
    const status = result.success ? 'completed' : 'failed'

    // STEP 3: Update task with result
    if (taskId) {
      try {
        await supabase.from('tasks').update({
          status,
          output: result.output,
          feedback: result.supervisorFeedback || null,
          metadata: {
            iterations: result.iterations,
            supervisorFeedback: result.supervisorFeedback,
          },
        }).eq('id', taskId)
      } catch (dbError) {
        console.error('Failed to update task:', dbError)
      }
    }

    return NextResponse.json({
      success: result.success,
      status,
      taskId,
      output: result.output,
      iterations: result.iterations,
      supervisorFeedback: result.supervisorFeedback,
      needsHumanInput: false,
      approved: true,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
