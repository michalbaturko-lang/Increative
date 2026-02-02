import { NextRequest, NextResponse } from 'next/server'
import { createMeshyClient } from '@/lib/meshy'

export async function POST(request: NextRequest) {
  const client = createMeshyClient()

  if (!client) {
    return NextResponse.json({
      success: false,
      error: 'MESHY_API_KEY není nakonfigurován',
    }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { action, prompt, imageUrls, model, negativePrompt, taskId, taskType } = body

    switch (action) {
      case 'text-to-image': {
        // Generate image from text
        if (!prompt) {
          return NextResponse.json({ success: false, error: 'prompt je povinný' }, { status: 400 })
        }

        const result = await client.textToImage({
          prompt,
          model: model || 'nano-banana',
          negativePrompt,
        })

        return NextResponse.json({
          success: true,
          taskId: result.taskId,
          message: 'Task vytvořen. Použij action=status pro kontrolu průběhu.',
        })
      }

      case 'image-to-image': {
        // Transform existing image
        if (!prompt) {
          return NextResponse.json({ success: false, error: 'prompt je povinný' }, { status: 400 })
        }
        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
          return NextResponse.json({ success: false, error: 'imageUrls je povinný (pole 1-5 URL)' }, { status: 400 })
        }

        const result = await client.imageToImage({
          prompt,
          referenceImageUrls: imageUrls,
          model: model || 'nano-banana',
          negativePrompt,
        })

        return NextResponse.json({
          success: true,
          taskId: result.taskId,
          message: 'Task vytvořen. Použij action=status pro kontrolu průběhu.',
        })
      }

      case 'status': {
        // Check task status
        if (!taskId) {
          return NextResponse.json({ success: false, error: 'taskId je povinný' }, { status: 400 })
        }

        const status = await client.getTaskStatus(taskId, taskType || 'text-to-image')

        return NextResponse.json({
          success: true,
          ...status,
        })
      }

      case 'generate': {
        // Generate and wait for result (synchronous)
        if (!prompt) {
          return NextResponse.json({ success: false, error: 'prompt je povinný' }, { status: 400 })
        }

        const imageUrl = await client.generateImage(prompt, {
          model: model || 'nano-banana',
          negativePrompt,
        })

        return NextResponse.json({
          success: true,
          imageUrl,
        })
      }

      case 'transform': {
        // Transform image and wait for result (synchronous)
        if (!prompt) {
          return NextResponse.json({ success: false, error: 'prompt je povinný' }, { status: 400 })
        }
        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
          return NextResponse.json({ success: false, error: 'imageUrls je povinný' }, { status: 400 })
        }

        const imageUrl = await client.transformImage(imageUrls, prompt, {
          model: model || 'nano-banana',
          negativePrompt,
        })

        return NextResponse.json({
          success: true,
          imageUrl,
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Neplatná akce. Použij: text-to-image, image-to-image, status, generate, transform',
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Meshy API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Neznámá chyba',
    }, { status: 500 })
  }
}
