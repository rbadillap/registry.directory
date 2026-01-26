import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify request comes from Vercel Cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL

  if (!deployHookUrl) {
    return NextResponse.json(
      { error: 'Deploy hook not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(deployHookUrl, { method: 'POST' })

    if (!response.ok) {
      throw new Error(`Deploy hook failed: ${response.status}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Rebuild triggered',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Rebuild API] Failed to trigger rebuild:', error)
    return NextResponse.json(
      { error: 'Failed to trigger rebuild' },
      { status: 500 }
    )
  }
}
