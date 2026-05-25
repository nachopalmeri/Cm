/**
 * UTF-8 Encoding Utilities
 * Ensures proper UTF-8 handling across the application
 */

/**
 * Normalize text to proper UTF-8
 * Fixes common encoding issues with Spanish characters
 */
export function normalizeUTF8(text: string): string {
  if (!text) return text
  
  // Fix common mojibake patterns using regex
  let normalized = text
  
  // Replace common broken patterns
  normalized = normalized.replace(/Ã¡/g, 'á')
  normalized = normalized.replace(/Ã©/g, 'é')
  normalized = normalized.replace(/Ã­/g, 'í')
  normalized = normalized.replace(/Ã³/g, 'ó')
  normalized = normalized.replace(/Ãº/g, 'ú')
  normalized = normalized.replace(/Ã±/g, 'ñ')
  normalized = normalized.replace(/quÃ©/g, 'qué')
  normalized = normalized.replace(/mÃ¡s/g, 'más')
  normalized = normalized.replace(/cÃ³mo/g, 'cómo')
  normalized = normalized.replace(/por qu[ï¿½�]/g, 'por qué')
  normalized = normalized.replace(/m[ï¿½�]s/g, 'más')
  normalized = normalized.replace(/producci[�ï¿½]n/g, 'producción')
  normalized = normalized.replace(/t[�ï¿½]cnicos/g, 'técnicos')
  normalized = normalized.replace(/Verificaci[�ï¿½]n/g, 'Verificación')
  
  return normalized
}

/**
 * Sanitize object with UTF-8 normalization
 * Recursively normalizes all string values in an object
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return normalizeUTF8(obj) as unknown as T
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized as T
  }
  
  return obj
}
