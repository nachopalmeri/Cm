/**
 * Draft Generation Service
 * Handles content generation with voice matching
 */

import Groq from 'groq-sdk'
import { normalizeUTF8 } from '@/lib/encoding/utf8'

export interface GenerationInput {
  topic: string
  channel: string
  format?: string
  brain: {
    id: string
    sample_texts: string[]
    rules: any[]
    voice_match_score: number
  }
  recentCorrections?: any[]
}

export interface GenerationResult {
  content: string
  metadata: {
    topic: string
    generated_at: string
    model: string
    prompt_version: string
  }
}

/**
 * Generate draft content with voice matching
 */
export async function generateDraft(
  input: GenerationInput,
  groq: Groq
): Promise<GenerationResult> {
  // Normalize topic
  const topic = normalizeUTF8(input.topic)
  
  console.log('[DRAFT-GENERATION] Starting generation for:', topic)
  
  // Build system prompt
  const systemPrompt = buildSystemPrompt(input)
  
  // Generate with Groq
  console.log('[DRAFT-GENERATION] Calling Groq API...')
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
  
  console.log('[DRAFT-GENERATION] Content generated:', content.slice(0, 100) + '...')
  
  return {
    content,
    metadata: {
      topic,
      generated_at: new Date().toISOString(),
      model: 'llama-3.3-70b-versatile',
      prompt_version: 'v1.0'
    }
  }
}

/**
 * Build system prompt with voice context
 */
function buildSystemPrompt(input: GenerationInput): string {
  const { brain, channel, format, recentCorrections } = input
  
  const channelInstructions = {
    twitter: format === 'thread' 
      ? 'Create a Twitter thread (5-7 tweets, each under 280 characters). Number each tweet.'
      : 'Create a single Twitter post (under 280 characters).',
    linkedin: 'Create a LinkedIn post (1000-1500 characters). Professional but engaging.',
    substack: 'Create a newsletter section (500-800 words). Include a compelling hook.',
    general: 'Create engaging content suitable for any platform.'
  }
  
  const instruction = channelInstructions[channel as keyof typeof channelInstructions] || channelInstructions.general
  
  let prompt = `You are a content writer that learns from corrections and matches the user's brand voice perfectly.\n\n`
  
  // Add sample texts
  if (brain.sample_texts.length > 0) {
    prompt += `SAMPLE WRITING STYLE (match this exactly):\n${brain.sample_texts.slice(0, 3).join('\n\n---\n\n')}\n\n`
  } else {
    prompt += `No sample texts yet. Write in a clear, direct style.\n\n`
  }
  
  // Add learned rules
  if (brain.rules.length > 0) {
    prompt += `LEARNED RULES (MUST follow):\n${brain.rules.map((r: any) => `- [${r.category}] ${r.rule}`).join('\n')}\n\n`
  }
  
  // Add recent corrections
  if (recentCorrections && recentCorrections.length > 0) {
    prompt += `RECENT CORRECTIONS (learn from these):\n${recentCorrections.map((c: any) => `
Original: ${c.original_text?.slice(0, 150) || ''}
Corrected: ${c.corrected_text?.slice(0, 150) || ''}
Why: ${c.extracted_rule?.rule || 'User preference'}
`).join('\n---\n')}\n\n`
  }
  
  prompt += `${instruction}\n\n`
  prompt += `IMPORTANT:\n`
  prompt += `- Match the tone and style exactly from the sample texts\n`
  prompt += `- Follow all learned rules\n`
  prompt += `- Apply patterns from recent corrections\n`
  prompt += `- Be authentic to the brand voice`
  
  return prompt
}

/**
 * Determine format from content
 */
export function detectFormat(content: string, channel: string): string {
  if (channel === 'twitter' && content.includes('1.')) {
    return 'thread'
  }
  return 'post'
}
