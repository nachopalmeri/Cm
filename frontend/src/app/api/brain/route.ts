import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthenticatedUserId } from '@/lib/auth/supabase-server'

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { data: brain, error } = await supabase
      .from('brand_brains')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !brain) {
      return NextResponse.json({ error: 'Brand brain not found' }, { status: 404 })
    }

    return NextResponse.json({ brain })
  } catch (error) {
    console.error('Fetch brain error:', error)
    return NextResponse.json({ error: 'Failed to fetch brain' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updates = await req.json()
    const supabase = createServiceClient()

    const { data: brain, error } = await supabase
      .from('brand_brains')
      .update(updates)
      .eq('user_id', userId)
      .eq('is_active', true)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update brain' }, { status: 500 })
    }

    return NextResponse.json({ brain })
  } catch (error) {
    console.error('Update brain error:', error)
    return NextResponse.json({ error: 'Failed to update brain' }, { status: 500 })
  }
}
