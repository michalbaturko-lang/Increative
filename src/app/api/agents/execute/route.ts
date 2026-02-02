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

    // Build context
    const context = clientName
      ? `Klient: ${clientName}\nPriorita: ${priority}`
      : `Priorita: ${priority}`

    // Execute the task with intelligent Agent <-> Supervisor loop
    const result = await executeAgentTask({
      agentType,
      task: `${title}\n\n${description}`,
      context,
    })

    // Determine final status
    const status = result.success ? 'completed' : 'failed'

    // Save task to Supabase
    try {
      const supabase = createServerClient()
      await supabase.from('tasks').insert({
        type: taskType,
        title,
        description,
        status,
        priority,
        client_name: clientName || null,
        agent_type: agentType,
        output: result.output,
        feedback: result.supervisorFeedback || null,
        needs_review: false,
        metadata: {
          iterations: result.iterations,
          supervisorFeedback: result.supervisorFeedback,
        },
      })
    } catch (dbError) {
      console.error('Failed to save task to database:', dbError)
      // Continue - don't fail the whole request if DB save fails
    }

    return NextResponse.json({
      success: result.success,
      status,
      output: result.output,
      iterations: result.iterations,
      supervisorFeedback: result.supervisorFeedback,
      // These are no longer used in new workflow, but keep for compatibility
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
