/**
 * Run Evaluation Script
 * Executes golden dataset tests and generates report
 */

import { runEvaluations } from '../src/lib/evaluation/runner'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { processCorrection } from '../src/lib/services/voice-learning'
import { generateDraft } from '../src/lib/services/draft-generation'
import { 
  CORRECTION_TESTS, 
  SCORING_TESTS, 
  GENERATION_TESTS 
} from '../src/lib/evaluation/golden-dataset'
import {
  evaluateCorrection,
  evaluateScoring,
  evaluateGeneration,
  calculateMetrics,
  EvaluationResult
} from '../src/lib/evaluation/evaluators'

// Setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
})

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Run correction tests
 */
async function runCorrectionTests(): Promise<EvaluationResult[]> {
  console.log('\n🧪 Running Correction Tests...')
  const results: EvaluationResult[] = []
  
  for (const test of CORRECTION_TESTS) {
    console.log(`  - ${test.id}: ${test.metadata.description}`)
    
    try {
      const startTime = Date.now()
      
      // Run actual service
      const result = await processCorrection(
        {
          original_text: test.input.original,
          corrected_text: test.input.corrected,
          brain_id: 'test-brain',
          current_rules: [],
          current_score: 85
        },
        groq
      )
      
      const duration = Date.now() - startTime
      
      // Evaluate result
      const evaluation = evaluateCorrection(test, {
        rule: result.extractedRule.rule,
        category: result.extractedRule.category,
        confidence: result.extractedRule.confidence,
        isDuplicate: result.isDuplicate
      })
      
      evaluation.metadata.duration_ms = duration
      results.push(evaluation)
      
      console.log(`    ${evaluation.passed ? '✅' : '❌'} Score: ${evaluation.score}/100`)
    } catch (error) {
      console.error(`    ❌ Error:`, error)
      results.push({
        test_id: test.id,
        passed: false,
        score: 0,
        details: {
          expected: test.expected,
          actual: null,
          errors: [(error as Error).message]
        },
        metadata: {
          duration_ms: 0,
          timestamp: new Date().toISOString()
        }
      })
    }
  }
  
  return results
}

/**
 * Run scoring tests
 */
async function runScoringTests(): Promise<EvaluationResult[]> {
  console.log('\n🎯 Running Scoring Tests...')
  const results: EvaluationResult[] = []
  
  for (const test of SCORING_TESTS) {
    console.log(`  - ${test.id}: ${test.metadata.description}`)
    
    try {
      const startTime = Date.now()
      
      // Run actual service
      const result = await processCorrection(
        {
          original_text: test.input.original,
          corrected_text: test.input.corrected,
          brain_id: 'test-brain',
          current_rules: [],
          current_score: 85
        },
        groq
      )
      
      const duration = Date.now() - startTime
      
      // Evaluate result
      const evaluation = evaluateScoring(test, result.scoreDelta)
      evaluation.metadata.duration_ms = duration
      results.push(evaluation)
      
      console.log(`    ${evaluation.passed ? '✅' : '❌'} Score: ${evaluation.score}/100 (delta: ${result.scoreDelta})`)
    } catch (error) {
      console.error(`    ❌ Error:`, error)
      results.push({
        test_id: test.id,
        passed: false,
        score: 0,
        details: {
          expected: test.expected,
          actual: null,
          errors: [(error as Error).message]
        },
        metadata: {
          duration_ms: 0,
          timestamp: new Date().toISOString()
        }
      })
    }
  }
  
  return results
}

/**
 * Run generation tests
 */
async function runGenerationTests(): Promise<EvaluationResult[]> {
  console.log('\n📝 Running Generation Tests...')
  const results: EvaluationResult[] = []
  
  for (const test of GENERATION_TESTS) {
    console.log(`  - ${test.id}: ${test.metadata.description}`)
    
    try {
      const startTime = Date.now()
      
      // Mock brain data
      const brain = {
        id: 'test-brain',
        user_id: TEST_USER_ID,
        sample_texts: test.input.sample_texts,
        rules: test.input.rules,
        voice_match_score: 85,
        corrections_count: 0,
        is_active: true
      }
      
      // Run actual service
      const result = await generateDraft(
        {
          topic: test.input.topic,
          channel: test.input.channel,
          format: undefined,
          brain,
          recentCorrections: []
        },
        groq
      )
      
      const duration = Date.now() - startTime
      
      // Evaluate result
      const evaluation = evaluateGeneration(test, result.content)
      evaluation.metadata.duration_ms = duration
      results.push(evaluation)
      
      console.log(`    ${evaluation.passed ? '✅' : '❌'} Score: ${evaluation.score}/100`)
    } catch (error) {
      console.error(`    ❌ Error:`, error)
      results.push({
        test_id: test.id,
        passed: false,
        score: 0,
        details: {
          expected: test.expected,
          actual: null,
          errors: [(error as Error).message]
        },
        metadata: {
          duration_ms: 0,
          timestamp: new Date().toISOString()
        }
      })
    }
  }
  
  return results
}

/**
 * Main evaluation runner
 */
async function main() {
  console.log('🚀 Starting Ghostwriter Evaluation\n')
  console.log('=' .repeat(60))
  
  const allResults: EvaluationResult[] = []
  
  // Run all test suites
  const correctionResults = await runCorrectionTests()
  allResults.push(...correctionResults)
  
  const scoringResults = await runScoringTests()
  allResults.push(...scoringResults)
  
  const generationResults = await runGenerationTests()
  allResults.push(...generationResults)
  
  // Calculate metrics
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 EVALUATION RESULTS\n')
  
  const metrics = calculateMetrics(allResults)
  
  console.log(`Total Tests: ${metrics.total}`)
  console.log(`Passed: ${metrics.passed} ✅`)
  console.log(`Failed: ${metrics.failed} ❌`)
  console.log(`Pass Rate: ${metrics.pass_rate.toFixed(1)}%`)
  console.log(`Avg Score: ${metrics.avg_score.toFixed(1)}/100`)
  
  // Breakdown by type
  console.log('\n📋 Breakdown by Type:')
  const correctionMetrics = calculateMetrics(correctionResults)
  console.log(`  Correction: ${correctionMetrics.passed}/${correctionMetrics.total} (${correctionMetrics.pass_rate.toFixed(1)}%)`)
  
  const scoringMetrics = calculateMetrics(scoringResults)
  console.log(`  Scoring: ${scoringMetrics.passed}/${scoringMetrics.total} (${scoringMetrics.pass_rate.toFixed(1)}%)`)
  
  const generationMetrics = calculateMetrics(generationResults)
  console.log(`  Generation: ${generationMetrics.passed}/${generationMetrics.total} (${generationMetrics.pass_rate.toFixed(1)}%)`)
  
  // Failed tests details
  const failed = allResults.filter(r => !r.passed)
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:')
    failed.forEach(r => {
      console.log(`  - ${r.test_id}: ${r.details.errors.join(', ')}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  // Exit code based on pass rate
  if (metrics.pass_rate < 80) {
    console.log('\n❌ EVALUATION FAILED: Pass rate below 80%\n')
    process.exit(1)
  }
  
  console.log('\n✅ EVALUATION PASSED: All tests meet quality threshold\n')
  process.exit(0)
}

// Run
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
