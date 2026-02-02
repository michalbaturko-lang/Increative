import { NextRequest, NextResponse } from 'next/server'
import {
  crawlWebsite,
  runPageSpeedInsights,
  captureScreenshot,
  analyzeWebsite,
} from '@/lib/web-tools'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, action = 'full' } = body

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL je povinná',
      }, { status: 400 })
    }

    switch (action) {
      case 'crawl': {
        const result = await crawlWebsite(url)
        return NextResponse.json({ success: true, data: result })
      }

      case 'pagespeed': {
        const strategy = body.strategy || 'mobile'
        const result = await runPageSpeedInsights(url, strategy)
        return NextResponse.json({ success: true, data: result })
      }

      case 'screenshot': {
        const result = await captureScreenshot(url)
        return NextResponse.json({ success: true, data: result })
      }

      case 'full':
      default: {
        const includePageSpeed = body.includePageSpeed !== false
        const includeScreenshot = body.includeScreenshot !== false

        const result = await analyzeWebsite(url, {
          includePageSpeed,
          includeScreenshot,
        })

        return NextResponse.json({ success: true, data: result })
      }
    }
  } catch (error) {
    console.error('Web Analyze API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Neznámá chyba',
    }, { status: 500 })
  }
}
