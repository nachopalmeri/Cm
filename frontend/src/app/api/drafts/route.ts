import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthenticatedUserId } from '@/lib/auth/supabase-server'

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('drafts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: drafts, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 })
    }

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('Fetch drafts error:', error)
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 })
  }
}
