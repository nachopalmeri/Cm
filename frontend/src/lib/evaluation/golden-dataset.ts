/**
 * Golden Dataset
 * Test cases for evaluation
 */

export interface TestCase {
  id: string
  type: 'correction' | 'generation' | 'scoring'
  input: any
  expected: any
  metadata: {
    description: string
    difficulty: 'easy' | 'medium' | 'hard'
    tags: string[]
  }
}

/**
 * Golden dataset for correction quality
 */
export const CORRECTION_TESTS: TestCase[] = [
  {
    id: 'correction-001',
    type: 'correction',
    input: {
      original: 'Construyo soluciones de IA para builders',
      corrected: 'Construyo herramientas de IA para builders'
    },
    expected: {
      rule_pattern: /herramientas.*soluciones/i,
      category: 'vocabulary',
      min_confidence: 80
    },
    metadata: {
      description: 'Simple word replacement - specific vs generic',
      difficulty: 'easy',
      tags: ['vocabulary', 'specificity']
    }
  },
  {
    id: 'correction-002',
    type: 'correction',
    input: {
      original: 'Desarrollo contenido para fundadores latinos',
      corrected: 'Creo contenido para emprendedores latinos'
    },
    expected: {
      rule_pattern: /creo.*desarrollo|emprendedores.*fundadores/i,
      category: 'vocabulary',
      min_confidence: 75
    },
    metadata: {
      description: 'Multiple word changes - active verb + terminology',
      difficulty: 'medium',
      tags: ['vocabulary', 'tone']
    }
  },
  {
    id: 'correction-003',
    type: 'correction',
    input: {
      original: 'Construyo pruebas de producción de IA para builders latinos que buscan crecer sin perder su esencia #buildersla',
      corrected: 'Construyo herramientas de IA para builders latinos que quieren escalar sin perder autenticidad'
    },
    expected: {
      rule_pattern: /herramientas|escalar|autenticidad/i,
      category: 'vocabulary',
      min_confidence: 85
    },
    metadata: {
      description: 'Complex correction - multiple improvements + hashtag removal',
      difficulty: 'hard',
      tags: ['vocabulary', 'structure', 'hashtags']
    }
  },
  {
    id: 'correction-004',
    type: 'correction',
    input: {
      original: 'por qué la consistencia importa más que la viralidad',
      corrected: 'por qué la consistencia importa más que la viralidad'
    },
    expected: {
      rule_pattern: /no.*cambio|sin.*diferencia/i,
      category: 'tone',
      min_confidence: 70,
      should_skip: true
    },
    metadata: {
      description: 'No change - should detect duplicate',
      difficulty: 'easy',
      tags: ['edge-case', 'duplicate']
    }
  }
]

/**
 * Golden dataset for voice match scoring
 */
export const SCORING_TESTS: TestCase[] = [
  {
    id: 'scoring-001',
    type: 'scoring',
    input: {
      original: 'Construyo soluciones',
      corrected: 'Construyo herramientas',
      impact: 'low'
    },
    expected: {
      min_delta: 1,
      max_delta: 3
    },
    metadata: {
      description: 'Low impact correction - single word change',
      difficulty: 'easy',
      tags: ['scoring', 'low-impact']
    }
  },
  {
    id: 'scoring-002',
    type: 'scoring',
    input: {
      original: 'Desarrollo contenido para fundadores',
      corrected: 'Creo contenido para emprendedores',
      impact: 'medium'
    },
    expected: {
      min_delta: 3,
      max_delta: 6
    },
    metadata: {
      description: 'Medium impact - multiple meaningful changes',
      difficulty: 'medium',
      tags: ['scoring', 'medium-impact']
    }
  },
  {
    id: 'scoring-003',
    type: 'scoring',
    input: {
      original: 'Construyo pruebas de producción de IA para builders latinos que buscan crecer sin perder su esencia #buildersla',
      corrected: 'Construyo herramientas de IA para builders latinos que quieren escalar sin perder autenticidad',
      impact: 'high'
    },
    expected: {
      min_delta: 6,
      max_delta: 10
    },
    metadata: {
      description: 'High impact - comprehensive voice transformation',
      difficulty: 'hard',
      tags: ['scoring', 'high-impact']
    }
  }
]

/**
 * Golden dataset for draft generation
 */
export const GENERATION_TESTS: TestCase[] = [
  {
    id: 'generation-001',
    type: 'generation',
    input: {
      topic: 'cómo escalar sin perder autenticidad',
      channel: 'twitter',
      sample_texts: ['construyo herramientas de IA para builders latinos que quieren escalar sin perder autenticidad'],
      rules: []
    },
    expected: {
      max_length: 280,
      should_contain: ['autenticidad', 'escalar'],
      tone: 'direct'
    },
    metadata: {
      description: 'Simple tweet generation with voice matching',
      difficulty: 'easy',
      tags: ['generation', 'twitter']
    }
  },
  {
    id: 'generation-002',
    type: 'generation',
    input: {
      topic: 'por qué la consistencia importa más que la viralidad',
      channel: 'twitter',
      sample_texts: ['construyo herramientas de IA para builders latinos que quieren escalar sin perder autenticidad'],
      rules: [
        { rule: 'Usar verbos activos como "creo" en lugar de "desarrollo"', category: 'vocabulary' },
        { rule: 'Evitar hashtags genéricos', category: 'structure' }
      ]
    },
    expected: {
      max_length: 280,
      should_contain: ['consistencia', 'viralidad'],
      should_not_contain: ['#', 'desarrollo'],
      tone: 'opinionated'
    },
    metadata: {
      description: 'Tweet with learned rules applied',
      difficulty: 'medium',
      tags: ['generation', 'twitter', 'rules']
    }
  }
]

/**
 * Get all test cases
 */
export function getAllTests(): TestCase[] {
  return [...CORRECTION_TESTS, ...SCORING_TESTS, ...GENERATION_TESTS]
}

/**
 * Get tests by type
 */
export function getTestsByType(type: TestCase['type']): TestCase[] {
  return getAllTests().filter(t => t.type === type)
}

/**
 * Get tests by difficulty
 */
export function getTestsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): TestCase[] {
  return getAllTests().filter(t => t.metadata.difficulty === difficulty)
}
