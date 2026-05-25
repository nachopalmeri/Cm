/**
 * Diff Analyzer
 * Analyzes differences between original and corrected text
 * to extract specific patterns for rule generation
 */

export interface DiffAnalysis {
  wordsRemoved: string[]
  wordsAdded: string[]
  phrasesChanged: Array<{
    before: string
    after: string
  }>
  structureChanges: {
    lengthChange: number
    sentenceCountChange: number
    hasHashtagChanges: boolean
    hasEmojiChanges: boolean
  }
  categories: Array<'vocabulary' | 'structure' | 'tone' | 'format'>
}

/**
 * Analyze the diff between original and corrected text
 */
export function analyzeDiff(original: string, corrected: string): DiffAnalysis {
  const originalWords = tokenize(original)
  const correctedWords = tokenize(corrected)
  
  // Find removed and added words
  const wordsRemoved = originalWords.filter(w => !correctedWords.includes(w))
  const wordsAdded = correctedWords.filter(w => !originalWords.includes(w))
  
  // Find phrase changes (sequences of 2-5 words)
  const phrasesChanged = findPhraseChanges(original, corrected)
  
  // Analyze structure changes
  const structureChanges = {
    lengthChange: corrected.length - original.length,
    sentenceCountChange: countSentences(corrected) - countSentences(original),
    hasHashtagChanges: hasHashtagDiff(original, corrected),
    hasEmojiChanges: hasEmojiDiff(original, corrected)
  }
  
  // Determine categories based on changes
  const categories = inferCategories({
    wordsRemoved,
    wordsAdded,
    phrasesChanged,
    structureChanges
  })
  
  return {
    wordsRemoved,
    wordsAdded,
    phrasesChanged,
    structureChanges,
    categories
  }
}

/**
 * Tokenize text into words (lowercase, no punctuation)
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s#@]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
}

/**
 * Find phrase-level changes between texts
 */
function findPhraseChanges(original: string, corrected: string): Array<{ before: string; after: string }> {
  const changes: Array<{ before: string; after: string }> = []
  
  // Simple heuristic: find common patterns
  const originalSentences = original.split(/[.!?]+/).filter(s => s.trim())
  const correctedSentences = corrected.split(/[.!?]+/).filter(s => s.trim())
  
  // If sentence count is similar, try to match them
  if (Math.abs(originalSentences.length - correctedSentences.length) <= 1) {
    const minLen = Math.min(originalSentences.length, correctedSentences.length)
    for (let i = 0; i < minLen; i++) {
      const before = originalSentences[i].trim()
      const after = correctedSentences[i].trim()
      if (before !== after && before.length > 10 && after.length > 10) {
        changes.push({ before, after })
      }
    }
  }
  
  return changes
}

/**
 * Count sentences in text
 */
function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter(s => s.trim()).length
}

/**
 * Check if hashtags changed
 */
function hasHashtagDiff(original: string, corrected: string): boolean {
  const originalHashtags = (original.match(/#\w+/g) || []).sort()
  const correctedHashtags = (corrected.match(/#\w+/g) || []).sort()
  return JSON.stringify(originalHashtags) !== JSON.stringify(correctedHashtags)
}

/**
 * Check if emojis changed
 */
function hasEmojiDiff(original: string, corrected: string): boolean {
  // Simple emoji detection without unicode property escapes
  const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/g
  const originalEmojis = (original.match(emojiRegex) || []).sort()
  const correctedEmojis = (corrected.match(emojiRegex) || []).sort()
  return JSON.stringify(originalEmojis) !== JSON.stringify(correctedEmojis)
}

/**
 * Infer rule categories based on the types of changes detected
 */
function inferCategories(analysis: {
  wordsRemoved: string[]
  wordsAdded: string[]
  phrasesChanged: Array<{ before: string; after: string }>
  structureChanges: DiffAnalysis['structureChanges']
}): Array<'vocabulary' | 'structure' | 'tone' | 'format'> {
  const categories: Set<'vocabulary' | 'structure' | 'tone' | 'format'> = new Set()
  
  // Vocabulary: word substitutions
  if (analysis.wordsRemoved.length > 0 || analysis.wordsAdded.length > 0) {
    categories.add('vocabulary')
  }
  
  // Structure: sentence count or length changes
  if (Math.abs(analysis.structureChanges.sentenceCountChange) > 0 || 
      Math.abs(analysis.structureChanges.lengthChange) > 50) {
    categories.add('structure')
  }
  
  // Format: hashtag or emoji changes
  if (analysis.structureChanges.hasHashtagChanges || analysis.structureChanges.hasEmojiChanges) {
    categories.add('format')
  }
  
  // Tone: phrase-level changes (implies style/tone shift)
  if (analysis.phrasesChanged.length > 0) {
    categories.add('tone')
  }
  
  // Default to vocabulary if no categories detected
  if (categories.size === 0) {
    categories.add('vocabulary')
  }
  
  return Array.from(categories)
}
