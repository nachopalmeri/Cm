/**
 * Prompt Registry
 * Centralized, versioned prompt management
 */

export interface PromptTemplate {
  id: string
  version: string
  template: string
  variables: string[]
  metadata: {
    created_at: string
    updated_at: string
    description: string
  }
}

/**
 * Prompt registry with versioning
 */
export const PROMPTS = {
  RULE_EXTRACTION: {
    id: 'rule-extraction',
    version: 'v1.0',
    template: `Analiza esta corrección y extrae UNA regla específica y accionable.

TEXTO ORIGINAL:
{{original_text}}

TEXTO CORREGIDO:
{{corrected_text}}

CAMBIOS DETECTADOS:
- Palabras eliminadas: {{words_removed}}
- Palabras agregadas: {{words_added}}
- Cambios de estructura: {{structure_change}}
- Hashtags cambiados: {{hashtag_changes}}

Extrae UNA regla específica en formato:
"[ACCIÓN]: [RAZÓN]"

Ejemplos:
- "Usar 'herramientas' en lugar de 'soluciones': más concreto y accionable"
- "Evitar hashtags genéricos: prefiere términos específicos"
- "Acortar frases: mantener bajo 280 caracteres"

Responde SOLO con la regla, sin explicaciones adicionales.`,
    variables: ['original_text', 'corrected_text', 'words_removed', 'words_added', 'structure_change', 'hashtag_changes'],
    metadata: {
      created_at: '2025-01-25',
      updated_at: '2025-01-25',
      description: 'Extract actionable writing rules from user corrections'
    }
  },

  DRAFT_GENERATION: {
    id: 'draft-generation',
    version: 'v1.0',
    template: `You are a content writer that learns from corrections and matches the user's brand voice perfectly.

{{sample_texts_section}}

{{rules_section}}

{{corrections_section}}

{{channel_instruction}}

IMPORTANT:
- Match the tone and style exactly from the sample texts
- Follow all learned rules
- Apply patterns from recent corrections
- Be authentic to the brand voice`,
    variables: ['sample_texts_section', 'rules_section', 'corrections_section', 'channel_instruction'],
    metadata: {
      created_at: '2025-01-25',
      updated_at: '2025-01-25',
      description: 'Generate content matching brand voice with learned rules'
    }
  },

  SYSTEM_INSTRUCTIONS: {
    RULE_EXTRACTION: {
      id: 'rule-extraction-system',
      version: 'v1.0',
      template: 'Eres un experto en análisis de estilo de escritura. Extraes reglas específicas y accionables.',
      variables: [],
      metadata: {
        created_at: '2025-01-25',
        updated_at: '2025-01-25',
        description: 'System instruction for rule extraction'
      }
    }
  }
} as const

/**
 * Render prompt with variables
 */
export function renderPrompt(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template
  
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  
  return rendered
}

/**
 * Get prompt by ID
 */
export function getPrompt(id: string): PromptTemplate | null {
  const prompt = Object.values(PROMPTS).find(p => 
    typeof p === 'object' && 'id' in p && (p as any).id === id
  )
  
  return (prompt as any) || null
}

/**
 * List all prompts
 */
export function listPrompts(): any[] {
  return Object.values(PROMPTS)
    .filter(p => typeof p === 'object' && 'id' in p)
    .map(p => p as any)
}
