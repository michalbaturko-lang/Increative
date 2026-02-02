import { NextRequest } from 'next/server'
import { createMeshyClient } from '@/lib/meshy'

/**
 * SSE Streaming endpoint for Meshy task progress
 *
 * Usage: GET /api/tools/meshy/stream?taskId=xxx&taskType=image-to-3d
 *
 * Streams progress updates in real-time until task completes or fails
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const taskId = searchParams.get('taskId')
  const taskType = searchParams.get('taskType') || 'text-to-image'

  if (!taskId) {
    return new Response('taskId je povinný', { status: 400 })
  }

  const client = createMeshyClient()

  if (!client) {
    return new Response('MESHY_API_KEY není nakonfigurován', { status: 500 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const maxAttempts = 100 // 5 minutes with 3s interval
        let attempts = 0

        while (attempts < maxAttempts) {
          attempts++

          let status
          if (taskType === 'image-to-3d') {
            status = await client.get3DTaskStatus(taskId)
          } else {
            status = await client.getTaskStatus(taskId, taskType as 'text-to-image' | 'image-to-image')
          }

          // Send progress update
          sendEvent('progress', {
            taskId,
            status: status.status,
            progress: status.progress,
          })

          if (status.status === 'SUCCEEDED') {
            // Send final result
            if (taskType === 'image-to-3d') {
              sendEvent('complete', {
                taskId,
                status: 'SUCCEEDED',
                modelUrls: (status as { model_urls?: unknown }).model_urls,
                thumbnailUrl: (status as { thumbnail_url?: string }).thumbnail_url,
                textureUrls: (status as { texture_urls?: unknown }).texture_urls,
              })
            } else {
              sendEvent('complete', {
                taskId,
                status: 'SUCCEEDED',
                result: (status as { result?: string }).result,
              })
            }
            break
          }

          if (status.status === 'FAILED' || status.status === 'CANCELED') {
            sendEvent('error', {
              taskId,
              status: status.status,
              error: status.error || 'Task failed',
            })
            break
          }

          // Wait before next poll (3s for 3D, 2s for images)
          const waitTime = taskType === 'image-to-3d' ? 3000 : 2000
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }

        if (attempts >= maxAttempts) {
          sendEvent('error', {
            taskId,
            status: 'TIMEOUT',
            error: 'Task polling timed out',
          })
        }
      } catch (error) {
        sendEvent('error', {
          taskId,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
