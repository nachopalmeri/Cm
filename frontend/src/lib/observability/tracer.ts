/**
 * Request Tracer
 * Tracks execution flow and performance
 */

export interface Trace {
  trace_id: string
  operation: string
  started_at: string
  ended_at?: string
  duration_ms?: number
  status: 'running' | 'success' | 'error'
  metadata: Record<string, any>
  spans: Span[]
}

export interface Span {
  span_id: string
  name: string
  started_at: string
  ended_at?: string
  duration_ms?: number
  status: 'running' | 'success' | 'error'
  metadata: Record<string, any>
}

/**
 * In-memory trace storage (replace with persistent storage in production)
 */
const traces = new Map<string, Trace>()

/**
 * Start a new trace
 */
export function startTrace(operation: string, metadata: Record<string, any> = {}): string {
  const trace_id = generateId()
  
  const trace: Trace = {
    trace_id,
    operation,
    started_at: new Date().toISOString(),
    status: 'running',
    metadata,
    spans: []
  }
  
  traces.set(trace_id, trace)
  
  console.log(`[TRACE] Started: ${operation} (${trace_id})`)
  
  return trace_id
}

/**
 * End a trace
 */
export function endTrace(trace_id: string, status: 'success' | 'error' = 'success'): void {
  const trace = traces.get(trace_id)
  if (!trace) return
  
  const ended_at = new Date().toISOString()
  const duration_ms = new Date(ended_at).getTime() - new Date(trace.started_at).getTime()
  
  trace.ended_at = ended_at
  trace.duration_ms = duration_ms
  trace.status = status
  
  console.log(`[TRACE] Ended: ${trace.operation} (${trace_id}) - ${status} in ${duration_ms}ms`)
}

/**
 * Add a span to a trace
 */
export function addSpan(
  trace_id: string,
  name: string,
  metadata: Record<string, any> = {}
): string {
  const trace = traces.get(trace_id)
  if (!trace) return ''
  
  const span_id = generateId()
  
  const span: Span = {
    span_id,
    name,
    started_at: new Date().toISOString(),
    status: 'running',
    metadata
  }
  
  trace.spans.push(span)
  
  console.log(`[TRACE] Span started: ${name} (${span_id})`)
  
  return span_id
}

/**
 * End a span
 */
export function endSpan(
  trace_id: string,
  span_id: string,
  status: 'success' | 'error' = 'success',
  metadata: Record<string, any> = {}
): void {
  const trace = traces.get(trace_id)
  if (!trace) return
  
  const span = trace.spans.find(s => s.span_id === span_id)
  if (!span) return
  
  const ended_at = new Date().toISOString()
  const duration_ms = new Date(ended_at).getTime() - new Date(span.started_at).getTime()
  
  span.ended_at = ended_at
  span.duration_ms = duration_ms
  span.status = status
  span.metadata = { ...span.metadata, ...metadata }
  
  console.log(`[TRACE] Span ended: ${span.name} (${span_id}) - ${status} in ${duration_ms}ms`)
}

/**
 * Get trace by ID
 */
export function getTrace(trace_id: string): Trace | undefined {
  return traces.get(trace_id)
}

/**
 * Get all traces
 */
export function getAllTraces(): Trace[] {
  return Array.from(traces.values())
}

/**
 * Clear old traces (keep last 100)
 */
export function cleanupTraces(): void {
  const allTraces = getAllTraces()
  if (allTraces.length <= 100) return
  
  // Sort by started_at descending
  const sorted = allTraces.sort((a, b) => 
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  )
  
  // Keep only last 100
  const toKeep = sorted.slice(0, 100)
  traces.clear()
  toKeep.forEach(t => traces.set(t.trace_id, t))
  
  console.log(`[TRACE] Cleaned up old traces, kept ${toKeep.length}`)
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Helper: Trace async function
 */
export async function traceAsync<T>(
  operation: string,
  fn: (trace_id: string) => Promise<T>,
  metadata: Record<string, any> = {}
): Promise<T> {
  const trace_id = startTrace(operation, metadata)
  
  try {
    const result = await fn(trace_id)
    endTrace(trace_id, 'success')
    return result
  } catch (error) {
    endTrace(trace_id, 'error')
    throw error
  }
}
