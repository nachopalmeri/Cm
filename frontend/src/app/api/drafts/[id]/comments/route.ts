import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * GET /api/drafts/[id]/comments
 * List comments for a draft
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: draft_id } = params
    const { searchParams } = new URL(req.url)
    
    const resolved = searchParams.get('resolved')
    const type = searchParams.get('type')
    
    const supabase = getSupabase()
    
    // Verify draft exists and belongs to user
    const { data: draft } = await supabase
      .from('drafts')
      .select('id')
      .eq('id', draft_id)
      .eq('user_id', TEST_USER_ID)
      .single()
    
    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }
    
    // Build query
    let query = supabase
      .from('draft_comments')
      .select('*')
      .eq('draft_id', draft_id)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true')
    }
    
    if (type) {
      query = query.eq('type', type)
    }
    
    const { data: comments, error } = await query
    
    if (error) {
      console.error('[COMMENTS] Error fetching:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ comments })
    
  } catch (error) {
    console.error('[COMMENTS] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/drafts/[id]/comments
 * Create a new comment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: draft_id } = params
    const body = await req.json()
    
    const { type, severity, category, content, metadata = {} } = body
    
    // Validate required fields
    if (!type || !severity || !category || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, severity, category, content' },
        { status: 400 }
      )
    }
    
    // Validate enum values
    const validTypes = ['agent', 'user']
    const validSeverities = ['info', 'warning', 'error']
    const validCategories = ['hook', 'voice', 'repetition', 'structure', 'length', 'clarity']
    
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` },
        { status: 400 }
      )
    }
    
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }
    
    const supabase = getSupabase()
    
    // Verify draft exists and belongs to user
    const { data: draft } = await supabase
      .from('drafts')
      .select('id')
      .eq('id', draft_id)
      .eq('user_id', TEST_USER_ID)
      .single()
    
    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }
    
    // Create comment
    const { data: comment, error } = await supabase
      .from('draft_comments')
      .insert({
        draft_id,
        user_id: TEST_USER_ID,
        type,
        severity,
        category,
        content,
        metadata
      })
      .select()
      .single()
    
    if (error) {
      console.error('[COMMENTS] Error creating:', error)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ comment }, { status: 201 })
    
  } catch (error) {
    console.error('[COMMENTS] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
