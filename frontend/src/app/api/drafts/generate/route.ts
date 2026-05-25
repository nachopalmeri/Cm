import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { normalizeUTF8 } from '@/lib/encoding/utf8'

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
  try {
    console.log('[GENERATE] Starting draft generation...')
    const supabase = getSupabase()
    const groq = getGroq()
    const body = await req.json()
    
    // Normalize UTF-8 in request body
    const topic = normalizeUTF8(body.topic || '')
    const channel = body.channel
    const format = body.format
    
    console.log('[GENERATE] Request params:', { topic, channel, format })
    
    if (!topic || !channel) {
      console.log('[GENERATE] Missing required params')
      return NextResponse.json(
        { error: 'topic and channel are required' },
        { status: 400 }
      )
    }
    
    // Get user's brand brain with sample texts
    console.log('[GENERATE] Fetching brand brain...')
    const { data: brain, error: brainError } = await supabase
      .from('brand_brains')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('is_active', true)
      .single()
    
    if (brainError || !brain) {
      console.error('[GENERATE] Brain fetch error:', brainError)
      return NextResponse.json(
        { error: 'Brand brain not found' },
        { status: 404 }
      )
    }
    console.log('[GENERATE] Brain found:', brain.id)
    
    // Build prompt with sample texts
    const sampleTexts = brain.sample_texts || []
    const rules = brain.rules || []
    
    // Fetch recent corrections to learn from
    const { data: corrections } = await supabase
      .from('corrections')
      .select('original_text, corrected_text, extracted_rule')
      .eq('brain_id', brain.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    const channelInstructions = {
      twitter: format === 'thread' 
        ? 'Create a Twitter thread (5-7 tweets, each under 280 characters). Number each tweet.'
        : 'Create a single Twitter post (under 280 characters).',
      linkedin: 'Create a LinkedIn post (1000-1500 characters). Professional but engaging.',
      substack: 'Create a newsletter section (500-800 words). Include a compelling hook.',
      general: 'Create engaging content suitable for any platform.'
    }
    
    const instruction = channelInstructions[channel as keyof typeof channelInstructions] || channelInstructions.general
    
    const systemPrompt = `You are a content writer that learns from corrections and matches the user's brand voice perfectly.

${sampleTexts.length > 0 ? `SAMPLE WRITING STYLE (match this exactly):
${sampleTexts.slice(0, 3).join('\n\n---\n\n')}` : 'No sample texts yet. Write in a clear, direct style.'}

${rules.length > 0 ? `LEARNED RULES (MUST follow):
${rules.map((r: any) => `- [${r.category}] ${r.rule}`).join('\n')}` : ''}

${corrections && corrections.length > 0 ? `
RECENT CORRECTIONS (learn from these):
${corrections.map((c: any) => `
Original: ${c.original_text?.slice(0, 150) || ''}
Corrected: ${c.corrected_text?.slice(0, 150) || ''}
Why: ${c.extracted_rule?.rule || 'User preference'}
`).join('\n---\n')}
` : ''}

${instruction}

IMPORTANT:
- Match the tone and style exactly from the sample texts
- Follow all learned rules
- Apply patterns from recent corrections
- Be authentic to the brand voice`

    // Generate with Groq
    console.log('[GENERATE] Calling Groq API...')
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Topic: ${topic}` }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
    
    const content = normalizeUTF8(completion.choices[0]?.message?.content || '')
    console.log('[GENERATE] Content generated:', content.slice(0, 100) + '...')
    
    // Save draft to database
    console.log('[GENERATE] Saving draft to Supabase...')
    const { data: draft, error: draftError } = await supabase
      .from('drafts')
      .insert({
        user_id: TEST_USER_ID,
        brain_id: brain.id,
        title: topic.slice(0, 100), // Already normalized
        content,
        channel,
        format: format || (channel === 'twitter' && content.includes('1.') ? 'thread' : 'post'),
        status: 'draft',
        voice_match_score: 85, // Default for now
        metadata: {
          topic,
          generated_at: new Date().toISOString(),
          model: 'llama-3.3-70b-versatile'
        }
      })
      .select()
      .single()
    
    if (draftError) {
      console.error('[GENERATE] Failed to save draft:', draftError)
      return NextResponse.json(
        { error: 'Failed to save draft', details: draftError.message },
        { status: 500 }
      )
    }
    
    console.log('[GENERATE] Draft saved successfully:', draft.id)
    return NextResponse.json({ draft })
    
  } catch (error) {
    console.error('Draft generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Failed to generate draft',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
