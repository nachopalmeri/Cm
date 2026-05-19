# AI Operating System for Personal Brands — SPEC v1

## 1. Diagnóstico

El producto no debe posicionarse como un generador de posts ni como un scheduler con IA. Esa categoría ya está commoditizada y compite por precio, templates y automatización superficial.

La oportunidad real es construir un sistema operativo de contenido para marcas personales: una capa de inteligencia persistente que entienda la voz, el contexto, los objetivos, los activos previos, el rendimiento histórico y las diferencias entre plataformas.

El usuario inicial ideal no es cualquier negocio con redes sociales. El wedge más fuerte es builders, developers, freelancers, founders latinos, creadores tech y personas que construyen en público.

Tesis:

> Un CM/estratega/editor/publisher AI-native con memoria persistente, orquestación multi-agente y loops de aprendizaje.

## 2. Arquitectura recomendada

### Principios

- Personal-first, SaaS-ready.
- Memory-first.
- Human-in-the-loop por defecto.
- Workflow-oriented.
- Platform-aware.
- Agent contracts over agent vibes.

### Stack

- Backend: Python, FastAPI, Pydantic.
- Orquestación: LangGraph para agentes; Temporal para workflows durables en fase 2.
- Datos: Postgres + pgvector.
- Interfaz: Telegram-first; Next.js dashboard después.
- Observabilidad: traces, cost tracking, prompt registry, feedback capture.

### Capas

```txt
[Interaction Layer] Telegram Bot / Web Dashboard / API
        ↓
[API Layer] FastAPI webhooks, auth, user/brand context
        ↓
[Workflow Layer] Temporal schedules, retries, approvals, publishing jobs
        ↓
[Agent Layer] LangGraph: Orchestrator, Strategist, Research, Writer, Editor, Repurposer, Publisher, Analytics
        ↓
[Memory Layer] Postgres relational memory + pgvector semantic memory
        ↓
[Platform Layer] X, LinkedIn, Substack, Instagram/Meta, TikTok Pack, future connectors
        ↓
[Observability + Evaluation] Traces, cost, prompt versions, feedback, golden examples
```

## 3. Agentes

### Orchestrator Agent

Coordina workflows, decide qué agentes ejecutar, en qué orden, con qué contexto y con qué nivel de autonomía.

### Strategist Agent

Define narrativa semanal, pilares, calendario, posicionamiento y oportunidades.

### Research Agent

Busca trends, referencias, hooks, repos, noticias, papers y contenido relevante.

### Writer Agent

Genera X posts/threads, LinkedIn posts, Substack drafts, TikTok scripts, captions y CTAs.

### Editor Agent

Revisa claridad, autenticidad, AI slop, repetición, tono de marca, hooks y riesgo reputacional.

### Repurposer Agent

Convierte una idea en múltiples assets: hilo, newsletter, short posts, TikTok Pack, carrusel y clips.

### Publisher Agent

Maneja scheduling, APIs, retries, rate limits, aprobaciones y audit logs.

### Analytics Agent

Analiza engagement, CTR, retención, formatos, patrones y recomienda mejoras futuras.

## 4. Memory System

### Brand Memory

- Voz.
- Tono.
- Personalidad.
- Opiniones.
- Estilo.
- Temas prohibidos o sensibles.

### Content Memory

- Qué se publicó.
- Qué funcionó.
- Qué no funcionó.
- Qué se repitió.
- Relación entre ideas y assets.

### Audience Memory

- Horarios.
- Formatos.
- Hooks.
- Temas exitosos.
- Segmentos de audiencia.

### Context Memory

- Proyectos.
- Exámenes.
- Lanzamientos.
- Roadmap.
- Contexto personal/profesional.

## 5. Tradeoffs

- LangGraph agrega estructura; funciones sueltas son más simples pero escalan peor.
- Temporal es más pesado que Celery, pero mejor para workflows durables y SaaS real.
- Postgres + pgvector alcanza para MVP; vector DB dedicada se posterga.
- Telegram valida hábito rápido; dashboard se construye después.
- Aprobación manual reduce riesgo; auto-publicación se habilita gradualmente.

## 6. Riesgos

### Técnicos

- APIs sociales inestables.
- Rate limits.
- Tokens multi-tenant.
- Duplicación accidental de publicaciones.
- Memoria contaminada.
- Costos LLM altos.

### Producto

- Contenido genérico.
- Demasiados targets.
- Dashboard prematuro.
- Falsa promesa de crecimiento automático.
- Autonomía excesiva sin confianza.

## 7. Qué NO hacer

- No construir un chatbot de prompt a post.
- No empezar con dashboard complejo.
- No intentar soportar todas las plataformas con publicación automática desde el día uno.
- No mezclar founders tech con pymes locales en el mismo MVP.
- No guardar toda memoria como texto libre sin estructura.
- No hardcodear prompts sin versionado.
- No automatizar DMs ni interacciones sensibles sin aprobación explícita.

## 8. MVP realista

### Input semanal

Brief por Telegram con temas, proyectos, aprendizajes, restricciones y objetivos.

### Planificación

Narrativa semanal, 3 a 5 temas principales, distribución por plataforma y calendario sugerido.

### Producción

X posts/threads, LinkedIn posts, Substack draft/outline, TikTok Packs, captions y CTAs.

### Edición

Editor Agent revisa claridad, autenticidad, voz, repetición, hook strength y AI slop.

### Aprobación

Telegram permite aprobar, rechazar, pedir reescritura, editar instrucciones y marcar voice fit.

### Publicación

MVP recomendado: drafts/manual para LinkedIn, Substack, TikTok; auto-publicación solo donde sea viable y seguro.

### Analytics

Reporte semanal con insights por tema, hook, formato y plataforma.

## 9. TikTok Pack schema

Cada pack debe incluir:

- Title.
- Hook.
- Promise.
- Timeline por segundos.
- Visual instructions.
- Voiceover script.
- On-screen captions.
- Recording checklist.
- CTA.
- Hashtags.
- Repurpose links.

## 10. Roadmap técnico

### Fase 1 — Personal Content OS

- FastAPI base.
- Telegram bot.
- Postgres schema inicial.
- Prompt registry.
- Brand Memory mínima.
- LangGraph con Orchestrator, Strategist, Writer y Editor.
- Approval flow manual.
- TikTok Pack generator.

### Fase 2 — Workflow durability

- Temporal worker.
- Weekly planning workflow.
- Approval wait workflow.
- Publishing workflow.
- Retry-safe publishing.
- Audit logs.
- Cost tracking.

### Fase 3 — Analytics loop

- Modelo de métricas.
- Ingesta manual/API.
- Weekly analytics report.
- Analytics Agent.
- Memory update proposals.
- Golden dataset.

### Fase 4 — SaaS beta

- Auth.
- Multi-brand básico.
- Dashboard mínimo.
- Billing.
- Usage limits.
- Private beta onboarding.

## 11. Primer slice técnico

```txt
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
```

Primer objetivo: endpoint que reciba `WeeklyBrief` y devuelva `WorkflowRun` con plan semanal y assets iniciales, usando módulos separados para agentes y memoria mínima.
