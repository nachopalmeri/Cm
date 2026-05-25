/**
 * Brain Manager Service
 * Handles brand brain CRUD operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface BrainData {
  id: string
  user_id: string
  sample_texts: string[]
  rules: any[]
  voice_match_score: number
  corrections_count: number
  is_active: boolean
}

export interface BrainUpdate {
  sample_texts?: string[]
  rules?: any[]
  voice_match_score?: number
  corrections_count?: number
}

/**
 * Get active brain for user
 */
export async function getActiveBrain(
  userId: string,
  supabase: SupabaseClient<any>
): Promise<BrainData | null> {
  const { data, error } = await supabase
    .from('brand_brains')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()
  
  if (error) {
    console.error('[BRAIN-MANAGER] Error fetching brain:', error)
    return null
  }
  
  return data as BrainData
}

/**
 * Update brain data
 */
export async function updateBrain(
  brainId: string,
  updates: BrainUpdate,
  supabase: SupabaseClient<any>
): Promise<boolean> {
  const { error } = await supabase
    .from('brand_brains')
    .update(updates)
    .eq('id', brainId)
  
  if (error) {
    console.error('[BRAIN-MANAGER] Error updating brain:', error)
    return false
  }
  
  return true
}

/**
 * Add rule to brain (with deduplication)
 */
export async function addRuleToBrain(
  brainId: string,
  rule: any,
  currentRules: any[],
  supabase: SupabaseClient<any>
): Promise<{ success: boolean; isDuplicate: boolean }> {
  // Check for duplicates
  const ruleKey = (rule.rule || '').toLowerCase().trim()
  const isDuplicate = currentRules.some((r: any) => 
    (r.rule || '').toLowerCase().trim() === ruleKey
  )
  
  if (isDuplicate) {
    console.log('[BRAIN-MANAGER] Duplicate rule detected, skipping')
    return { success: true, isDuplicate: true }
  }
  
  // Add rule
  const updatedRules = [...currentRules, rule]
  const success = await updateBrain(brainId, { rules: updatedRules }, supabase)
  
  return { success, isDuplicate: false }
}

/**
 * Increment corrections count
 */
export async function incrementCorrections(
  brainId: string,
  currentCount: number,
  supabase: SupabaseClient<any>
): Promise<boolean> {
  return updateBrain(brainId, { corrections_count: currentCount + 1 }, supabase)
}

/**
 * Update voice match score
 */
export async function updateVoiceScore(
  brainId: string,
  newScore: number,
  supabase: SupabaseClient<any>
): Promise<boolean> {
  return updateBrain(brainId, { voice_match_score: newScore }, supabase)
}
