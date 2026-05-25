/**
 * Editor Agent Service
 * Analyzes drafts and generates review comments
 */

import { BrainData } from './brain-manager'

export interface ReviewComment {
  severity: 'info' | 'warning' | 'error'
  category: 'hook' | 'voice' | 'repetition' | 'structure' | 'length' | 'clarity'
  content: string
  metadata: Record<string, any>
}

export interface ReviewResult {
  comments: ReviewComment[]
  overall_score: number
}

/**
 * Review a draft and generate comments
 */
export async function reviewDraft(
  content: string,
  brain: BrainData,
  channel: string = 'twitter'
): Promise<ReviewResult> {
  const comments: ReviewComment[] = []
  let totalScore = 100
  
  // 1. Hook Analysis
  const hookResult = analyzeHook(content, channel)
  if (hookResult.comment) {
    comments.push(hookResult.comment)
    totalScore -= hookResult.penalty
  }
  
  // 2. Voice Match Analysis
  const voiceResult = analyzeVoiceMatch(content, brain)
  if (voiceResult.comment) {
    comments.push(voiceResult.comment)
    totalScore -= voiceResult.penalty
  }
  
  // 3. Repetition Detection
  const repetitionResult = analyzeRepetition(content)
  if (repetitionResult.comment) {
    comments.push(repetitionResult.comment)
    totalScore -= repetitionResult.penalty
  }
  
  // 4. Structure Analysis
  const structureResult = analyzeStructure(content, channel)
  if (structureResult.comment) {
    comments.push(structureResult.comment)
    totalScore -= structureResult.penalty
  }
  
  // 5. Length Check
  const lengthResult = analyzeLength(content, channel)
  if (lengthResult.comment) {
    comments.push(lengthResult.comment)
    totalScore -= lengthResult.penalty
  }
  
  return {
    comments,
    overall_score: Math.max(0, totalScore)
  }
}

/**
 * Analyze hook quality
 */
function analyzeHook(content: string, channel: string): { comment?: ReviewComment; penalty: number } {
  const firstLine = content.split('\n')[0].trim()
  
  // Hook should be engaging
  const hasQuestion = /\?/.test(firstLine)
  const hasEmphasis = /!/.test(firstLine)
  const hasNumbers = /\d+/.test(firstLine)
  const isShort = firstLine.length < 100
  
  const hookScore = (
    (hasQuestion ? 25 : 0) +
    (hasEmphasis ? 20 : 0) +
    (hasNumbers ? 15 : 0) +
    (isShort ? 20 : 0)
  )
  
  // Weak hook detection
  const weakStarts = ['hoy', 'ayer', 'en este', 'les cuento', 'quiero compartir']
  const hasWeakStart = weakStarts.some(start => firstLine.toLowerCase().startsWith(start))
  
  if (hookScore < 40 || hasWeakStart) {
    return {
      comment: {
        severity: 'warning',
        category: 'hook',
        content: 'El hook podría ser más fuerte. Considerá empezar con una pregunta provocativa, un dato impactante, o una afirmación controversial para captar atención.',
        metadata: {
          score: hookScore,
          threshold: 40,
          suggestions: [
            'Usar una pregunta que genere curiosidad',
            'Incluir un número o estadística sorprendente',
            'Hacer una afirmación controversial o contraintuitiva'
          ]
        }
      },
      penalty: 15
    }
  }
  
  return { penalty: 0 }
}

/**
 * Analyze voice match with user's style
 */
function analyzeVoiceMatch(content: string, brain: BrainData): { comment?: ReviewComment; penalty: number } {
  const contentLower = content.toLowerCase()
  
  // Extract common words from sample texts
  const sampleWords = new Set<string>()
  brain.sample_texts.forEach(text => {
    text.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4)
      .forEach(w => sampleWords.add(w))
  })
  
  // Check if content uses similar vocabulary
  const contentWords = contentLower.split(/\s+/).filter(w => w.length > 4)
  const matchingWords = contentWords.filter(w => sampleWords.has(w))
  const matchRate = contentWords.length > 0 ? matchingWords.length / contentWords.length : 0
  
  // Check for formal vs informal tone
  const formalIndicators = ['usted', 'estimado', 'cordialmente', 'atentamente']
  const informalIndicators = ['che', 'boludo', 'tipo', 're', 'mal']
  
  const hasFormal = formalIndicators.some(w => contentLower.includes(w))
  const hasInformal = informalIndicators.some(w => contentLower.includes(w))
  
  // Sample tone
  const sampleText = brain.sample_texts.join(' ').toLowerCase()
  const sampleHasFormal = formalIndicators.some(w => sampleText.includes(w))
  const sampleHasInformal = informalIndicators.some(w => sampleText.includes(w))
  
  const toneMismatch = (hasFormal && sampleHasInformal) || (hasInformal && sampleHasFormal)
  
  if (matchRate < 0.2 || toneMismatch) {
    return {
      comment: {
        severity: 'warning',
        category: 'voice',
        content: 'El tono o vocabulario no coincide con tu estilo habitual. Revisá que suene auténtico y natural para vos.',
        metadata: {
          match_rate: matchRate,
          tone_mismatch: toneMismatch,
          suggestions: [
            'Usar palabras y expresiones que usás normalmente',
            'Mantener el nivel de formalidad de tus otros posts',
            'Evitar jerga o términos que no usarías en persona'
          ]
        }
      },
      penalty: 20
    }
  }
  
  return { penalty: 0 }
}

/**
 * Detect repetition
 */
function analyzeRepetition(content: string): { comment?: ReviewComment; penalty: number } {
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  const wordCounts = new Map<string, number>()
  
  words.forEach(word => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
  })
  
  const repeated = Array.from(wordCounts.entries())
    .filter(([_, count]) => count > 2)
    .sort((a, b) => b[1] - a[1])
  
  if (repeated.length > 0) {
    const topRepeated = repeated.slice(0, 3).map(([word, count]) => `"${word}" (${count}x)`)
    
    return {
      comment: {
        severity: 'info',
        category: 'repetition',
        content: `Detecté palabras repetidas: ${topRepeated.join(', ')}. Considerá usar sinónimos para mayor variedad.`,
        metadata: {
          repeated_words: repeated.map(([word, count]) => ({ word, count })),
          suggestions: [
            'Usar sinónimos para palabras repetidas',
            'Reformular frases para evitar repetición',
            'Eliminar palabras innecesarias'
          ]
        }
      },
      penalty: 10
    }
  }
  
  return { penalty: 0 }
}

/**
 * Analyze structure
 */
function analyzeStructure(content: string, channel: string): { comment?: ReviewComment; penalty: number } {
  const lines = content.split('\n').filter(l => l.trim())
  
  // Twitter: prefer short paragraphs
  if (channel === 'twitter') {
    const longLines = lines.filter(l => l.length > 280)
    if (longLines.length > 0) {
      return {
        comment: {
          severity: 'warning',
          category: 'structure',
          content: 'Algunas líneas son muy largas para Twitter. Considerá dividirlas en tweets más cortos o usar un thread.',
          metadata: {
            long_lines: longLines.length,
            suggestions: [
              'Dividir en múltiples tweets',
              'Usar saltos de línea para mejor legibilidad',
              'Acortar frases largas'
            ]
          }
        },
        penalty: 15
      }
    }
  }
  
  // LinkedIn: prefer paragraphs with breaks
  if (channel === 'linkedin') {
    const hasBreaks = content.includes('\n\n')
    if (!hasBreaks && lines.length > 3) {
      return {
        comment: {
          severity: 'info',
          category: 'structure',
          content: 'Para LinkedIn, considerá agregar espacios entre párrafos para mejor legibilidad.',
          metadata: {
            suggestions: [
              'Agregar líneas en blanco entre párrafos',
              'Usar bullets o listas cuando sea apropiado',
              'Dividir en secciones claras'
            ]
          }
        },
        penalty: 5
      }
    }
  }
  
  return { penalty: 0 }
}

/**
 * Check length
 */
function analyzeLength(content: string, channel: string): { comment?: ReviewComment; penalty: number } {
  const length = content.length
  
  if (channel === 'twitter') {
    if (length > 280) {
      return {
        comment: {
          severity: 'error',
          category: 'length',
          content: `El contenido excede el límite de Twitter (${length}/280 caracteres). Necesitás acortarlo o convertirlo en thread.`,
          metadata: {
            current_length: length,
            max_length: 280,
            overflow: length - 280,
            suggestions: [
              'Eliminar palabras innecesarias',
              'Usar abreviaciones apropiadas',
              'Dividir en múltiples tweets'
            ]
          }
        },
        penalty: 25
      }
    }
  }
  
  if (channel === 'linkedin') {
    if (length > 3000) {
      return {
        comment: {
          severity: 'warning',
          category: 'length',
          content: `El post es muy largo (${length} caracteres). LinkedIn permite hasta 3000, pero posts más cortos (1300-1500) suelen tener mejor engagement.`,
          metadata: {
            current_length: length,
            ideal_length: 1300,
            max_length: 3000,
            suggestions: [
              'Resumir puntos principales',
              'Mover detalles a comentarios',
              'Dividir en múltiples posts'
            ]
          }
        },
        penalty: 15
      }
    }
  }
  
  return { penalty: 0 }
}
