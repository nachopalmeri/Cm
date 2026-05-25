-- Migration: Add observability tables for traces and costs
-- Date: 2025-01-25
-- Purpose: Persist request traces and API costs for monitoring and analytics

-- Traces table
CREATE TABLE IF NOT EXISTS traces (
  trace_id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  metadata JSONB DEFAULT '{}',
  spans JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Costs table
CREATE TABLE IF NOT EXISTS costs (
  id TEXT PRIMARY KEY,
  trace_id TEXT REFERENCES traces(trace_id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens JSONB NOT NULL,
  cost_usd DECIMAL(10, 6) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_traces_operation ON traces(operation);
CREATE INDEX IF NOT EXISTS idx_traces_status ON traces(status);
CREATE INDEX IF NOT EXISTS idx_traces_started_at ON traces(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_costs_operation ON costs(operation);
CREATE INDEX IF NOT EXISTS idx_costs_timestamp ON costs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_costs_trace_id ON costs(trace_id);

-- Function to auto-cleanup old traces (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_traces()
RETURNS void AS $$
BEGIN
  DELETE FROM traces
  WHERE started_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE traces IS 'Request traces for observability and debugging';
COMMENT ON TABLE costs IS 'API costs tracking for Groq and other services';
COMMENT ON COLUMN traces.trace_id IS 'Unique identifier for the trace';
COMMENT ON COLUMN traces.spans IS 'Array of span objects with timing information';
COMMENT ON COLUMN costs.tokens IS 'Token usage breakdown: {prompt, completion, total}';
COMMENT ON COLUMN costs.cost_usd IS 'Cost in USD based on model pricing';
