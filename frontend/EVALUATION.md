# Ghostwriter - Evaluation Guide

## Overview

Ghostwriter uses a **golden dataset** approach for quality assurance. This document explains how to run evaluations and interpret results.

---

## Golden Dataset

### Test Cases

**9 test cases** covering 3 categories:

1. **Correction Tests** (4 tests)
   - Simple word replacement
   - Multiple word changes
   - Complex corrections
   - Edge cases (no change detection)

2. **Scoring Tests** (3 tests)
   - Low impact corrections (1-3 points)
   - Medium impact corrections (3-6 points)
   - High impact corrections (6-10 points)

3. **Generation Tests** (2 tests)
   - Simple tweet with voice matching
   - Tweet with learned rules applied

### Difficulty Levels

- **Easy:** Basic functionality tests
- **Medium:** Real-world scenarios
- **Hard:** Complex edge cases

---

## Running Evaluations

### Prerequisites

1. **Environment Variables:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   GROQ_API_KEY=your_groq_key
   ```

2. **Dependencies:**
   ```bash
   npm install
   ```

### Execute

```bash
npm run eval
```

### Expected Output

```
🚀 Starting Ghostwriter Evaluation

============================================================

🧪 Running Correction Tests...
  - correction-001: Simple word replacement
    ✅ Score: 100/100
  - correction-002: Multiple word changes
    ✅ Score: 100/100
  - correction-003: Complex correction
    ✅ Score: 85/100
  - correction-004: No change detection
    ✅ Score: 100/100

🎯 Running Scoring Tests...
  - scoring-001: Low impact correction
    ✅ Score: 100/100 (delta: 2)
  - scoring-002: Medium impact correction
    ✅ Score: 100/100 (delta: 5)
  - scoring-003: High impact correction
    ✅ Score: 90/100 (delta: 8)

📝 Running Generation Tests...
  - generation-001: Simple tweet generation
    ✅ Score: 100/100
  - generation-002: Tweet with rules
    ✅ Score: 95/100

============================================================

📊 EVALUATION RESULTS

Total Tests: 9
Passed: 9 ✅
Failed: 0 ❌
Pass Rate: 100.0%
Avg Score: 96.7/100

📋 Breakdown by Type:
  Correction: 4/4 (100.0%)
  Scoring: 3/3 (100.0%)
  Generation: 2/2 (100.0%)

============================================================

✅ EVALUATION PASSED: All tests meet quality threshold
```

---

## Success Criteria

### Pass Threshold

**Pass Rate >= 80%**

If pass rate < 80%, the script exits with code 1 (failure).

### Metrics

- **Pass Rate:** Percentage of tests passing
- **Avg Score:** Average score across all tests (0-100)
- **By Type:** Breakdown by correction/scoring/generation

---

## Interpreting Results

### Test Passed ✅

- Score >= threshold for that test
- All expected conditions met
- No errors during execution

### Test Failed ❌

Common reasons:
1. **Rule extraction mismatch:** Extracted rule doesn't match expected pattern
2. **Category mismatch:** Wrong category assigned
3. **Confidence too low:** Below minimum threshold
4. **Score delta out of range:** Voice match delta not in expected range
5. **Content issues:** Generated content missing required terms or too long

### Example Failed Test

```
❌ Failed Tests:
  - correction-003: Rule doesn't match expected pattern: /herramientas|escalar|autenticidad/i
```

**Action:** Review the rule extraction logic or adjust the expected pattern.

---

## Continuous Integration

### GitHub Actions (Future)

```yaml
name: Evaluation

on: [push, pull_request]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run eval
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## Adding New Tests

### 1. Define Test Case

Edit `src/lib/evaluation/golden-dataset.ts`:

```typescript
{
  id: 'correction-005',
  type: 'correction',
  input: {
    original: 'Your original text',
    corrected: 'Your corrected text'
  },
  expected: {
    rule_pattern: /your.*pattern/i,
    category: 'vocabulary',
    min_confidence: 80
  },
  metadata: {
    description: 'Test description',
    difficulty: 'medium',
    tags: ['vocabulary', 'tone']
  }
}
```

### 2. Run Evaluation

```bash
npm run eval
```

### 3. Adjust Expectations

If test fails but behavior is correct, adjust `expected` values.

---

## Troubleshooting

### "Groq API Error"

**Cause:** Invalid API key or rate limit exceeded

**Solution:**
- Check `GROQ_API_KEY` env variable
- Wait and retry (rate limit resets)

### "Supabase Error"

**Cause:** Invalid credentials or network issue

**Solution:**
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify Supabase project is active

### "Module not found"

**Cause:** Missing dependencies

**Solution:**
```bash
npm install
```

### Low Pass Rate

**Cause:** System quality degraded

**Solution:**
1. Review failed tests details
2. Check recent code changes
3. Run tests individually to isolate issue
4. Adjust services or expected values

---

## Best Practices

### Before Deploying

1. **Run evaluation:** `npm run eval`
2. **Verify pass rate >= 80%**
3. **Review failed tests**
4. **Fix issues or adjust expectations**

### After Major Changes

1. **Run evaluation**
2. **Compare with baseline**
3. **Document regressions**
4. **Update golden dataset if needed**

### Baseline Report

Save evaluation output as baseline:

```bash
npm run eval > baseline-report.txt
```

Compare future runs against baseline.

---

## Metrics to Monitor

### Quality Metrics

- **Pass Rate:** Should stay >= 80%
- **Avg Score:** Should stay >= 85
- **Failed Tests:** Should be 0 for production

### Performance Metrics

- **Duration:** Average test duration
- **API Costs:** Cost per evaluation run
- **Token Usage:** Tokens consumed per test

---

## Future Improvements

### Short Term

1. **Real token counting:** Replace estimates with actual usage
2. **Parallel execution:** Run tests in parallel for speed
3. **HTML report:** Generate visual report
4. **Slack notifications:** Alert on failures

### Medium Term

1. **A/B testing:** Compare prompt versions
2. **Regression detection:** Auto-detect quality drops
3. **Performance benchmarks:** Track speed over time
4. **Cost optimization:** Identify expensive tests

### Long Term

1. **User feedback integration:** Real user corrections as tests
2. **Automated golden dataset expansion:** ML-generated tests
3. **Multi-model comparison:** Test across different LLMs
4. **Production monitoring:** Real-time quality tracking

---

## References

- **Golden Dataset:** `src/lib/evaluation/golden-dataset.ts`
- **Evaluators:** `src/lib/evaluation/evaluators.ts`
- **Runner:** `src/lib/evaluation/runner.ts`
- **Script:** `scripts/run-evaluation.ts`
- **Architecture:** `ARCHITECTURE.md`
