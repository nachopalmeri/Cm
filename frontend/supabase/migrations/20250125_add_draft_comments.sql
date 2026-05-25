-- Migration: Add draft_comments table for agent and user comments
-- Date: 2025-01-25
-- Purpose: Enable agent review system with comments on drafts

-- Draft comments table
CREATE TABLE IF NOT EXISTS draft_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agent', 'user')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  category TEXT NOT NULL CHECK (category IN ('hook', 'voice', 'repetition', 'structure', 'length', 'clarity')),
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_draft_comments_draft_id ON draft_comments(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_comments_resolved ON draft_comments(resolved);
CREATE INDEX IF NOT EXISTS idx_draft_comments_type ON draft_comments(type);
CREATE INDEX IF NOT EXISTS idx_draft_comments_severity ON draft_comments(severity);
CREATE INDEX IF NOT EXISTS idx_draft_comments_created_at ON draft_comments(created_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_draft_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_draft_comments_updated_at
  BEFORE UPDATE ON draft_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_draft_comments_updated_at();

-- Comments for documentation
COMMENT ON TABLE draft_comments IS 'Comments on drafts from agent review or user feedback';
COMMENT ON COLUMN draft_comments.type IS 'Comment source: agent (auto-review) or user (manual)';
COMMENT ON COLUMN draft_comments.severity IS 'Comment severity: info, warning, or error';
COMMENT ON COLUMN draft_comments.category IS 'Comment category: hook, voice, repetition, structure, length, clarity';
COMMENT ON COLUMN draft_comments.resolved IS 'Whether the comment has been addressed/resolved';
COMMENT ON COLUMN draft_comments.metadata IS 'Additional data like scores, suggestions, etc.';
