import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { processCorrection } from '@/lib/services/voice-learning'
import { addRuleToBrain, incrementCorrections, updateVoiceScore } from '@/lib/services/brain-manager'
import { traceAsync, addSpan, endSpan } from '@/lib/observability/tracer'
import { trackCost } from '@/lib/observability/cost-tracker'
import { validateCorrection, checkRateLimit } from '@/lib/security/input-guard'
import { filterOutput } from '@/lib/security/output-guard'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getGroq() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY || 'placeholder'
  })
}

export async function POST(req: NextRequest) {
  return traceAsync('voice-learning', async (trace_id) => {
    try {
      const body = await req.json()
      const { draft_id, original_text, corrected_text } = body
      
      // Rate limiting
      const rateLimit = checkRateLimit(TEST_USER_ID, 'voice-learning', 10, 60000)
      if (!rateLimit.allowed) {
        console.warn('[LEARN] Rate limit exceeded')
        return NextResponse.json(
          { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
          { status: 429 }
        )
      }
      
      // Input validation
      const validation = validateCorrection(original_text, corrected_text)
      if (!validation.valid) {
        console.warn('[LEARN] Invalid input:', validation.errors)
        return NextResponse.json(
          { error: 'Invalid input', details: validation.errors },
          { status: 400 }
        )
      }
      
      if (!draft_id) {
        return NextResponse.json(
          { error: 'draft_id is required' },
          { status: 400 }
        )
      }
      
      const sanitized = validation.sanitized
      const supabase = getSupabase()
      const groq = getGroq()
    
      // Get draft and brain
      const span_fetch = addSpan(trace_id, 'fetch-draft-brain')
      const { data: draft } = await supabase
        .from('drafts')
        .select('brain_id')
        .eq('id', draft_id)
        .single()
      
      if (!draft || !draft.brain_id) {
        endSpan(trace_id, span_fetch, 'error')
        return NextResponse.json(
          { error: 'Draft or brain not found' },
          { status: 404 }
        )
      }
      
      const { data: brain } = await supabase
        .from('brand_brains')
        .select('*')
        .eq('id', draft.brain_id)
        .single()
      
      if (!brain) {
        endSpan(trace_id, span_fetch, 'error')
        return NextResponse.json(
          { error: 'Brain not found' },
          { status: 404 }
        )
      }
      endSpan(trace_id, span_fetch, 'success')
    
      // Process correction using service
      const span_process = addSpan(trace_id, 'process-correction')
      const result = await processCorrection(
        {
          original_text: sanitized.original,
          corrected_text: sanitized.corrected,
          brain_id: brain.id,
          current_rules: brain.rules || [],
          current_score: brain.voice_match_score
        },
        groq
      )
      endSpan(trace_id, span_process, 'success', {
        isDuplicate: result.isDuplicate,
        scoreDelta: result.scoreDelta
      })
      
      // Track cost (estimate: ~300 prompt + ~50 completion tokens)
      await trackCost(
        'voice-learning',
        'llama-3.3-70b-versatile',
        300,
        50,
        trace_id,
        { draft_id }
      )
      
      // Filter extracted rule
      const span_filter = addSpan(trace_id, 'filter-rule')
      const filtered = filterOutput(result.extractedRule.rule)
      endSpan(trace_id, span_filter, 'success', { flags: filtered.flags })
      
      if (!filtered.safe) {
        console.warn('[LEARN] Rule flagged:', filtered.flags)
      }
      
      const finalRule = {
        ...result.extractedRule,
        rule: filtered.filtered
      }
    
      // Save correction
      const span_save = addSpan(trace_id, 'save-correction')
      const { data: correction, error: correctionError } = await supabase
        .from('corrections')
        .insert({
          user_id: TEST_USER_ID,
          draft_id,
          brain_id: draft.brain_id,
          original_text: sanitized.original,
          corrected_text: sanitized.corrected,
          extracted_rule: finalRule,
          applied_to_brain: true,
          metadata: {
            trace_id,
            filtered_flags: filtered.flags
          }
        })
        .select()
        .single()
      endSpan(trace_id, span_save, correctionError ? 'error' : 'success')
      
      if (correctionError) {
        console.error('Failed to save correction:', correctionError)
        return NextResponse.json(
          { error: 'Failed to save correction' },
          { status: 500 }
        )
      }
    
      // Update brain using services
      const span_update = addSpan(trace_id, 'update-brain')
      
      // Add rule (with deduplication)
      if (!result.isDuplicate) {
        const ruleAdded = await addRuleToBrain(
          brain.id,
          finalRule,
          brain.rules || [],
          supabase
        )
        if (!ruleAdded.success) {
          endSpan(trace_id, span_update, 'error')
          return NextResponse.json(
            { error: 'Failed to add rule to brain' },
            { status: 500 }
          )
        }
      }
      
      // Increment corrections count
      await incrementCorrections(brain.id, brain.corrections_count, supabase)
      
      // Update voice score
      await updateVoiceScore(brain.id, result.newScore, supabase)
      
      endSpan(trace_id, span_update, 'success')
    
      return NextResponse.json({
        success: true,
        newRule: finalRule,
        voiceMatchScore: result.newScore,
        improvement: result.scoreDelta,
        previousScore: brain.voice_match_score,
        totalRules: result.isDuplicate ? brain.rules.length : brain.rules.length + 1,
        totalCorrections: brain.corrections_count + 1,
        trace_id
      })
      
    } catch (error) {
      console.error('Learn error:', error)
      return NextResponse.json(
        { error: 'Failed to learn from correction' },
        { status: 500 }
      )
    }
  }, { user_id: TEST_USER_ID })
}
