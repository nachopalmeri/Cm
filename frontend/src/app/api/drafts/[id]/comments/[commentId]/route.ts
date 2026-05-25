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
 * PATCH /api/drafts/[id]/comments/[commentId]
 * Update a comment (mainly for resolve/unresolve)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { id: draft_id, commentId } = params
    const body = await req.json()
    
    const { resolved, content } = body
    
    const supabase = getSupabase()
    
    // Verify comment exists and belongs to user's draft
    const { data: comment } = await supabase
      .from('draft_comments')
      .select('*, drafts!inner(user_id)')
      .eq('id', commentId)
      .eq('draft_id', draft_id)
      .single()
    
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }
    
    // Verify draft belongs to user
    if ((comment as any).drafts.user_id !== TEST_USER_ID) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // Build update object
    const updates: any = {}
    if (resolved !== undefined) updates.resolved = resolved
    if (content !== undefined) updates.content = content
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }
    
    // Update comment
    const { data: updatedComment, error } = await supabase
      .from('draft_comments')
      .update(updates)
      .eq('id', commentId)
      .select()
      .single()
    
    if (error) {
      console.error('[COMMENTS] Error updating:', error)
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ comment: updatedComment })
    
  } catch (error) {
    console.error('[COMMENTS] PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/drafts/[id]/comments/[commentId]
 * Delete a comment
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { id: draft_id, commentId } = params
    
    const supabase = getSupabase()
    
    // Verify comment exists and belongs to user's draft
    const { data: comment } = await supabase
      .from('draft_comments')
      .select('*, drafts!inner(user_id)')
      .eq('id', commentId)
      .eq('draft_id', draft_id)
      .single()
    
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }
    
    // Verify draft belongs to user
    if ((comment as any).drafts.user_id !== TEST_USER_ID) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // Delete comment
    const { error } = await supabase
      .from('draft_comments')
      .delete()
      .eq('id', commentId)
    
    if (error) {
      console.error('[COMMENTS] Error deleting:', error)
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[COMMENTS] DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
