/**
 * Output Guard
 * Filters and validates AI-generated content
 */

export interface FilterResult {
  safe: boolean
  filtered: string
  flags: string[]
}

/**
 * Filter AI-generated content
 */
export function filterOutput(content: string): FilterResult {
  const flags: string[] = []
  let filtered = content
  
  // Check for offensive content (basic implementation)
  if (containsOffensiveContent(content)) {
    flags.push('offensive_content')
  }
  
  // Check for PII (basic patterns)
  const piiDetected = detectPII(content)
  if (piiDetected.length > 0) {
    flags.push('pii_detected')
    filtered = redactPII(content, piiDetected)
  }
  
  // Check for hallucination markers (basic)
  if (containsHallucinationMarkers(content)) {
    flags.push('possible_hallucination')
  }
  
  // Check for code injection attempts
  if (containsCodeInjection(content)) {
    flags.push('code_injection')
  }
  
  return {
    safe: flags.length === 0,
    filtered,
    flags
  }
}

/**
 * Check for offensive content (basic keyword matching)
 */
function containsOffensiveContent(text: string): boolean {
  // This is a very basic implementation
  // In production, use a proper content moderation API
  const offensivePatterns = [
    /\b(fuck|shit|damn)\b/i,
    // Add more patterns as needed
  ]
  
  return offensivePatterns.some(pattern => pattern.test(text))
}

/**
 * Detect PII (Personal Identifiable Information)
 */
function detectPII(text: string): Array<{ type: string; value: string }> {
  const pii: Array<{ type: string; value: string }> = []
  
  // Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const emails = text.match(emailRegex)
  if (emails) {
    emails.forEach(email => pii.push({ type: 'email', value: email }))
  }
  
  // Phone numbers (basic patterns)
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g
  const phones = text.match(phoneRegex)
  if (phones) {
    phones.forEach(phone => pii.push({ type: 'phone', value: phone }))
  }
  
  // Credit card numbers (basic pattern)
  const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
  const ccs = text.match(ccRegex)
  if (ccs) {
    ccs.forEach(cc => pii.push({ type: 'credit_card', value: cc }))
  }
  
  return pii
}

/**
 * Redact PII from text
 */
function redactPII(text: string, pii: Array<{ type: string; value: string }>): string {
  let redacted = text
  
  for (const item of pii) {
    const replacement = `[REDACTED_${item.type.toUpperCase()}]`
    redacted = redacted.replace(new RegExp(escapeRegex(item.value), 'g'), replacement)
  }
  
  return redacted
}

/**
 * Check for hallucination markers
 */
function containsHallucinationMarkers(text: string): boolean {
  // Basic heuristics for potential hallucinations
  const markers = [
    /as an ai/i,
    /i don't have access/i,
    /i cannot/i,
    /i'm not able to/i,
    /\[citation needed\]/i,
    /according to my training data/i
  ]
  
  return markers.some(marker => marker.test(text))
}

/**
 * Check for code injection attempts
 */
function containsCodeInjection(text: string): boolean {
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
    /\$\{.*\}/,  // Template literal injection
    /`.*`/       // Backtick strings
  ]
  
  return injectionPatterns.some(pattern => pattern.test(text))
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Validate content length
 */
export function validateContentLength(
  content: string,
  maxLength: number
): { valid: boolean; length: number; maxLength: number } {
  return {
    valid: content.length <= maxLength,
    length: content.length,
    maxLength
  }
}

/**
 * Check content quality (basic heuristics)
 */
export function assessContentQuality(content: string): {
  score: number
  issues: string[]
} {
  const issues: string[] = []
  let score = 100
  
  // Check for repetition
  const words = content.toLowerCase().split(/\s+/)
  const uniqueWords = new Set(words)
  const repetitionRatio = uniqueWords.size / words.length
  
  if (repetitionRatio < 0.5) {
    issues.push('high_repetition')
    score -= 20
  }
  
  // Check for very short sentences (might indicate incomplete generation)
  const sentences = content.split(/[.!?]+/)
  const avgSentenceLength = content.length / sentences.length
  
  if (avgSentenceLength < 20) {
    issues.push('short_sentences')
    score -= 10
  }
  
  // Check for incomplete sentences
  if (!content.trim().match(/[.!?]$/)) {
    issues.push('incomplete_ending')
    score -= 15
  }
  
  return {
    score: Math.max(0, score),
    issues
  }
}
