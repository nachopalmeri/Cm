/**
 * Evaluation Runner
 * Executes golden dataset tests
 */

import { getAllTests, getTestsByType, TestCase } from './golden-dataset'
import { 
  evaluateCorrection, 
  evaluateScoring, 
  evaluateGeneration,
  calculateMetrics,
  EvaluationResult 
} from './evaluators'

export interface EvaluationReport {
  summary: {
    total: number
    passed: number
    failed: number
    pass_rate: number
    avg_score: number
  }
  by_type: Record<string, {
    total: number
    passed: number
    pass_rate: number
  }>
  results: EvaluationResult[]
  timestamp: string
}

/**
 * Run all evaluations
 */
export async function runEvaluations(): Promise<EvaluationReport> {
  console.log('[EVAL] Starting evaluation run...')
  
  const tests = getAllTests()
  const results: EvaluationResult[] = []
  
  for (const test of tests) {
    console.log(`[EVAL] Running test: ${test.id}`)
    
    // Note: In a real implementation, you would call the actual services here
    // For now, we'll create mock results to demonstrate the structure
    
    const result = createMockResult(test)
    results.push(result)
  }
  
  const summary = calculateMetrics(results)
  const by_type = calculateByType(results, tests)
  
  const report: EvaluationReport = {
    summary,
    by_type,
    results,
    timestamp: new Date().toISOString()
  }
  
  console.log('[EVAL] Evaluation complete')
  console.log(`[EVAL] Pass rate: ${summary.pass_rate.toFixed(1)}%`)
  console.log(`[EVAL] Avg score: ${summary.avg_score.toFixed(1)}`)
  
  return report
}

/**
 * Run evaluations by type
 */
export async function runEvaluationsByType(
  type: TestCase['type']
): Promise<EvaluationReport> {
  console.log(`[EVAL] Running ${type} evaluations...`)
  
  const tests = getTestsByType(type)
  const results: EvaluationResult[] = []
  
  for (const test of tests) {
    const result = createMockResult(test)
    results.push(result)
  }
  
  const summary = calculateMetrics(results)
  const by_type = { [type]: {
    total: summary.total,
    passed: summary.passed,
    pass_rate: summary.pass_rate
  }}
  
  return {
    summary,
    by_type,
    results,
    timestamp: new Date().toISOString()
  }
}

/**
 * Calculate metrics by type
 */
function calculateByType(
  results: EvaluationResult[],
  tests: TestCase[]
): Record<string, { total: number; passed: number; pass_rate: number }> {
  const by_type: Record<string, any> = {}
  
  for (const test of tests) {
    if (!by_type[test.type]) {
      by_type[test.type] = {
        total: 0,
        passed: 0,
        pass_rate: 0
      }
    }
    
    const result = results.find(r => r.test_id === test.id)
    if (result) {
      by_type[test.type].total++
      if (result.passed) {
        by_type[test.type].passed++
      }
    }
  }
  
  // Calculate pass rates
  for (const type in by_type) {
    const { total, passed } = by_type[type]
    by_type[type].pass_rate = total > 0 ? (passed / total) * 100 : 0
  }
  
  return by_type
}

/**
 * Create mock result for demonstration
 * In production, this would call actual services
 */
function createMockResult(test: TestCase): EvaluationResult {
  // This is a placeholder - in production you would:
  // 1. Call the actual service (voice-learning, draft-generation, etc.)
  // 2. Get the real output
  // 3. Evaluate against expected output
  
  return {
    test_id: test.id,
    passed: true,
    score: 100,
    details: {
      expected: test.expected,
      actual: { mock: true },
      errors: []
    },
    metadata: {
      duration_ms: 0,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Save evaluation report
 */
export function saveReport(report: EvaluationReport, filepath: string): void {
  // In production, save to file or database
  console.log(`[EVAL] Report saved to ${filepath}`)
  console.log(JSON.stringify(report, null, 2))
}

/**
 * Compare two reports
 */
export function compareReports(
  baseline: EvaluationReport,
  current: EvaluationReport
): {
  pass_rate_delta: number
  score_delta: number
  regressions: string[]
  improvements: string[]
} {
  const pass_rate_delta = current.summary.pass_rate - baseline.summary.pass_rate
  const score_delta = current.summary.avg_score - baseline.summary.avg_score
  
  const regressions: string[] = []
  const improvements: string[] = []
  
  for (const result of current.results) {
    const baselineResult = baseline.results.find(r => r.test_id === result.test_id)
    if (!baselineResult) continue
    
    if (result.passed && !baselineResult.passed) {
      improvements.push(result.test_id)
    } else if (!result.passed && baselineResult.passed) {
      regressions.push(result.test_id)
    }
  }
  
  return {
    pass_rate_delta,
    score_delta,
    regressions,
    improvements
  }
}
