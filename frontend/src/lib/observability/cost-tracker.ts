/**
 * Cost Tracker
 * Tracks Groq API costs and usage
 */

import { createClient } from '@supabase/supabase-js'

export interface CostRecord {
  id: string
  trace_id?: string
  operation: string
  model: string
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  cost_usd: number
  timestamp: string
  metadata: Record<string, any>
}

/**
 * Groq pricing (as of Jan 2025)
 * https://groq.com/pricing/
 */
const GROQ_PRICING = {
  'llama-3.3-70b-versatile': {
    prompt: 0.59 / 1_000_000,      // $0.59 per 1M tokens
    completion: 0.79 / 1_000_000   // $0.79 per 1M tokens
  }
}

/**
 * In-memory cost storage (fallback)
 */
const costs: CostRecord[] = []

/**
 * Get Supabase client
 */
function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * Track API cost
 */
export async function trackCost(
  operation: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  trace_id?: string,
  metadata: Record<string, any> = {}
): Promise<CostRecord> {
  const pricing = GROQ_PRICING[model as keyof typeof GROQ_PRICING]
  
  if (!pricing) {
    console.warn(`[COST] Unknown model: ${model}`)
    return {
      id: generateId(),
      trace_id,
      operation,
      model,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens
      },
      cost_usd: 0,
      timestamp: new Date().toISOString(),
      metadata
    }
  }
  
  const cost_usd = (promptTokens * pricing.prompt) + (completionTokens * pricing.completion)
  
  const record: CostRecord = {
    id: generateId(),
    trace_id,
    operation,
    model,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: promptTokens + completionTokens
    },
    cost_usd,
    timestamp: new Date().toISOString(),
    metadata
  }
  
  costs.push(record)
  
  console.log(`[COST] ${operation}: $${cost_usd.toFixed(4)} (${promptTokens + completionTokens} tokens)`)
  
  // Persist to Supabase
  await persistCost(record)
  
  return record
}

/**
 * Persist cost to Supabase
 */
async function persistCost(record: CostRecord): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) {
    console.warn('[COST] Supabase not configured, skipping persistence')
    return
  }
  
  try {
    const { error } = await supabase
      .from('costs')
      .insert({
        id: record.id,
        trace_id: record.trace_id,
        operation: record.operation,
        model: record.model,
        tokens: record.tokens,
        cost_usd: record.cost_usd,
        timestamp: record.timestamp,
        metadata: record.metadata
      })
    
    if (error) {
      console.error('[COST] Failed to persist cost:', error)
    }
  } catch (error) {
    console.error('[COST] Error persisting cost:', error)
  }
}

/**
 * Get total cost
 */
export function getTotalCost(filter?: {
  operation?: string
  model?: string
  since?: string
  until?: string
}): number {
  let filtered = costs
  
  if (filter) {
    if (filter.operation) {
      filtered = filtered.filter(c => c.operation === filter.operation)
    }
    if (filter.model) {
      filtered = filtered.filter(c => c.model === filter.model)
    }
    if (filter.since) {
      filtered = filtered.filter(c => c.timestamp >= filter.since!)
    }
    if (filter.until) {
      filtered = filtered.filter(c => c.timestamp <= filter.until!)
    }
  }
  
  return filtered.reduce((sum, c) => sum + c.cost_usd, 0)
}

/**
 * Get total tokens
 */
export function getTotalTokens(filter?: {
  operation?: string
  model?: string
}): number {
  let filtered = costs
  
  if (filter) {
    if (filter.operation) {
      filtered = filtered.filter(c => c.operation === filter.operation)
    }
    if (filter.model) {
      filtered = filtered.filter(c => c.model === filter.model)
    }
  }
  
  return filtered.reduce((sum, c) => sum + c.tokens.total, 0)
}

/**
 * Get cost breakdown by operation
 */
export function getCostBreakdown(): Record<string, {
  count: number
  total_cost: number
  total_tokens: number
  avg_cost: number
}> {
  const breakdown: Record<string, any> = {}
  
  for (const record of costs) {
    if (!breakdown[record.operation]) {
      breakdown[record.operation] = {
        count: 0,
        total_cost: 0,
        total_tokens: 0,
        avg_cost: 0
      }
    }
    
    breakdown[record.operation].count++
    breakdown[record.operation].total_cost += record.cost_usd
    breakdown[record.operation].total_tokens += record.tokens.total
  }
  
  // Calculate averages
  for (const op in breakdown) {
    breakdown[op].avg_cost = breakdown[op].total_cost / breakdown[op].count
  }
  
  return breakdown
}

/**
 * Get all cost records
 */
export function getAllCosts(): CostRecord[] {
  return [...costs]
}

/**
 * Clear old cost records (keep last 1000)
 */
export function cleanupCosts(): void {
  if (costs.length <= 1000) return
  
  costs.splice(0, costs.length - 1000)
  console.log(`[COST] Cleaned up old records, kept ${costs.length}`)
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if cost exceeds threshold
 */
export function checkCostThreshold(
  threshold_usd: number,
  period: 'hour' | 'day' | 'week' | 'month'
): {
  exceeded: boolean
  current: number
  threshold: number
  percentage: number
} {
  const now = new Date()
  let since: Date
  
  switch (period) {
    case 'hour':
      since = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case 'day':
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case 'week':
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
  }
  
  const current = getTotalCost({ since: since.toISOString() })
  const exceeded = current > threshold_usd
  const percentage = (current / threshold_usd) * 100
  
  if (exceeded) {
    console.warn(`[COST] Threshold exceeded: $${current.toFixed(4)} > $${threshold_usd} (${percentage.toFixed(1)}%)`)
  }
  
  return {
    exceeded,
    current,
    threshold: threshold_usd,
    percentage
  }
}
