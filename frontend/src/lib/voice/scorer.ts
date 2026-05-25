/**
 * Voice Match Scorer
 * Calculates dynamic voice match score based on correction quality and impact
 */

interface CorrectionImpact {
  textSimilarity: number // 0-1: how similar original vs corrected
  changeSignificance: number // 0-1: how significant the change
  ruleQuality: number // 0-1: quality of extracted rule
  consistency: number // 0-1: consistency with existing rules
}

/**
 * Calculate voice match score improvement based on correction impact
 * Returns a score delta between -5 and +10
 */
export function calculateVoiceMatchDelta(
  originalText: string,
  correctedText: string,
  extractedRule: string,
  existingRules: any[],
  currentScore: number
): number {
  const impact = analyzeCorrectionImpact(
    originalText,
    correctedText,
    extractedRule,
    existingRules
  )
  
  // Base delta from change significance
  let delta = impact.changeSignificance * 8 // 0-8 points
  
  // Bonus for high-quality rules
  if (impact.ruleQuality > 0.8) {
    delta += 2
  }
  
  // Penalty for inconsistency with existing rules
  if (impact.consistency < 0.5) {
    delta -= 3
  }
  
  // Diminishing returns at high scores
  if (currentScore > 90) {
    delta *= 0.5
  } else if (currentScore > 80) {
    delta *= 0.7
  }
  
  // Clamp between -5 and +10
  return Math.max(-5, Math.min(10, Math.round(delta)))
}

/**
 * Analyze the impact of a correction
 */
function analyzeCorrectionImpact(
  originalText: string,
  correctedText: string,
  extractedRule: string,
  existingRules: any[]
): CorrectionImpact {
  return {
    textSimilarity: calculateTextSimilarity(originalText, correctedText),
    changeSignificance: calculateChangeSignificance(originalText, correctedText),
    ruleQuality: assessRuleQuality(extractedRule),
    consistency: assessConsistency(extractedRule, existingRules)
  }
}

/**
 * Calculate similarity between two texts (Jaccard similarity)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(tokenize(text1))
  const words2 = new Set(tokenize(text2))
  
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

/**
 * Calculate how significant the change is
 * More significant = lower similarity + meaningful changes
 */
function calculateChangeSignificance(original: string, corrected: string): number {
  const similarity = calculateTextSimilarity(original, corrected)
  
  // Inverse similarity (more different = more significant)
  const difference = 1 - similarity
  
  // Length change ratio
  const lengthRatio = Math.abs(corrected.length - original.length) / Math.max(original.length, 1)
  
  // Word count change
  const originalWords = tokenize(original).length
  const correctedWords = tokenize(corrected).length
  const wordCountChange = Math.abs(correctedWords - originalWords) / Math.max(originalWords, 1)
  
  // Weighted average
  return (difference * 0.5) + (lengthRatio * 0.25) + (wordCountChange * 0.25)
}

/**
 * Assess the quality of an extracted rule
 */
function assessRuleQuality(rule: string): number {
  let quality = 0.5 // Base quality
  
  // Good rules are specific and actionable
  if (rule.includes(':')) quality += 0.2 // Has action:reason format
  if (rule.length > 30) quality += 0.1 // Detailed enough
  if (rule.length < 150) quality += 0.1 // Not too verbose
  if (/\b(usar|evitar|preferir|cambiar|reemplazar)\b/i.test(rule)) quality += 0.1 // Action verbs
  
  return Math.min(1, quality)
}

/**
 * Assess consistency with existing rules
 */
function assessConsistency(newRule: string, existingRules: any[]): number {
  if (existingRules.length === 0) return 1 // First rule is always consistent
  
  // Check for contradictions
  const newRuleLower = newRule.toLowerCase()
  let contradictions = 0
  
  for (const existing of existingRules) {
    const existingRuleLower = (existing.rule || '').toLowerCase()
    
    // Simple contradiction detection
    if (newRuleLower.includes('evitar') && existingRuleLower.includes('usar')) {
      const newWords = extractKeyWords(newRuleLower)
      const existingWords = extractKeyWords(existingRuleLower)
      const overlap = newWords.filter(w => existingWords.includes(w))
      if (overlap.length > 0) contradictions++
    }
  }
  
  // Return consistency score (fewer contradictions = higher consistency)
  return Math.max(0, 1 - (contradictions / existingRules.length))
}

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
}

/**
 * Extract key words from a rule
 */
function extractKeyWords(rule: string): string[] {
  // Remove common words
  const stopWords = ['el', 'la', 'de', 'en', 'y', 'a', 'que', 'es', 'por', 'con', 'para']
  return tokenize(rule).filter(w => !stopWords.includes(w))
}
