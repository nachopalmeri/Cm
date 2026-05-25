# Agents

This directory contains the agent layer of social-ai-os. Every agent implements
`AgentProtocol` and uses typed Pydantic input/output models from `contracts.py`.

## Existing Agents

| Agent | Input | Output | Role |
|-------|-------|--------|------|
| Strategist | `StrategistInput` | `StrategistOutput` (→ `WeeklyStrategy`) | Defines narrative, pillars, ideas |
| Writer | `WriterInput` | `WriterOutput` (→ `ContentAsset`) | Produces content from strategy ideas |
| Editor | `EditorInput` | `EditorOutput` (→ `EditorReview`) | Reviews assets for quality and voice fit |
| Orchestrator | `AgentInput` | `WorkflowRun` | Coordinates Strategist → Writer → Editor |

## Shared Contracts

All core data types (`BrandProfile`, `WeeklyBrief`, `ContentAsset`, `WorkflowRun`,
`MemoryItem`, etc.) are defined in `backend/app/schemas/`. Agents import from
`app.schemas.*` — never redefine them.

## Definition of Done

No agent may declare a task complete until it meets all of the following:

1. **Imports consistentes** — Todo import interno usa `from app.*`. No `from backend.app.*`.
2. **Contratos compartidos** — Tipos compartidos (BrandProfile, WeeklyBrief, ContentAsset, WorkflowRun, MemoryItem) provienen de `backend/app/schemas/`. No se duplican.
3. **Compilación limpia** — `python -m compileall app` pasa sin errores desde `backend`.
4. **Workflow test** — Si el cambio toca el workflow o la API, ejecutar `POST /workflows/weekly-content-plan` con un payload de prueba (MockLLM / local mode).
5. **Output real** — Reportar el output real del endpoint (status HTTP, `workflow_run.status`, cantidad de pillars/assets/traces) o el error real si falla.
6. **Sin scope creep** — No agregar features fuera del scope pedido. No tocar Telegram/TikTok/dashboard. No meter Temporal. No agregar agentes que no fueron pedidos.
