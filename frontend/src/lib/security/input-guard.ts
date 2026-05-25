/**
 * Input Guard
 * Validates and sanitizes user input
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  sanitized?: any
}

/**
 * Validate topic input
 */
export function validateTopic(topic: string): ValidationResult {
  const errors: string[] = []
  
  // Check if empty
  if (!topic || topic.trim().length === 0) {
    errors.push('Topic cannot be empty')
    return { valid: false, errors }
  }
  
  // Check length
  if (topic.length > 500) {
    errors.push('Topic too long (max 500 characters)')
  }
  
  // Check for suspicious patterns
  if (containsSuspiciousPatterns(topic)) {
    errors.push('Topic contains suspicious patterns')
  }
  
  // Sanitize
  const sanitized = sanitizeText(topic)
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate correction input
 */
export function validateCorrection(
  original: string,
  corrected: string
): ValidationResult {
  const errors: string[] = []
  
  // Check if empty
  if (!original || original.trim().length === 0) {
    errors.push('Original text cannot be empty')
  }
  
  if (!corrected || corrected.trim().length === 0) {
    errors.push('Corrected text cannot be empty')
  }
  
  // Check length
  if (original.length > 2000) {
    errors.push('Original text too long (max 2000 characters)')
  }
  
  if (corrected.length > 2000) {
    errors.push('Corrected text too long (max 2000 characters)')
  }
  
  // Check for suspicious patterns
  if (containsSuspiciousPatterns(original) || containsSuspiciousPatterns(corrected)) {
    errors.push('Text contains suspicious patterns')
  }
  
  // Sanitize
  const sanitized = {
    original: sanitizeText(original),
    corrected: sanitizeText(corrected)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate sample text
 */
export function validateSampleText(text: string): ValidationResult {
  const errors: string[] = []
  
  // Check if empty
  if (!text || text.trim().length === 0) {
    errors.push('Sample text cannot be empty')
    return { valid: false, errors }
  }
  
  // Check length
  if (text.length < 20) {
    errors.push('Sample text too short (min 20 characters)')
  }
  
  if (text.length > 1000) {
    errors.push('Sample text too long (max 1000 characters)')
  }
  
  // Check for suspicious patterns
  if (containsSuspiciousPatterns(text)) {
    errors.push('Sample text contains suspicious patterns')
  }
  
  // Sanitize
  const sanitized = sanitizeText(text)
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Check for suspicious patterns (XSS, injection, etc.)
 */
function containsSuspiciousPatterns(text: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick=, onerror=, etc.
    /<iframe/i,
    /eval\(/i,
    /document\./i,
    /window\./i
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(text))
}

/**
 * Sanitize text (basic XSS prevention)
 */
function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

/**
 * Rate limiting check (simple in-memory implementation)
 */
const rateLimits = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  userId: string,
  operation: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${userId}:${operation}`
  const now = Date.now()
  
  let limit = rateLimits.get(key)
  
  // Reset if window expired
  if (!limit || now > limit.resetAt) {
    limit = {
      count: 0,
      resetAt: now + windowMs
    }
    rateLimits.set(key, limit)
  }
  
  // Check if limit exceeded
  if (limit.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: limit.resetAt
    }
  }
  
  // Increment count
  limit.count++
  
  return {
    allowed: true,
    remaining: maxRequests - limit.count,
    resetAt: limit.resetAt
  }
}

/**
 * Cleanup old rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  
  for (const [key, limit] of rateLimits.entries()) {
    if (now > limit.resetAt) {
      rateLimits.delete(key)
    }
  }
}
