/**
 * Voice Learning Service
 * Handles correction processing, rule extraction, and voice match scoring
 */

import Groq from 'groq-sdk'
import { analyzeDiff } from '@/lib/diff/analyzer'
import { calculateVoiceMatchDelta } from '@/lib/voice/scorer'
import { normalizeUTF8 } from '@/lib/encoding/utf8'

export interface CorrectionInput {
  original_text: string
  corrected_text: string
  brain_id: string
  current_rules: any[]
  current_score: number
}

export interface ExtractedRule {
  rule: string
  category: string
  confidence: number
  examples: {
    before: string
    after: string
  }
  created_at: string
}

export interface LearningResult {
  extractedRule: ExtractedRule
  scoreDelta: number
  newScore: number
  isDuplicate: boolean
}

/**
 * Process a correction and extract learning
 */
export async function processCorrection(
  input: CorrectionInput,
  groq: Groq
): Promise<LearningResult> {
  // Normalize UTF-8
  const original_text = normalizeUTF8(input.original_text)
  const corrected_text = normalizeUTF8(input.corrected_text)
  
  // Analyze diff
  console.log('[VOICE-LEARNING] Analyzing diff...')
  const diffAnalysis = analyzeDiff(original_text, corrected_text)
  
  // Extract rule with Groq
  console.log('[VOICE-LEARNING] Extracting rule...')
  const ruleText = await extractRule(original_text, corrected_text, diffAnalysis, groq)
  
  // Determine category and confidence
  const primaryCategory = diffAnalysis.categories[0] || 'tone'
  const confidence = calculateConfidence(diffAnalysis)
  
  const extractedRule: ExtractedRule = {
    rule: ruleText,
    category: primaryCategory,
    confidence,
    examples: {
      before: original_text.slice(0, 100),
      after: corrected_text.slice(0, 100)
    },
    created_at: new Date().toISOString()
  }
  
  // Check for duplicates
  const ruleKey = ruleText.toLowerCase().trim()
  const isDuplicate = input.current_rules.some((r: any) => 
    (r.rule || '').toLowerCase().trim() === ruleKey
  )
  
  // Calculate score delta
  const scoreDelta = isDuplicate ? 0 : calculateVoiceMatchDelta(
    original_text,
    corrected_text,
    ruleText,
    input.current_rules,
    input.current_score
  )
  
  const newScore = Math.max(0, Math.min(99, input.current_score + scoreDelta))
  
  console.log('[VOICE-LEARNING] Result:', {
    rule: ruleText,
    isDuplicate,
    scoreDelta,
    newScore
  })
  
  return {
    extractedRule,
    scoreDelta,
    newScore,
    isDuplicate
  }
}

/**
 * Extract rule using Groq LLM
 */
async function extractRule(
  original: string,
  corrected: string,
  diffAnalysis: any,
  groq: Groq
): Promise<string> {
  const rulePrompt = `Analiza esta corrección y extrae UNA regla específica y accionable.

TEXTO ORIGINAL:
${original}

TEXTO CORREGIDO:
${corrected}

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
  
  return normalizeUTF8(
    completion.choices[0]?.message?.content?.trim() || 
    'Corrección aplicada: preferencia del usuario'
  )
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
