/**
 * Evaluators
 * Functions to evaluate system quality
 */

import { TestCase } from './golden-dataset'

export interface EvaluationResult {
  test_id: string
  passed: boolean
  score: number
  details: {
    expected: any
    actual: any
    errors: string[]
  }
  metadata: {
    duration_ms: number
    timestamp: string
  }
}

/**
 * Evaluate correction quality
 */
export function evaluateCorrection(
  testCase: TestCase,
  actualOutput: {
    rule: string
    category: string
    confidence: number
    isDuplicate?: boolean
  }
): EvaluationResult {
  const errors: string[] = []
  let score = 100
  
  // Check if should skip (duplicate detection)
  if (testCase.expected.should_skip && !actualOutput.isDuplicate) {
    errors.push('Expected duplicate detection but rule was extracted')
    score -= 50
  }
  
  // Check rule pattern
  if (!testCase.expected.should_skip) {
    if (!testCase.expected.rule_pattern.test(actualOutput.rule)) {
      errors.push(`Rule doesn't match expected pattern: ${testCase.expected.rule_pattern}`)
      score -= 30
    }
    
    // Check category
    if (actualOutput.category !== testCase.expected.category) {
      errors.push(`Category mismatch: expected ${testCase.expected.category}, got ${actualOutput.category}`)
      score -= 20
    }
    
    // Check confidence
    if (actualOutput.confidence < testCase.expected.min_confidence) {
      errors.push(`Confidence too low: expected >= ${testCase.expected.min_confidence}, got ${actualOutput.confidence}`)
      score -= 20
    }
  }
  
  return {
    test_id: testCase.id,
    passed: errors.length === 0,
    score: Math.max(0, score),
    details: {
      expected: testCase.expected,
      actual: actualOutput,
      errors
    },
    metadata: {
      duration_ms: 0,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Evaluate voice match scoring
 */
export function evaluateScoring(
  testCase: TestCase,
  actualDelta: number
): EvaluationResult {
  const errors: string[] = []
  let score = 100
  
  const { min_delta, max_delta } = testCase.expected
  
  // Check if delta is in expected range
  if (actualDelta < min_delta) {
    errors.push(`Delta too low: expected >= ${min_delta}, got ${actualDelta}`)
    score -= 50
  }
  
  if (actualDelta > max_delta) {
    errors.push(`Delta too high: expected <= ${max_delta}, got ${actualDelta}`)
    score -= 50
  }
  
  return {
    test_id: testCase.id,
    passed: errors.length === 0,
    score: Math.max(0, score),
    details: {
      expected: testCase.expected,
      actual: { delta: actualDelta },
      errors
    },
    metadata: {
      duration_ms: 0,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Evaluate draft generation
 */
export function evaluateGeneration(
  testCase: TestCase,
  actualContent: string
): EvaluationResult {
  const errors: string[] = []
  let score = 100
  
  const { max_length, should_contain, should_not_contain } = testCase.expected
  
  // Check length
  if (max_length && actualContent.length > max_length) {
    errors.push(`Content too long: expected <= ${max_length}, got ${actualContent.length}`)
    score -= 20
  }
  
  // Check required content
  if (should_contain) {
    for (const term of should_contain) {
      if (!actualContent.toLowerCase().includes(term.toLowerCase())) {
        errors.push(`Missing required term: "${term}"`)
        score -= 15
      }
    }
  }
  
  // Check forbidden content
  if (should_not_contain) {
    for (const term of should_not_contain) {
      if (actualContent.toLowerCase().includes(term.toLowerCase())) {
        errors.push(`Contains forbidden term: "${term}"`)
        score -= 15
      }
    }
  }
  
  return {
    test_id: testCase.id,
    passed: errors.length === 0,
    score: Math.max(0, score),
    details: {
      expected: testCase.expected,
      actual: { content: actualContent.slice(0, 200) + '...' },
      errors
    },
    metadata: {
      duration_ms: 0,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Calculate aggregate metrics
 */
export function calculateMetrics(results: EvaluationResult[]): {
  total: number
  passed: number
  failed: number
  pass_rate: number
  avg_score: number
} {
  const total = results.length
  const passed = results.filter(r => r.passed).length
  const failed = total - passed
  const pass_rate = total > 0 ? (passed / total) * 100 : 0
  const avg_score = total > 0 
    ? results.reduce((sum, r) => sum + r.score, 0) / total 
    : 0
  
  return {
    total,
    passed,
    failed,
    pass_rate,
    avg_score
  }
}
