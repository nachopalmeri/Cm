import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthenticatedUserId } from '@/lib/auth/supabase-server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const draftId = params.id

    const { data: draft } = await supabase.from('drafts').select('user_id').eq('id', draftId).single()
    if (!draft || draft.user_id !== userId) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const unresolved = searchParams.get('unresolved') === 'true'

    let query = supabase.from('draft_comments').select('*').eq('draft_id', draftId)
    if (type) query = query.eq('type', type)
    if (severity) query = query.eq('severity', severity)
    if (unresolved) query = query.eq('is_resolved', false)
    query = query.order('created_at', { ascending: false })

    const { data: comments, error } = await query
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Fetch comments error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const draftId = params.id
    const body = await req.json()

    const { data: draft } = await supabase.from('drafts').select('user_id').eq('id', draftId).single()
    if (!draft || draft.user_id !== userId) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const { data: comment, error } = await supabase.from('draft_comments').insert({
      draft_id: draftId,
      user_id: userId,
      type: body.type || 'user',
      severity: body.severity,
      category: body.category,
      content: body.content,
      metadata: body.metadata || {}
    }).select().single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}