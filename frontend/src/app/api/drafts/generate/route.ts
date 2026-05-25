import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { generateDraft } from '@/lib/services/draft-generation'
import { getActiveBrain } from '@/lib/services/brain-manager'
import { traceAsync, addSpan, endSpan } from '@/lib/observability/tracer'
import { trackCost } from '@/lib/observability/cost-tracker'
import { validateTopic, checkRateLimit } from '@/lib/security/input-guard'
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
  return traceAsync('draft-generation', async (trace_id) => {
    try {
      const supabase = getSupabase()
      const groq = getGroq()
      const body = await req.json()
      
      const { topic, channel, format } = body
      
      // Rate limiting
      const rateLimit = checkRateLimit(TEST_USER_ID, 'draft-generation', 10, 60000)
      if (!rateLimit.allowed) {
        console.warn('[GENERATE] Rate limit exceeded')
        return NextResponse.json(
          { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
          { status: 429 }
        )
      }
      
      // Input validation
      const validation = validateTopic(topic)
      if (!validation.valid) {
        console.warn('[GENERATE] Invalid input:', validation.errors)
        return NextResponse.json(
          { error: 'Invalid input', details: validation.errors },
          { status: 400 }
        )
      }
      
      if (!channel) {
        return NextResponse.json(
          { error: 'channel is required' },
          { status: 400 }
        )
      }
      
      const sanitizedTopic = validation.sanitized
    
      // Get brain
      const span_brain = addSpan(trace_id, 'fetch-brain')
      const brain = await getActiveBrain(TEST_USER_ID, supabase)
      endSpan(trace_id, span_brain, 'success')
      
      if (!brain) {
        return NextResponse.json(
          { error: 'Brand brain not found' },
          { status: 404 }
        )
      }
    
      // Fetch recent corrections
      const span_corrections = addSpan(trace_id, 'fetch-corrections')
      const { data: corrections } = await supabase
        .from('corrections')
        .select('original_text, corrected_text, extracted_rule')
        .eq('brain_id', brain.id)
        .order('created_at', { ascending: false })
        .limit(5)
      endSpan(trace_id, span_corrections, 'success')
      
      // Generate draft using service
      const span_generate = addSpan(trace_id, 'generate-content')
      const result = await generateDraft(
        {
          topic: sanitizedTopic,
          channel,
          format,
          brain,
          recentCorrections: corrections || []
        },
        groq
      )
      endSpan(trace_id, span_generate, 'success', {
        content_length: result.content.length
      })
      
      // Track cost (estimate: ~500 prompt + ~200 completion tokens)
      trackCost(
        'draft-generation',
        'llama-3.3-70b-versatile',
        500,
        200,
        trace_id,
        { topic: sanitizedTopic, channel }
      )
      
      // Output filtering
      const span_filter = addSpan(trace_id, 'filter-output')
      const filtered = filterOutput(result.content)
      endSpan(trace_id, span_filter, 'success', { flags: filtered.flags })
      
      if (!filtered.safe) {
        console.warn('[GENERATE] Content flagged:', filtered.flags)
      }
      
      const finalContent = filtered.filtered
    
      // Save draft
      const span_save = addSpan(trace_id, 'save-draft')
      const { data: draft, error: draftError } = await supabase
        .from('drafts')
        .insert({
          user_id: TEST_USER_ID,
          brain_id: brain.id,
          title: sanitizedTopic.slice(0, 100),
          content: finalContent,
          channel,
          format: format || (channel === 'twitter' && finalContent.includes('1.') ? 'thread' : 'post'),
          status: 'draft',
          voice_match_score: 85,
          metadata: {
            ...result.metadata,
            trace_id,
            filtered_flags: filtered.flags
          }
        })
        .select()
        .single()
      endSpan(trace_id, span_save, draftError ? 'error' : 'success')
      
      if (draftError) {
        console.error('[GENERATE] Failed to save draft:', draftError)
        return NextResponse.json(
          { error: 'Failed to save draft', details: draftError.message },
          { status: 500 }
        )
      }
      
      console.log('[GENERATE] Draft saved successfully:', draft.id)
      return NextResponse.json({ draft, trace_id })
    
    } catch (error) {
      console.error('Draft generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json(
        { 
          error: 'Failed to generate draft',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      )
    }
  }, { user_id: TEST_USER_ID })
}
