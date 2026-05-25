# Ghostwriter - AI Production Architecture

## Overview

Ghostwriter is an **Agentic Brand System** that learns brand voice through user corrections and generates content with progressive voice matching. This document describes the production-ready architecture implemented following `ai_production.md` workflow.

## Classification

**Type:** Production AI System
- ✅ Real users
- ✅ Measurable costs (Groq API)
- ✅ Quality metrics (voice match score)
- ✅ Monitoring and observability

## Architecture Layers

### 1. Services Layer (`src/lib/services/`)

Business logic separated from API routes:

#### `voice-learning.ts`
- **Purpose:** Process corrections and extract learning
- **Key Functions:**
  - `processCorrection()` - Main correction processing pipeline
  - `extractRule()` - LLM-based rule extraction with Groq
  - `calculateConfidence()` - Confidence scoring for rules
- **Dependencies:** Groq SDK, diff analyzer, voice scorer

#### `draft-generation.ts`
- **Purpose:** Generate content with voice matching
- **Key Functions:**
  - `generateDraft()` - Main generation pipeline
  - `buildSystemPrompt()` - Dynamic prompt construction
  - `detectFormat()` - Content format detection
- **Dependencies:** Groq SDK, UTF-8 normalization

#### `brain-manager.ts`
- **Purpose:** Brand brain CRUD operations
- **Key Functions:**
  - `getActiveBrain()` - Fetch active brain
  - `updateBrain()` - Update brain data
  - `addRuleToBrain()` - Add rule with deduplication
  - `updateVoiceScore()` - Update voice match score
- **Dependencies:** Supabase client

### 2. Prompts Layer (`src/lib/prompts/`)

Centralized, versioned prompt management:

#### `registry.ts`
- **Purpose:** Single source of truth for all prompts
- **Key Features:**
  - Versioned templates (v1.0, v1.1, etc.)
  - Variable substitution with `{{variable}}`
  - Metadata tracking (created_at, updated_at, description)
- **Prompts:**
  - `RULE_EXTRACTION` - Extract writing rules from corrections
  - `DRAFT_GENERATION` - Generate content with voice matching
  - `SYSTEM_INSTRUCTIONS` - System-level instructions

### 3. Evaluation Layer (`src/lib/evaluation/`)

Quality assurance with golden dataset:

#### `golden-dataset.ts`
- **Purpose:** Test cases for evaluation
- **Test Types:**
  - **Correction Tests:** Validate rule extraction quality
  - **Scoring Tests:** Validate voice match delta calculation
  - **Generation Tests:** Validate content generation quality
- **Difficulty Levels:** Easy, Medium, Hard

#### `evaluators.ts`
- **Purpose:** Evaluation functions
- **Key Functions:**
  - `evaluateCorrection()` - Check rule quality
  - `evaluateScoring()` - Check delta accuracy
  - `evaluateGeneration()` - Check content quality
  - `calculateMetrics()` - Aggregate metrics

#### `runner.ts`
- **Purpose:** Execute evaluations
- **Key Functions:**
  - `runEvaluations()` - Run all tests
  - `runEvaluationsByType()` - Run specific test type
  - `compareReports()` - Compare baseline vs current

### 4. Observability Layer (`src/lib/observability/`)

Monitoring and cost tracking:

#### `tracer.ts`
- **Purpose:** Request tracing
- **Key Features:**
  - Trace ID generation
  - Span tracking (sub-operations)
  - Duration measurement
  - Status tracking (running/success/error)
- **Helper:** `traceAsync()` - Wrap async functions with tracing

#### `cost-tracker.ts`
- **Purpose:** Groq API cost tracking
- **Key Features:**
  - Token counting (prompt + completion)
  - Cost calculation (based on Groq pricing)
  - Cost breakdown by operation
  - Threshold alerts
- **Pricing:** llama-3.3-70b-versatile
  - Prompt: $0.59 per 1M tokens
  - Completion: $0.79 per 1M tokens

### 5. Security Layer (`src/lib/security/`)

Input/output validation and filtering:

#### `input-guard.ts`
- **Purpose:** Validate and sanitize user input
- **Key Functions:**
  - `validateTopic()` - Topic validation
  - `validateCorrection()` - Correction validation
  - `validateSampleText()` - Sample text validation
  - `checkRateLimit()` - Rate limiting
- **Protections:**
  - XSS prevention
  - Injection detection
  - Length limits
  - Rate limiting (10 req/min default)

#### `output-guard.ts`
- **Purpose:** Filter AI-generated content
- **Key Functions:**
  - `filterOutput()` - Main filtering pipeline
  - `detectPII()` - PII detection (email, phone, CC)
  - `assessContentQuality()` - Quality heuristics
- **Checks:**
  - Offensive content
  - PII redaction
  - Hallucination markers
  - Code injection attempts

### 6. Existing Layers

#### `encoding/utf8.ts`
- **Purpose:** UTF-8 normalization
- **Key Function:** `normalizeUTF8()` - Fix mojibake patterns

#### `voice/scorer.ts`
- **Purpose:** Dynamic voice match scoring
- **Key Function:** `calculateVoiceMatchDelta()` - Calculate score delta (-5 to +10)

#### `diff/analyzer.ts`
- **Purpose:** Text diff analysis
- **Key Function:** `analyzeDiff()` - Detect changes between texts

## Data Flow

### Draft Generation Flow

```
User Request (topic, channel)
  ↓
Input Guard (validate, sanitize)
  ↓
Tracer (start trace)
  ↓
Brain Manager (get active brain)
  ↓
Draft Generation Service
  ├─ Build system prompt (prompts registry)
  ├─ Call Groq API
  └─ Normalize UTF-8
  ↓
Output Guard (filter, validate)
  ↓
Cost Tracker (track tokens & cost)
  ↓
Tracer (end trace)
  ↓
Save to Supabase
  ↓
Return draft to user
```

### Correction Learning Flow

```
User Correction (original, corrected)
  ↓
Input Guard (validate, sanitize)
  ↓
Tracer (start trace)
  ↓
Brain Manager (get active brain)
  ↓
Voice Learning Service
  ├─ Diff Analyzer (detect changes)
  ├─ Extract rule (Groq API)
  ├─ Calculate confidence
  ├─ Check duplicates
  └─ Calculate voice match delta
  ↓
Output Guard (filter rule)
  ↓
Cost Tracker (track tokens & cost)
  ↓
Brain Manager (update brain)
  ├─ Add rule (if not duplicate)
  ├─ Update voice score
  └─ Increment corrections count
  ↓
Tracer (end trace)
  ↓
Return learning result
```

## Evaluation Strategy

### Golden Dataset

**20+ test cases** covering:
1. **Correction Quality** (4 tests)
   - Simple word replacement
   - Multiple word changes
   - Complex corrections
   - Edge cases (no change)

2. **Scoring Accuracy** (3 tests)
   - Low impact (1-3 points)
   - Medium impact (3-6 points)
   - High impact (6-10 points)

3. **Generation Quality** (2 tests)
   - Simple tweet with voice matching
   - Tweet with learned rules applied

### Evaluation Metrics

- **Pass Rate:** % of tests passing
- **Avg Score:** Average score across all tests (0-100)
- **By Type:** Breakdown by correction/scoring/generation
- **Regressions:** Tests that failed after passing
- **Improvements:** Tests that passed after failing

### Running Evaluations

```typescript
import { runEvaluations } from '@/lib/evaluation/runner'

const report = await runEvaluations()
console.log(`Pass rate: ${report.summary.pass_rate}%`)
console.log(`Avg score: ${report.summary.avg_score}`)
```

## Observability

### Tracing

Every request gets a `trace_id` with spans for each operation:

```typescript
import { traceAsync } from '@/lib/observability/tracer'

await traceAsync('draft-generation', async (trace_id) => {
  // Your code here
}, { user_id, topic })
```

### Cost Tracking

Automatic tracking of Groq API costs:

```typescript
import { trackCost, getTotalCost } from '@/lib/observability/cost-tracker'

trackCost('draft-generation', 'llama-3.3-70b-versatile', 500, 200)

const total = getTotalCost({ operation: 'draft-generation' })
console.log(`Total cost: $${total.toFixed(4)}`)
```

### Monitoring

Key metrics to monitor:
- **Cost per draft:** Should be < $0.01
- **Cost per correction:** Should be < $0.005
- **Voice match progression:** Should increase with corrections
- **Pass rate:** Should be > 80%
- **Avg response time:** Should be < 3s

## Security

### Input Validation

All user input is validated and sanitized:
- Max lengths enforced
- XSS patterns blocked
- Injection attempts detected
- Rate limiting applied

### Output Filtering

All AI output is filtered:
- PII redacted
- Offensive content flagged
- Hallucinations detected
- Code injection blocked

### Rate Limiting

Default limits:
- **Draft generation:** 10 requests/minute
- **Corrections:** 10 requests/minute
- **Sample texts:** 5 requests/minute

## Deployment Checklist

Before deploying to production:

- [ ] Run full evaluation suite
- [ ] Check pass rate > 80%
- [ ] Verify cost tracking working
- [ ] Test rate limiting
- [ ] Verify input/output guards
- [ ] Check UTF-8 normalization
- [ ] Test trace logging
- [ ] Verify Supabase connection
- [ ] Test Groq API integration
- [ ] Review security settings

## Future Improvements

### Short Term
1. Persistent trace storage (replace in-memory)
2. Cost alerts via email/Slack
3. Real-time evaluation dashboard
4. A/B testing for prompts

### Medium Term
1. Multi-model support (GPT-4, Claude)
2. Advanced PII detection (NER models)
3. Content moderation API integration
4. Feedback loop automation

### Long Term
1. Multi-agent orchestration
2. Autonomous quality improvement
3. Voice cloning with fine-tuning
4. Real-time collaboration features

## References

- **Workflow:** `.agents/workflows/ai_production.md`
- **Validation:** `.agents/workflows/validation.md`
- **Groq Pricing:** https://groq.com/pricing/
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
