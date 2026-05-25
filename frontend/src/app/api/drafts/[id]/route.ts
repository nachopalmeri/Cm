import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/drafts/[id] - Get single draft
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase()
    
    const { data: draft, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', TEST_USER_ID)
      .single()
    
    if (error || !draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ draft })
    
  } catch (error) {
    console.error('Get draft error:', error)
    return NextResponse.json(
      { error: 'Failed to get draft' },
      { status: 500 }
    )
  }
}

// PATCH /api/drafts/[id] - Update draft
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await req.json()
    const supabase = getSupabase()
    
    const { data: draft, error } = await supabase
      .from('drafts')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', TEST_USER_ID)
      .select()
      .single()
    
    if (error) {
      console.error('Update draft error:', error)
      return NextResponse.json(
        { error: 'Failed to update draft' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ draft })
    
  } catch (error) {
    console.error('Update draft error:', error)
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    )
  }
}

// DELETE /api/drafts/[id] - Delete draft
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase()
    
    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', TEST_USER_ID)
    
    if (error) {
      console.error('Delete draft error:', error)
      return NextResponse.json(
        { error: 'Failed to delete draft' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Delete draft error:', error)
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    )
  }
}
