import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

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
    const supabase = getSupabase()
    const groq = getGroq()
    const { topic, channel, format } = await req.json()
    
    if (!topic || !channel) {
      return NextResponse.json(
        { error: 'topic and channel are required' },
        { status: 400 }
      )
    }
    
    // Get user's brand brain with sample texts
    const { data: brain, error: brainError } = await supabase
      .from('brand_brains')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('is_active', true)
      .single()
    
    if (brainError || !brain) {
      return NextResponse.json(
        { error: 'Brand brain not found' },
        { status: 404 }
      )
    }
    
    // Build prompt with sample texts
    const sampleTexts = brain.sample_texts || []
    const rules = brain.rules || []
    
    const channelInstructions = {
      twitter: format === 'thread' 
        ? 'Create a Twitter thread (5-7 tweets, each under 280 characters). Number each tweet.'
        : 'Create a single Twitter post (under 280 characters).',
      linkedin: 'Create a LinkedIn post (1000-1500 characters). Professional but engaging.',
      substack: 'Create a newsletter section (500-800 words). Include a compelling hook.',
      general: 'Create engaging content suitable for any platform.'
    }
    
    const instruction = channelInstructions[channel as keyof typeof channelInstructions] || channelInstructions.general
    
    const systemPrompt = `You are a content writer that matches the user's brand voice perfectly.

${sampleTexts.length > 0 ? `Sample Writing Style (MATCH THIS EXACTLY):
${sampleTexts.slice(0, 3).join('\n\n---\n\n')}` : 'No sample texts yet. Write in a clear, direct style.'}

${rules.length > 0 ? `Learned Rules (MUST FOLLOW):
${rules.map((r: any) => `- ${r.rule}`).join('\n')}` : ''}

${instruction}

IMPORTANT:
- Match the tone and style exactly from the sample texts
- Follow all learned rules
- Be authentic to the brand voice`

    // Generate with Groq
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Topic: ${topic}` }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
    
    const content = completion.choices[0]?.message?.content || ''
    
    // Save draft to database
    const { data: draft, error: draftError } = await supabase
      .from('drafts')
      .insert({
        user_id: TEST_USER_ID,
        brain_id: brain.id,
        title: topic.slice(0, 100),
        content,
        channel,
        format: format || (channel === 'twitter' && content.includes('1.') ? 'thread' : 'post'),
        status: 'draft',
        voice_match_score: 85, // Default for now
        metadata: {
          topic,
          generated_at: new Date().toISOString(),
          model: 'llama-3.1-70b-versatile'
        }
      })
      .select()
      .single()
    
    if (draftError) {
      console.error('Failed to save draft:', draftError)
      return NextResponse.json(
        { error: 'Failed to save draft' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ draft })
    
  } catch (error) {
    console.error('Draft generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate draft' },
      { status: 500 }
    )
  }
}
