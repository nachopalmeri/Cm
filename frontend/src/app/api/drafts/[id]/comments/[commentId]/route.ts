import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthenticatedUserId } from '@/lib/auth/supabase-server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string; commentId: string } }) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: draft_id, commentId } = params
    const body = await req.json()
    const supabase = createServiceClient()

    const { data: comment } = await supabase
      .from('draft_comments')
      .select('*, drafts!inner(user_id)')
      .eq('id', commentId)
      .eq('draft_id', draft_id)
      .single()

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if ((comment as any).drafts.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updates: any = {}
    if (body.resolved !== undefined) {
      updates.is_resolved = body.resolved
      if (body.resolved) updates.resolved_at = new Date().toISOString()
    }
    if (body.content !== undefined) updates.content = body.content

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: updatedComment, error } = await supabase
      .from('draft_comments')
      .update(updates)
      .eq('id', commentId)
      .select()
      .single()

    if (error) {
      console.error('[COMMENTS] Error updating:', error)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('[COMMENTS] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; commentId: string } }) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: draft_id, commentId } = params
    const supabase = createServiceClient()

    const { data: comment } = await supabase
      .from('draft_comments')
      .select('*, drafts!inner(user_id)')
      .eq('id', commentId)
      .eq('draft_id', draft_id)
      .single()

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if ((comment as any).drafts.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase.from('draft_comments').delete().eq('id', commentId)
    if (error) {
      console.error('[COMMENTS] Error deleting:', error)
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[COMMENTS] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}