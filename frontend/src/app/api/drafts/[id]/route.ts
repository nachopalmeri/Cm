import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthenticatedUserId } from '@/lib/auth/supabase-server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { data: draft, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (error || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Get draft error:', error)
    return NextResponse.json({ error: 'Failed to get draft' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updates = await req.json()
    const supabase = createServiceClient()
    const { data: draft, error } = await supabase
      .from('drafts')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update draft error:', error)
      return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 })
    }

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Update draft error:', error)
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) {
      console.error('Delete draft error:', error)
      return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete draft error:', error)
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
  }
}