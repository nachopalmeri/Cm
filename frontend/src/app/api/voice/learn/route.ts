import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { analyzeDiff } from '@/lib/diff/analyzer'
import { calculateVoiceMatchDelta } from '@/lib/voice/scorer'

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
    
    // Intelligent rule extraction with diff analysis + Groq
    console.log('[LEARN] Analyzing diff...')
    const diffAnalysis = analyzeDiff(original_text, corrected_text)
    console.log('[LEARN] Diff analysis:', JSON.stringify(diffAnalysis, null, 2))
    
    // Use Groq to extract a specific, actionable rule
    console.log('[LEARN] Extracting rule with Groq...')
    const groq = getGroq()
    const rulePrompt = `Analiza esta corrección y extrae UNA regla específica y accionable.

TEXTO ORIGINAL:
${original_text}

TEXTO CORREGIDO:
${corrected_text}

CAMBIOS DETECTADOS:
- Palabras eliminadas: ${diffAnalysis.wordsRemoved.join(', ') || 'ninguna'}
- Palabras agregadas: ${diffAnalysis.wordsAdded.join(', ') || 'ninguna'}
- Cambios de estructura: ${diffAnalysis.structureChanges.lengthChange > 0 ? 'más largo' : diffAnalysis.structureChanges.lengthChange < 0 ? 'más corto' : 'similar'}
- Hashtags cambiados: ${diffAnalysis.structureChanges.hasHashtagChanges ? 'sí' : 'no'}

Extrae UNA regla específica en formato:
"[ACCIÓN]: [RAZÓN]"

Ejemplos:
- "Usar 'herramientas' en lugar de 'soluciones': más concreto y accionable"
- "Evitar hashtags genéricos: prefiere términos específicos"
- "Acortar frases: mantener bajo 280 caracteres"

Responde SOLO con la regla, sin explicaciones adicionales.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Eres un experto en análisis de estilo de escritura. Extraes reglas específicas y accionables.' },
        { role: 'user', content: rulePrompt }
      ],
      temperature: 0.3,
      max_tokens: 150
    })
    
    const ruleText = completion.choices[0]?.message?.content?.trim() || 'Corrección aplicada: preferencia del usuario'
    console.log('[LEARN] Extracted rule:', ruleText)
    
    // Determine primary category from diff analysis
    const primaryCategory = diffAnalysis.categories[0] || 'tone'
    
    // Calculate confidence based on clarity of changes
    const confidence = calculateConfidence(diffAnalysis)
    
    const extractedRule = {
      rule: ruleText,
      category: primaryCategory,
      confidence,
      examples: {
        before: original_text.slice(0, 100),
        after: corrected_text.slice(0, 100)
      },
      created_at: new Date().toISOString()
    }
    
    console.log('[LEARN] Final rule:', JSON.stringify(extractedRule, null, 2))
    
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
    
    // Calculate dynamic voice match score based on correction impact
    console.log('[LEARN] Calculating voice match delta...')
    const scoreDelta = calculateVoiceMatchDelta(
      original_text,
      corrected_text,
      ruleText,
      currentRules,
      brain.voice_match_score
    )
    console.log('[LEARN] Score delta:', scoreDelta)
    
    const newScore = Math.max(0, Math.min(99, brain.voice_match_score + scoreDelta))
    
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
      improvement: scoreDelta,
      previousScore: brain.voice_match_score,
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

/**
 * Calculate confidence score based on diff analysis
 */
function calculateConfidence(diffAnalysis: any): number {
  let confidence = 70 // Base confidence
  
  // More specific word changes = higher confidence
  if (diffAnalysis.wordsRemoved.length > 0 && diffAnalysis.wordsAdded.length > 0) {
    confidence += 10
  }
  
  // Phrase-level changes = higher confidence
  if (diffAnalysis.phrasesChanged.length > 0) {
    confidence += 10
  }
  
  // Multiple categories = more comprehensive change = higher confidence
  if (diffAnalysis.categories.length > 1) {
    confidence += 5
  }
  
  return Math.min(confidence, 95)
}
