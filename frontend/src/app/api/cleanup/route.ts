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
    const supabase = getSupabase()
    
    // 1. Clean sample_texts - keep only real text
    const { data: brain } = await supabase
      .from('brand_brains')
      .select('id, sample_texts')
      .eq('user_id', TEST_USER_ID)
      .single()
    
    if (!brain) {
      return NextResponse.json({ error: 'Brain not found' }, { status: 404 })
    }
    
    const cleanSampleTexts = brain.sample_texts?.filter(
      (text: string) => text && text.length > 20 && !['dsa', 'hola', 'dasdasdas', 'asdasdadasda'].includes(text)
    ) || []
    
    // 2. Delete testing drafts
    const testingTitles = [
      'Test de caracteres',
      'Test draft generation',
      'Production test',
      'Production test - correction learning',
      'Tercer test',
      'Segundo test',
      'Test with llama-3.3'
    ]
    
    // Get draft IDs to delete
    const { data: draftsToDelete } = await supabase
      .from('drafts')
      .select('id')
      .eq('user_id', TEST_USER_ID)
      .or(testingTitles.map(t => `title.ilike.${t}%`).join(','))
    
    const draftIdsToDelete = draftsToDelete?.map((d: any) => d.id) || []
    
    // Delete corrections for those drafts first
    if (draftIdsToDelete.length > 0) {
      await supabase
        .from('corrections')
        .delete()
        .in('draft_id', draftIdsToDelete)
    }
    
    // Delete testing drafts
    await supabase
      .from('drafts')
      .delete()
      .eq('user_id', TEST_USER_ID)
      .or(testingTitles.map(t => `title.ilike.${t}%`).join(','))
    
    // 3. Deduplicate rules in brain
    const { data: currentBrain } = await supabase
      .from('brand_brains')
      .select('rules, corrections_count')
      .eq('id', brain.id)
      .single()
    
    const uniqueRules = [] as any[]
    const seenRules = new Set()
    
    for (const rule of (currentBrain?.rules || [])) {
      const ruleKey = (rule.rule || '').toLowerCase().trim()
      if (ruleKey && !seenRules.has(ruleKey)) {
        seenRules.add(ruleKey)
        uniqueRules.push(rule)
      }
    }
    
    // 4. Count real corrections
    const { count: realCorrectionsCount } = await supabase
      .from('corrections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', TEST_USER_ID)
    
    // 5. Update brain with clean data
    const { error: updateError } = await supabase
      .from('brand_brains')
      .update({
        sample_texts: cleanSampleTexts,
        rules: uniqueRules,
        corrections_count: realCorrectionsCount || 0,
        voice_match_score: 85 // Reset to realistic base
      })
      .eq('id', brain.id)
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      cleanups: {
        sampleTextsKept: cleanSampleTexts.length,
        draftsDeleted: draftIdsToDelete.length,
        rulesBefore: currentBrain?.rules?.length || 0,
        rulesAfter: uniqueRules.length,
        correctionsCount: realCorrectionsCount || 0
      }
    })
    
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    )
  }
}
