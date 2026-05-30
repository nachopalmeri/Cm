import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { generateDraft } from '@/lib/services/draft-generation'
import { getActiveBrain } from '@/lib/services/brain-manager'
import { traceAsync, addSpan, endSpan } from '@/lib/observability/tracer'
import { trackCost } from '@/lib/observability/cost-tracker'
import { validateTopic, checkRateLimit } from '@/lib/security/input-guard'
import { filterOutput } from '@/lib/security/output-guard'
import { reviewDraft } from '@/lib/services/editor-agent'
import { BrainData } from '@/lib/services/brain-manager'
import { createServiceClient, getAuthenticatedUserId } from '@/lib/auth/supabase-server'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! })
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return traceAsync('draft-generation', async (trace_id) => {
    try {
      const supabase = createServiceClient()
      const groq = getGroq()
      const body = await req.json()
      const { topic, channel, format } = body

      const rateLimit = checkRateLimit(userId, 'draft-generation', 10, 60000)
      if (!rateLimit.allowed) {
        return NextResponse.json({ error: 'Rate limit exceeded', resetAt: rateLimit.resetAt }, { status: 429 })
      }

      const validation = validateTopic(topic)
      if (!validation.valid) {
        return NextResponse.json({ error: 'Invalid input', details: validation.errors }, { status: 400 })
      }

      if (!channel) {
        return NextResponse.json({ error: 'channel is required' }, { status: 400 })
      }

      const sanitizedTopic = validation.sanitized
      const span_brain = addSpan(trace_id, 'fetch-brain')
      const brain = await getActiveBrain(userId, supabase)
      endSpan(trace_id, span_brain, 'success')

      if (!brain) {
        return NextResponse.json({ error: 'Brand brain not found' }, { status: 404 })
      }

      const span_corrections = addSpan(trace_id, 'fetch-corrections')
      const { data: corrections } = await supabase
        .from('corrections')
        .select('original_text, corrected_text, extracted_rule')
        .eq('brain_id', brain.id)
        .order('created_at', { ascending: false })
        .limit(5)
      endSpan(trace_id, span_corrections, 'success')

      const span_generate = addSpan(trace_id, 'generate-content')
      const result = await generateDraft({ topic: sanitizedTopic, channel, format, brain, recentCorrections: corrections || [] }, groq)
      endSpan(trace_id, span_generate, 'success', { content_length: result.content.length })

      await trackCost('draft-generation', 'llama-3.3-70b-versatile', 500, 200, trace_id, { topic: sanitizedTopic, channel })

      const span_filter = addSpan(trace_id, 'filter-output')
      const filtered = filterOutput(result.content)
      endSpan(trace_id, span_filter, 'success', { flags: filtered.flags })

      if (!filtered.safe) {
        console.warn('[GENERATE] Content flagged:', filtered.flags)
      }

      const finalContent = filtered.filtered
      const span_save = addSpan(trace_id, 'save-draft')
      const { data: draft, error: draftError } = await supabase
        .from('drafts')
        .insert({
          user_id: userId,
          brain_id: brain.id,
          title: sanitizedTopic.slice(0, 100),
          content: finalContent,
          channel,
          format: format || (channel === 'twitter' && finalContent.includes('1.') ? 'thread' : 'post'),
          status: 'draft',
          voice_match_score: 85,
          metadata: { ...result.metadata, trace_id, filtered_flags: filtered.flags }
        })
        .select()
        .single()
      endSpan(trace_id, span_save, draftError ? 'error' : 'success')

      if (draftError) {
        console.error('[GENERATE] Failed to save draft:', draftError)
        return NextResponse.json({ error: 'Failed to save draft', details: draftError.message }, { status: 500 })
      }

      reviewDraftAsync(draft.id, finalContent, brain, channel || 'twitter', supabase)
      return NextResponse.json({ draft, trace_id })

    } catch (error) {
      console.error('Draft generation error:', error)
      return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
    }
  }, { user_id: userId })
}

async function reviewDraftAsync(draft_id: string, content: string, brain: BrainData, channel: string, supabase: any) {
  try {
    console.log('[AUTO-REVIEW] Starting review for draft:', draft_id)
    const review = await reviewDraft(content, brain, channel)
    console.log('[AUTO-REVIEW] Generated', review.comments.length, 'comments')
    for (const comment of review.comments) {
      await supabase.from('draft_comments').insert({
        draft_id,
        user_id: brain.user_id,
        type: 'agent',
        severity: comment.severity,
        category: comment.category,
        content: comment.content,
        metadata: comment.metadata
      })
    }
    console.log('[AUTO-REVIEW] Review complete. Score:', review.overall_score)
  } catch (error) {
    console.error('[AUTO-REVIEW] Error:', error)
  }
}
