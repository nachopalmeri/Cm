# Implementation Dispatch — Multi-Cascade Build Plan

Este documento define cómo continuar la construcción del AI Operating System for Personal Brands usando múltiples Cascades/agentes en paralelo sin pisarse.

## Workspace real

Usar este workspace:

```txt
C:\Users\ignac\pisculabs\social-ai-os
```

No usar `C:\` como repo. No usar `.windsurf/worktrees` como fuente principal para otros Cascades.

## Regla de oro

Cada Cascade debe tener ownership claro de carpetas. Ningún Cascade debe modificar archivos fuera de su área asignada salvo coordinación explícita.

## Cascades recomendados

### Cascade 1 — Core Backend Architect

Ownership:

```txt
backend/app/main.py
backend/app/config.py
backend/app/schemas/
backend/app/workflows/
backend/pyproject.toml
backend/README.md
```

Objetivo:

- Crear base FastAPI.
- Crear schemas Pydantic compartidos.
- Crear endpoint `POST /workflows/weekly-content-plan`.
- Crear workflow semanal síncrono inicial sin Temporal.

### Cascade 2 — Agent Systems Engineer

Ownership:

```txt
backend/app/agents/
backend/app/prompts/
backend/app/evaluation/
```

Objetivo:

- Implementar Orchestrator, Strategist, Writer y Editor.
- Definir contratos de agentes.
- Crear prompt registry versionado.
- Agregar golden examples mínimos.

### Cascade 3 — Memory & Data Architect

Ownership:

```txt
backend/app/memory/
backend/app/db/
backend/app/models/
backend/migrations/
docs/DATA_MODEL.md
```

Objetivo:

- Diseñar Brand Memory, Content Memory, Audience Memory y Context Memory.
- Crear repositorios/servicios.
- Diseñar Postgres + pgvector-ready.
- Permitir modo local/simple al inicio.

### Cascade 4 — Telegram & Approval Flow Engineer

Ownership:

```txt
backend/app/interfaces/telegram/
backend/app/approvals/
backend/app/platforms/drafts/
docs/APPROVAL_FLOW.md
```

Objetivo:

- Crear skeleton de Telegram bot.
- Recibir weekly brief.
- Manejar approve/reject/rewrite/edit.
- Definir estados de aprobación.

### Cascade 5 — TikTok Pack & Repurposing Engineer

Ownership:

```txt
backend/app/repurposing/
backend/app/platforms/tiktok/
docs/TIKTOK_PACK.md
```

Objetivo:

- Implementar TikTok Pack schema.
- Crear timeline por segundos.
- Crear visual instructions, voiceover, captions, hashtags y CTA.
- Crear repurpose map desde una idea a múltiples assets.

### Cascade 6 — Product/Docs Architect

Ownership:

```txt
docs/ARCHITECTURE.md
docs/ROADMAP.md
docs/PRODUCT_STRATEGY.md
docs/RISKS.md
```

Objetivo:

- Expandir docs ejecutivas y técnicas.
- Documentar riesgos, roadmap y decisiones.
- Mantener una fuente de verdad clara.

## Orden recomendado

Primero lanzar en paralelo:

- Cascade 1: Core Backend Architect.
- Cascade 2: Agent Systems Engineer.
- Cascade 3: Memory & Data Architect.

Después integrar contratos.

Luego lanzar:

- Cascade 4: Telegram & Approval Flow.
- Cascade 5: TikTok Pack & Repurposing.
- Cascade 6: Product/Docs Architect.

## Schemas compartidos que deben estabilizarse

- `BrandProfile`
- `WeeklyBrief`
- `ContentPillar`
- `ContentIdea`
- `ContentAsset`
- `Platform`
- `TikTokPack`
- `ApprovalDecision`
- `WorkflowRun`
- `AgentTrace`
- `MemoryItem`

## Convención de repo

```txt
social-ai-os/
  docs/
    SPEC.md
    IMPLEMENTATION_DISPATCH.md
    ARCHITECTURE.md
    DATA_MODEL.md
    APPROVAL_FLOW.md
    TIKTOK_PACK.md
  backend/
    app/
      main.py
      config.py
      schemas/
      agents/
      workflows/
      memory/
      prompts/
      platforms/
      interfaces/
      approvals/
      observability/
      evaluation/
    tests/
    pyproject.toml
    README.md
  frontend/
    README.md
```

## Qué NO delegar todavía

- Billing.
- Dashboard completo.
- Auto-publicación multi-plataforma.
- Kubernetes.
- Generación de imágenes.
- Multi-agency completo.
- TikTok upload automation.
