import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { draft_id, original_text, corrected_text } = await req.json()
    
    if (!draft_id || !original_text || !corrected_text) {
      return NextResponse.json(
        { error: 'draft_id, original_text, and corrected_text are required' },
        { status: 400 }
      )
    }
    
    const supabase = getSupabase()
    
    // Get the brain associated with this draft
    const { data: draft } = await supabase
      .from('drafts')
      .select('brain_id')
      .eq('id', draft_id)
      .single()
    
    if (!draft || !draft.brain_id) {
      return NextResponse.json(
        { error: 'Draft or brain not found' },
        { status: 404 }
      )
    }
    
    // Get current brain data
    const { data: brain } = await supabase
      .from('brand_brains')
      .select('*')
      .eq('id', draft.brain_id)
      .single()
    
    if (!brain) {
      return NextResponse.json(
        { error: 'Brain not found' },
        { status: 404 }
      )
    }
    
    // Simple rule extraction (will be improved in Paso 3)
    const extractedRule = {
      rule: `Corrección aplicada: preferencia del usuario`,
      category: 'tone' as const,
      confidence: 80,
      examples: {
        before: original_text.slice(0, 100),
        after: corrected_text.slice(0, 100)
      },
      created_at: new Date().toISOString()
    }
    
    // Save correction to database
    const { data: correction, error: correctionError } = await supabase
      .from('corrections')
      .insert({
        user_id: TEST_USER_ID,
        draft_id,
        brain_id: draft.brain_id,
        original_text,
        corrected_text,
        extracted_rule: extractedRule,
        applied_to_brain: true
      })
      .select()
      .single()
    
    if (correctionError) {
      console.error('Failed to save correction:', correctionError)
      return NextResponse.json(
        { error: 'Failed to save correction' },
        { status: 500 }
      )
    }
    
    // Add rule to brain
    const currentRules = brain.rules || []
    const updatedRules = [...currentRules, extractedRule]
    
    // Calculate new voice match score (progressive improvement)
    const newScore = Math.min(brain.voice_match_score + 2, 99)
    
    // Update brain
    const { error: updateError } = await supabase
      .from('brand_brains')
      .update({
        rules: updatedRules,
        corrections_count: brain.corrections_count + 1,
        voice_match_score: newScore
      })
      .eq('id', draft.brain_id)
    
    if (updateError) {
      console.error('Failed to update brain:', updateError)
      return NextResponse.json(
        { error: 'Failed to update brain' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      newRule: extractedRule,
      voiceMatchScore: newScore,
      improvement: 2,
      totalRules: updatedRules.length,
      totalCorrections: brain.corrections_count + 1
    })
    
  } catch (error) {
    console.error('Learn error:', error)
    return NextResponse.json(
      { error: 'Failed to learn from correction' },
      { status: 500 }
    )
  }
}
