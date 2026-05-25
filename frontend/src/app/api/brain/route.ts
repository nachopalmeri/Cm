import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/brain - Get user's active brain
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const { data: brain, error } = await supabase
      .from('brand_brains')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('is_active', true)
      .single()
    
    if (error || !brain) {
      return NextResponse.json(
        { error: 'Brand brain not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ brain })
    
  } catch (error) {
    console.error('Fetch brain error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brain' },
      { status: 500 }
    )
  }
}

// PATCH /api/brain - Update brain settings
export async function PATCH(req: NextRequest) {
  try {
    const updates = await req.json()
    const supabase = getSupabase()
    
    const { data: brain, error } = await supabase
      .from('brand_brains')
      .update(updates)
      .eq('user_id', TEST_USER_ID)
      .eq('is_active', true)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update brain' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ brain })
    
  } catch (error) {
    console.error('Update brain error:', error)
    return NextResponse.json(
      { error: 'Failed to update brain' },
      { status: 500 }
    )
  }
}
