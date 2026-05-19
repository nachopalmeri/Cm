# Architecture & Production Readiness Audit â€” v0.6.1

**Date:** pre-v0.7.0 deploy
**Auditor:** Cascade (skill: ai-production-architecture)
**Scope:** full codebase at tag v0.6.1
**Verdict:** **GO WITH CONDITIONS** â€” deploy permitido en staging/sandbox; **NO-GO a producciÃ³n** hasta resolver findings Critical.

---

## Executive summary

- **141 tests pass**, compileall clean, endpoint funcional.
- **Arquitectura sÃ³lida**: schemas como single source of truth, agentes desacoplados, prompts versionados, memoria opcional.
- **3 issues Critical** que bloquean producciÃ³n con usuarios externos.
- **9 issues High** que degradan operaciÃ³n bajo carga real.
- **Distribuciï¿½n de tests desequilibrada**: 49 tests de Telegram vs 5 de API y 0 directos para weekly workflow / LLM / prompt registry.
- **Sin CI, Dockerfile, railway.toml, LICENSE**: no estÃ¡ listo para deploy automÃ¡tico todavÃ­a.

---

## Findings por severidad

### CRITICAL (bloquean producciÃ³n)

#### C1 â€” SSRF en SubstackClient
**File:** ackend/app/integrations/substack/client.py:39-49
**Issue:** etch_posts(substack_url) acepta cualquier URL del usuario y hace httpx.get sin validar host. Un atacante puede:
- Apuntar a http://169.254.169.254/... (AWS/GCP metadata).
- Apuntar a http://localhost:5432, http://10.0.0.x (servicios internos).
- Exfiltrar datos a su propio servidor.
**Impact:** En Railway/cloud, expone metadata del cloud + servicios internos.
**Fix:** Validar que el host resuelve a IP pÃºblica, restringir a substack.com o whitelist, prohibir localhost/IPs privadas.

#### C2 â€” Endpoint sync envolviendo async con un_until_complete
**File:** ackend/app/main.py:25 (def sync) + ackend/app/workflows/weekly.py:51-62
**Issue:** weekly_content_plan es def (sync) pero internamente hace loop.run_until_complete(...). Bajo FastAPI:
- Cada request bloquea un worker thread del threadpool (default 40).
- Concurrency lÃ­mite real: **~40 requests simultÃ¡neas**, despuÃ©s 503.
- Inputs async (Twitter/Substack HTTP) corren secuencialmente por request.
**Impact:** Sistema no escala mÃ¡s allÃ¡ de pocos usuarios.
**Fix:** Convertir a sync def y usar wait directamente. Eliminar _get_or_create_event_loop.

#### C3 â€” syncio.get_event_loop() deprecated y peligroso
**File:** ackend/app/workflows/weekly.py:55-65
**Issue:** En Python 3.12+, syncio.get_event_loop() sin loop corriendo emite DeprecationWarning y en 3.14 emite RuntimeError segÃºn contexto. El patrÃ³n actual:
`python
loop = asyncio.get_event_loop()
if loop.is_closed(): raise...
`
puede crear loops que nunca se cierran (memory leak en server long-running).
**Impact:** Bugs latentes en producciÃ³n con Python 3.13+ o uvicorn workers.
**Fix:** Migrar endpoint a sync def â€” el problema desaparece.

---

### HIGH (degradan operaciÃ³n)

#### H1 â€” Sin input guard / output filter
**File:** ackend/app/main.py + pp/agents/llm.py
**Issue:** No hay sanitizaciÃ³n contra prompt injection en rief.themes, rand_profile.bio, etc. Un usuario puede inyectar "ignore previous instructions" en el brief.
**Fix:** Capa security/input_guard.py con sanitizaciÃ³n de strings + lÃ­mites de longitud antes de enviar al LLM.

#### H2 â€” Sin cost tracking
**File:** ackend/app/agents/llm.py:24-29
**Issue:** LLMResponse tiene prompt_tokens y completion_tokens pero nadie los suma por request / por brand. En cuanto se enchufe un LLM real (Anthropic/OpenAI), no hay forma de monitorear costo por usuario.
**Fix:** observability/cost_tracker.py + acumular en WorkflowRun.total_cost_usd (el field ya existe en el modelo).

#### H3 â€” Sin golden dataset
**File:** ackend/app/evaluation/golden_examples.py
**Issue:** Hay evaluator pero los "golden examples" estÃ¡n hardcodeados en Python, no en JSON versionado. No se puede comparar contra runs anteriores ni medir regresiÃ³n.
**Fix:** Mover a evaluation/golden_dataset.json + script offline_eval.py que escupe mÃ©tricas comparables.

#### H4 â€” VersiÃ³n hardcoded inconsistente
**File:** ackend/app/main.py:14 (version="0.1.0") vs ackend/pyproject.toml:6 (0.4.1)
**Issue:** El endpoint reporta 0.1.0 al cliente, pero el package es 0.4.1. ConfusiÃ³n en logs/Sentry.
**Fix:** Leer ersion desde importlib.metadata.version("social-ai-os") o desde settings.VERSION.

#### H5 â€” class Config Pydantic V1 deprecated
**File:** ackend/app/config.py:14-16
**Issue:** Pydantic V2 deprecaciÃ³n. Se elimina en V3.
**Fix:** model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8").

#### H6 â€” Sin CORS configurado
**File:** ackend/app/main.py
**Issue:** No hay CORSMiddleware. Cualquier dominio web puede llamar al endpoint, o ninguno funciona desde frontend (depende del browser).
**Fix:** Agregar middleware con whitelist explÃ­cita.

#### H7 â€” Sin rate limiting
**Issue:** Endpoint corre LLM â†’ costoso por request. Sin lÃ­mite, un loop malicioso quema crÃ©dito.
**Fix:** slowapi o middleware custom con lÃ­mite por IP / por brand_handle.

#### H8 â€” except Exception en enrichment silencia bugs
**File:** ackend/app/workflows/weekly.py:88, 109, 118 + pp/main.py:43-46
**Issue:** Cualquier error (incluso syntax errors, bugs) se silencia con logger.exception(...) y degrada al brief original. Bugs reales quedan invisibles.
**Fix:** Capturar excepciones especÃ­ficas (httpx.HTTPError, eedparser.ParseError, etc.). Dejar que RuntimeError / TypeError propaguen.

#### H9 â€” Sin /ready endpoint con DB check
**File:** ackend/app/main.py:19-22
**Issue:** /health solo devuelve {status: ok}. No verifica DB, no verifica que el LLM provider responda. Railway/K8s liveness probe pasa siempre aunque la DB estÃ© caÃ­da.
**Fix:** Agregar /ready con check rÃ¡pido de DB + LLM provider.

---

### MEDIUM

| # | Issue | File |
|---|-------|------|
| M1 | Sin CI/CD (.github/workflows/ ausente) | repo root |
| M2 | Sin Dockerfile ni railway.toml para deploy reproducible | repo root |
| M3 | Sin LICENSE file (README dice "Private" sin archivo) | repo root |
| M4 | Sin logging estructurado JSON â€” logs planos no parseables | pp/main.py |
| M5 | Twitter cliente requiere X API paid bearer token sin fallback manual implementado en el endpoint | pp/integrations/twitter/client.py |
| M6 | Generated media (.mp4) sin storage strategy â€” Railway FS es efÃ­mero | pp/generators/video.py |
| M7 | _async_enrich hace imports locales en funciÃ³n | pp/workflows/weekly.py:91-92 |
| M8 | eedparser deprecation warning (positional arg) en runtime | dep externa |
| M9 | Distribuciï¿½n de tests desequilibrada: 49 telegram, 0 weekly workflow directo, 0 LLM, 0 memory_service | 	ests/ |

---

### LOW

| # | Issue |
|---|-------|
| L1 | pyproject.toml author info missing |
| L2 | Sin badge de tests en README |
| L3 | Sin OpenAPI tags consistentes |
| L4 | MoviePy FFMPEG_AudioReader.__del__ warning (no nuestro) |
| L5 | docs/ tiene reports viejos (v0.2.0) que conviene archivar |
| L6 | _get_or_create_event_loop desaparece cuando se migra a async, dejarÃ¡ tests obsoletos |

---

## Coverage gaps

| MÃ³dulo | Tests directos | Notas |
|--------|---------------|-------|
| gents/llm.py | 0 | MockLLM cubierto indirectamente |
| gents/orchestrator.py | 11 e2e | OK |
| prompts/registry.py | 0 | Sin tests de versioning |
| memory/memory_service.py | 0 | Sin tests de integraciÃ³n con embeddings |
| workflows/weekly.py | indirecto via api | Sin tests directos de enrich_brief_from_social con fallos reales |
| integrations/twitter/client.py | 0 | Solo analyzer testeado |
| integrations/substack/client.py | 0 | Solo analyzer testeado |
| integrations/telegram/bot.py | 49 | Sobre-invertido |
| evaluation/evaluator.py | 8 | OK |

---

## Roadmap recomendado (orden estricto)

### Antes de v0.7.0 deploy
1. **C2 + C3** â€” migrar endpoint a sync def, eliminar un_until_complete. *(2h)*
2. **C1** â€” validar host en SubstackClient. *(1h)*
3. **H4 + H5** â€” fix version + Pydantic config. *(30min)*
4. **H6** â€” CORS middleware. *(15min)*
5. **H9** â€” /ready endpoint. *(30min)*
6. **M1 + M2** â€” GitHub Actions con pytest + compileall + Dockerfile o ailway.toml. *(2h)*

### Durante v0.7.0 deploy
7. **H1** â€” input_guard layer.
8. **H2** â€” cost_tracker en LLMResponse + WorkflowRun.

### Post-deploy (v0.7.1+)
9. **H3** â€” golden_dataset.json + offline_eval.
10. **H7** â€” rate limiting con slowapi.
11. **H8** â€” except especÃ­ficos.
12. **M4** â€” JSON logging.
13. **M6** â€” storage para .mp4 (S3 / Supabase Storage).
14. Cobertura: LLM, prompt registry, memory_service, weekly direct.

---

## Veredicto final

| Audiencia | Verdict |
|-----------|---------|
| Deploy en **staging** sin usuarios externos | **GO** |
| Deploy en **producciÃ³n** con usuarios externos | **NO-GO** hasta C1, C2, C3, H6 resueltos |
| Deploy en **sandbox personal** (solo vos) | **GO** con monitoring manual |
| Publicar repo como **open source / SaaS** | **NO-GO** hasta CI + LICENSE + C1 |

**RecomendaciÃ³n inmediata:** ejecutar el bloque "Antes de v0.7.0 deploy" (â‰ˆ6h de trabajo) y recieâˆ’n despuÃ©s arrancar Railway + Supabase. Es mÃ¡s rÃ¡pido arreglar 3 Critical ahora que despuÃ©s de tener un usuario real con un incidente.
