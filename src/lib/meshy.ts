/**
 * Meshy AI API Integration
 *
 * Text to Image & Image to Image generation
 * Docs: https://docs.meshy.ai/en/api/text-to-image
 */

const MESHY_API_URL = 'https://api.meshy.ai/openapi/v1'

interface MeshyConfig {
  apiKey: string
}

export interface MeshyTaskResponse {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED'
  progress: number
  result?: string // URL of generated image
  error?: string
}

export interface TextToImageParams {
  prompt: string
  negativePrompt?: string
  model?: 'nano-banana' | 'nano-banana-pro'
  multiView?: boolean
}

export interface ImageToImageParams {
  prompt: string
  referenceImageUrls: string[] // 1-5 images, supports jpg, jpeg, png
  negativePrompt?: string
  model?: 'nano-banana' | 'nano-banana-pro'
  multiView?: boolean
}

class MeshyClient {
  private apiKey: string

  constructor(config: MeshyConfig) {
    this.apiKey = config.apiKey
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${MESHY_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Meshy API Error: ${response.status} - ${error.message || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Generate image from text prompt
   */
  async textToImage(params: TextToImageParams): Promise<{ taskId: string }> {
    const result = await this.request<{ result: string }>('/text-to-image', {
      method: 'POST',
      body: JSON.stringify({
        ai_model: params.model || 'nano-banana',
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        multi_view: params.multiView || false,
      }),
    })

    return { taskId: result.result }
  }

  /**
   * Transform/edit image based on prompt
   * Great for: putting products in different environments
   */
  async imageToImage(params: ImageToImageParams): Promise<{ taskId: string }> {
    const result = await this.request<{ result: string }>('/image-to-image', {
      method: 'POST',
      body: JSON.stringify({
        ai_model: params.model || 'nano-banana',
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        reference_image_urls: params.referenceImageUrls,
        multi_view: params.multiView || false,
      }),
    })

    return { taskId: result.result }
  }

  /**
   * Check task status (Meshy uses async execution)
   */
  async getTaskStatus(taskId: string, taskType: 'text-to-image' | 'image-to-image' = 'text-to-image'): Promise<MeshyTaskResponse> {
    return this.request<MeshyTaskResponse>(`/${taskType}/${taskId}`)
  }

  /**
   * Wait for task completion (polls every 2 seconds)
   */
  async waitForCompletion(
    taskId: string,
    taskType: 'text-to-image' | 'image-to-image' = 'text-to-image',
    maxWaitMs: number = 120000
  ): Promise<MeshyTaskResponse> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getTaskStatus(taskId, taskType)

      if (status.status === 'SUCCEEDED') {
        return status
      }

      if (status.status === 'FAILED' || status.status === 'CANCELED') {
        throw new Error(`Meshy task ${status.status}: ${status.error || 'Unknown error'}`)
      }

      // Wait 2 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    throw new Error('Meshy task timed out')
  }

  /**
   * Generate image and wait for result (convenience method)
   */
  async generateImage(prompt: string, options?: {
    model?: 'nano-banana' | 'nano-banana-pro'
    negativePrompt?: string
  }): Promise<string> {
    const { taskId } = await this.textToImage({
      prompt,
      model: options?.model,
      negativePrompt: options?.negativePrompt,
    })

    const result = await this.waitForCompletion(taskId, 'text-to-image')
    return result.result || ''
  }

  /**
   * Transform image and wait for result (convenience method)
   * Perfect for: "Put this product in a modern kitchen"
   */
  async transformImage(imageUrls: string[], prompt: string, options?: {
    model?: 'nano-banana' | 'nano-banana-pro'
    negativePrompt?: string
  }): Promise<string> {
    const { taskId } = await this.imageToImage({
      prompt,
      referenceImageUrls: imageUrls,
      model: options?.model,
      negativePrompt: options?.negativePrompt,
    })

    const result = await this.waitForCompletion(taskId, 'image-to-image')
    return result.result || ''
  }
}

// Factory function
export function createMeshyClient(apiKey?: string): MeshyClient | null {
  const key = apiKey || process.env.MESHY_API_KEY
  if (!key) {
    return null
  }
  return new MeshyClient({ apiKey: key })
}

export default MeshyClient
