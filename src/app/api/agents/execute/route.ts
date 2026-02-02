import { NextRequest, NextResponse } from 'next/server'
import { executeAgentTask, supervisorReview, AgentType } from '@/lib/claude'
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
      mvp_creation: 'content_writer', // Will be expanded later
      custom: 'content_writer',
    }

    const agentType = agentTypeMap[taskType] || 'content_writer'

    // Build context
    const context = clientName
      ? `Klient: ${clientName}\nPriorita: ${priority}`
      : `Priorita: ${priority}`

    // Execute the task
    const result = await executeAgentTask({
      agentType,
      task: `${title}\n\n${description}`,
      context,
    })

    // If agent needs human input, return early (don't save yet)
    if (result.needsHumanInput) {
      return NextResponse.json({
        success: true,
        status: 'needs_input',
        question: result.question,
      })
    }

    // Have supervisor review the output
    const review = await supervisorReview({
      originalTask: `${title}\n\n${description}`,
      agentOutput: result.output,
      agentType,
    })

    const finalOutput = review.improvedOutput || result.output
    const status = review.approved ? 'completed' : 'needs_review'

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
        output: finalOutput,
        feedback: review.feedback || null,
        needs_review: !review.approved,
      })
    } catch (dbError) {
      console.error('Failed to save task to database:', dbError)
      // Continue - don't fail the whole request if DB save fails
    }

    return NextResponse.json({
      success: result.success,
      status,
      output: finalOutput,
      feedback: review.feedback,
      approved: review.approved,
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
