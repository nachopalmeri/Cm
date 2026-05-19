# Data Model — AI Operating System for Personal Brands

Documenta el diseño completo de la memory layer: entidades, relaciones, pgvector strategy y modo local.

## ER Diagram

```txt
┌──────────────────┐       ┌─────────────────────────┐
│  brand_profiles   │──1:N─│  brand_memory_entries    │
│──────────────────│       │─────────────────────────│
│ id  UUID PK      │       │ id  UUID PK             │
│ name             │       │ brand_profile_id FK      │
│ voice            │       │ category                 │
│ tone             │       │ content                  │
│ personality      │       │ source                   │
│ opinions         │       │ confidence               │
│ style            │       └──────────┬──────────────┘
│ sensitive_topics │                  │ 1:1
│ primary_platforms│       ┌──────────┴──────────────┐
└──────┬───────────┘       │  memory_embeddings       │
       │                   │─────────────────────────│
       │ 1:N               │ id  UUID PK             │
       ├───────────────────│ source_type              │
       │                   │ source_id                │
       │                   │ embedding VECTOR(1536)   │
       │                   │ embedding_model          │
       │                   │ content_hash             │
       │                   └─────────────────────────┘
       │
       │ 1:N               ┌─────────────────────────┐
       ├───────────────────│  content_ideas           │
       │                   │─────────────────────────│
       │                   │ id  UUID PK             │
       │                   │ brand_profile_id FK      │
       │                   │ title                    │
       │                   │ description              │
       │                   │ pillar                   │
       │                   │ target_platform          │
       │                   │ status                   │
       │                   │ source                   │
       │                   │ metadata_json JSONB       │
       │                   └──────┬──────────────────┘
       │                          │ 1:N
       │                   ┌──────┴──────────────────┐
       │                   │  content_assets          │
       │                   │─────────────────────────│
       │                   │ id  UUID PK             │
       │                   │ content_idea_id FK       │
       │                   │ asset_type               │
       │                   │ platform                 │
       │                   │ body                     │
       │                   │ status                   │
       │                   │ version                  │
       │                   │ hook, cta, hashtags      │
       │                   │ metadata_json JSONB       │
       │                   └──────┬──────────────────┘
       │                          │ 1:1
       │                   ┌──────┴──────────────────┐
       │                   │  content_performances   │
       │                   │─────────────────────────│
       │                   │ id  UUID PK             │
       │                   │ content_asset_id FK UQ   │
       │                   │ platform                 │
       │                   │ impressions, likes...    │
       │                   │ ctr, engagement_rate      │
       │                   └─────────────────────────┘
       │
       │ 1:N               ┌─────────────────────────┐
       ├───────────────────│  audience_insights       │
       │                   │─────────────────────────│
       │                   │ id  UUID PK             │
       │                   │ brand_profile_id FK      │
       │                   │ segment                  │
       │                   │ insight_type             │
       │                   │ content                  │
       │                   │ confidence, source       │
       │                   │ metadata_json JSONB       │
       │                   └─────────────────────────┘
       │
       │ 1:N               ┌─────────────────────────┐
       ├───────────────────│  context_entries         │
       │                   │─────────────────────────│
       │                   │ id  UUID PK             │
       │                   │ brand_profile_id FK      │
       │                   │ entry_type               │
       │                   │ title, description       │
       │                   │ relevance_start, _end    │
       │                   │ status                   │
       │                   │ metadata_json JSONB       │
       │                   └─────────────────────────┘
       │
       │ 1:N               ┌─────────────────────────┐
       └───────────────────│  workflow_runs           │
                           │─────────────────────────│
                           │ id  UUID PK             │
                           │ brand_profile_id FK      │
                           │ workflow_type            │
                           │ status                   │
                           │ input_data JSONB         │
                           │ output_data JSONB        │
                           │ error                    │
                           │ total_tokens, cost, dur  │
                           └──────┬──────────────────┘
                                  │ 1:N
                           ┌──────┴──────────────────┐
                           │  agent_traces           │
                           │─────────────────────────│
                           │ id  UUID PK             │
                           │ workflow_run_id FK       │
                           │ agent_name              │
                           │ step_order               │
                           │ input/output_summary     │
                           │ model_used, tokens, cost │
                           │ prompt_version           │
                           │ metadata_json JSONB       │
                           └─────────────────────────┘
```

## Tablas

### brand_profiles

Perfil de marca personal. Centraliza voz, tono, personalidad, opiniones, estilo y temas sensibles.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | UUID PK | No | Identificador único |
| `name` | VARCHAR(255) | No | Nombre de la marca/persona |
| `voice` | TEXT | Sí | Descripción de la voz de marca |
| `tone` | TEXT | Sí | Tono predominante |
| `personality` | TEXT | Sí | Rasgos de personalidad |
| `opinions` | TEXT | Sí | Opiniones públicas conocidas |
| `style` | TEXT | Sí | Estilo de comunicación |
| `sensitive_topics` | TEXT | Sí | Temas prohibidos o sensibles |
| `primary_platforms` | TEXT | Sí | Plataformas principales (comma-separated enum) |
| `created_at` | TIMESTAMPTZ | No | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | No | Última actualización |
| `deleted_at` | TIMESTAMPTZ | Sí | Soft delete |

### brand_memory_entries

Entradas individuales de memoria de marca. Cada entrada representa un dato específico sobre la marca.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | UUID PK | No | Identificador único |
| `brand_profile_id` | UUID FK | No | Referencia a brand_profiles |
| `category` | VARCHAR(100) | No | Categoría: voice, tone, personality, opinions, style, sensitive_topics, custom |
| `content` | TEXT | No | Contenido de la memoria |
| `source` | VARCHAR(255) | Sí | Origen: user_input, agent_observation, analytics |
| `confidence` | FLOAT | Sí | Confianza 0.0-1.0 |
| `created_at` | TIMESTAMPTZ | No | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | No | Última actualización |
| `deleted_at` | TIMESTAMPTZ | Sí | Soft delete |

**Índice:** `(brand_profile_id, category)`

### content_ideas

Ideas de contenido generadas o sugeridas por agentes.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | UUID PK | No | Identificador único |
| `brand_profile_id` | UUID FK | No | Referencia a brand_profiles |
| `title` | VARCHAR(500) | No | Título de la idea |
| `description` | TEXT | Sí | Descripción detallada |
| `pillar` | VARCHAR(255) | Sí | Pilar de contenido |
| `target_platform` | VARCHAR(50) | Sí | Plataforma objetivo (enum) |
| `status` | VARCHAR(20) | No | Estado: draft, in_review, approved, rejected, published, archived |
| `source` | VARCHAR(255) | Sí | Origen: weekly_brief, strategist, repurposed |
| `metadata_json` | JSONB | Sí | Metadata flexible |
| `created_at` | TIMESTAMPTZ | No | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | No | Última actualización |
| `deleted_at` | TIMESTAMPTZ | Sí | Soft delete |

**Índice:** `(brand_profile_id, status)`

### content_assets

Assets producidos a partir de ideas: posts, threads, drafts, TikTok packs, etc.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | UUID PK | No | Identificador único |
| `content_idea_id` | UUID FK | No | Referencia a content_ideas |
| `asset_type` | VARCHAR(100) | No | Tipo: post, thread, newsletter_draft, tiktok_pack, caption, carousel, clip |
| `platform` | VARCHAR(50) | No | Plataforma (enum) |
| `body` | TEXT | No | Contenido del asset |
| `status` | VARCHAR(20) | No | Estado del asset |
| `version` | INTEGER | No | Versión (incrementa con rewrites) |
| `hook` | TEXT | Sí | Hook del contenido |
| `cta` | TEXT | Sí | Call to action |
| `hashtags` | TEXT | Sí | Hashtags |
| `metadata_json` | JSONB | Sí | Metadata específico de plataforma |
| `created_at` | TIMESTAMPTZ | No | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | No | Última actualización |
| `deleted_at` | TIMESTAMPTZ | Sí | Soft delete |

**Índice:** `(content_idea_id, platform)`

### content_performances

Métricas post-publicación por asset y plataforma.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | UUID PK | No | Identificador único |
| `content_asset_id` | UUID FK UQ | No | Referencia única a content_assets |
| `platform` | VARCHAR(50) | No | Plataforma medida |
| `impressions` | INTEGER | Sí | Impresiones |
| `likes` | INTEGER | Sí | Likes |
| `comments` | INTEGER | Sí | Comentarios |
| `shares` | INTEGER | Sí | Compartidos |
| `saves` | INTEGER | Sí | Guardados |
| `clicks` | INTEGER | Sí | Clicks |
| `ctr` | FLOAT | Sí | Click-through rate |
| `engagement_rate` | FLOAT | Sí | Tasa de engagement |
| `reach` | INTEGER | Sí | Alcance |
| `notes` | TEXT | Sí | Notas humanas o de agente |
| `measured_at` | VARCHAR(50) | Sí | Timestamp de medición |
| `created_at` | TIMESTAMPTZ | No | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | No | Última actualización |

### audience_insights

Insights de audiencia: horarios, formatos, hooks, temas, segmentos.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | UUID PK | No | Identificador único |
| `brand_profile_id` | UUID FK | No | Referencia a brand_profiles |
| `segment` | VARCHAR(100) | No | Segmento: developers, founders, freelancers, tech_creators, students, general |
| `insight_type` | VARCHAR(100) | No | Tipo: best_time, best_format, top_hook, top_topic, engagement_pattern |
| `content` | TEXT | No | Contenido del insight |
| `confidence` | FLOAT | Sí | Confianza 0.0-1.0 |
| `source` | VARCHAR(255) | Sí | Origen: analytics, agent_observation, user_input |
| `metadata_json` | JSONB | Sí | Metadata flexible |
| `created_at` | TIMESTAMPTZ | No | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | No | Última actualización |
| `deleted_at` | TIMESTAMPTZ | Sí | Soft delete |

**Índice:** `(brand_profile_id, segment)`

### context_entries

Contexto personal/profesional: proyectos, eventos, milestones, aprendizajes.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | UUID PK | No | Identificador único |
| `brand_profile_id` | UUID FK | No | Referencia a brand_profiles |
| `entry_type` | VARCHAR(50) | No | Tipo: project, event, milestone, learning, personal |
| `title` | VARCHAR(500) | No | Título |
| `description` | TEXT | Sí | Descripción |
| `relevance_start` | DATE | Sí | Inicio de relevancia |
| `relevance_end` | DATE | Sí | Fin de relevancia |
| `status` | VARCHAR(50) | Sí | Estado: active, completed, upcoming, archived |
| `metadata_json` | JSONB | Sí | Metadata flexible |
| `created_at` | TIMESTAMPTZ | No | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | No | Última actualización |
| `deleted_at` | TIMESTAMPTZ | Sí | Soft delete |

**Índice:** `(brand_profile_id, entry_type)`

### memory_embeddings

Embeddings vectoriales pgvector para búsqueda semántica. Diseño polimórfico: apunta a cualquier fuente.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | UUID PK | No | Identificador único |
| `source_type` | VARCHAR(50) | No | Tipo de fuente: brand_memory, content_idea, context_entry, audience_insight |
| `source_id` | UUID | No | ID de la entidad fuente (polimórfico) |
| `embedding` | VECTOR(1536) | Sí | Vector de embedding (pgvector) / JSON (SQLite) |
| `embedding_model` | VARCHAR(100) | Sí | Modelo usado: text-embedding-ada-002, etc. |
| `content_hash` | VARCHAR(64) | Sí | SHA-256 del contenido fuente (cache invalidation) |
| `created_at` | TIMESTAMPTZ | No | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | No | Última actualización |

**Índice único:** `(source_type, source_id)`
**Índice HNSW (Postgres):** `USING hnsw (embedding vector_cosine_ops)`

### workflow_runs

Registro de ejecuciones de workflows.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | UUID PK | No | Identificador único |
| `brand_profile_id` | UUID FK | No | Referencia a brand_profiles |
| `workflow_type` | VARCHAR(100) | No | Tipo: weekly_content_plan, daily_post, repurpose, analytics_report |
| `status` | VARCHAR(20) | No | Estado: running, completed, failed, cancelled |
| `input_data` | JSONB | Sí | Input original (ej. WeeklyBrief) |
| `output_data` | JSONB | Sí | Output final (ej. plan + assets) |
| `error` | TEXT | Sí | Error si falló |
| `total_tokens` | INTEGER | Sí | Tokens consumidos |
| `total_cost_usd` | FLOAT | Sí | Costo en USD |
| `duration_seconds` | FLOAT | Sí | Duración en segundos |
| `created_at` | TIMESTAMPTZ | No | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | No | Última actualización |

**Índice:** `(brand_profile_id, status)`

### agent_traces

Trace por agente dentro de un workflow run.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | UUID PK | No | Identificador único |
| `workflow_run_id` | UUID FK | No | Referencia a workflow_runs |
| `agent_name` | VARCHAR(100) | No | Nombre del agente |
| `step_order` | INTEGER | No | Orden de ejecución |
| `input_summary` | TEXT | Sí | Resumen del input |
| `output_summary` | TEXT | Sí | Resumen del output |
| `model_used` | VARCHAR(100) | Sí | Modelo LLM usado |
| `tokens_used` | INTEGER | Sí | Tokens consumidos |
| `cost_usd` | FLOAT | Sí | Costo en USD |
| `duration_seconds` | FLOAT | Sí | Duración en segundos |
| `prompt_version` | VARCHAR(50) | Sí | Versión del prompt (del registry) |
| `metadata_json` | JSONB | Sí | Metadata flexible |
| `created_at` | TIMESTAMPTZ | No | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | No | Última actualización |

## pgvector Strategy

### Diseño

- **Tabla única** `memory_embeddings` con columna `embedding VECTOR(1536)`
- **Polimorfismo** vía `source_type` + `source_id` (evita FKs circulares)
- **Dimensión 1536** (OpenAI ada-002). Cambiar si se usa otro modelo.
- **Índice HNSW** para similarity search eficiente (>10k embeddings)
- **Content hash** para cache invalidation: si el contenido fuente cambia, se regenera el embedding

### Búsqueda semántica

```sql
-- Cosine similarity search
SELECT *, 1 - (embedding <=> '[0.1, 0.2, ...]') AS similarity
FROM memory_embeddings
WHERE source_type = 'brand_memory'
  AND 1 - (embedding <=> '[0.1, 0.2, ...]') > 0.7
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 10;
```

### Upsert pattern

```python
# Check if embedding exists
existing = repo._get_by_source(source_type, source_id)
if existing:
    existing.embedding = new_embedding
    existing.content_hash = new_hash
else:
    repo.create(MemoryEmbedding(...))
```

### Reindex

El campo `content_hash` permite detectar cuándo el contenido fuente cambió y el embedding necesita regeneración:

```python
if repo.needs_reindex(source_type, source_id, new_content):
    new_embedding = await embedding_service.generate_embedding(new_content)
    repo.upsert_embedding(source_type, source_id, new_embedding, content=new_content)
```

## Modo Local (SQLite)

Cuando no hay `DATABASE_URL` configurada, el sistema opera en modo local:

| Feature | Postgres | Local (SQLite) |
|---|---|---|
| Storage | Postgres + pgvector | SQLite file |
| Embeddings | VECTOR(1536) + HNSW | JSON text (no search) |
| Semantic search | Cosine similarity | No disponible |
| Text search | ILIKE + FTS | LIKE patterns |
| JSONB | Native | JSON text |
| Concurrent writes | Sí | No (single-writer) |
| Migrations | Alembic + pgvector ops | Alembic (pgvector ops = no-op) |

### Activación automática

```python
# engine.py detecta automáticamente
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgresql"):
    # Modo Postgres
else:
    # Modo local (SQLite)
```

### Inicialización local

```python
from backend.app.memory.local_fallback import init_local_db
db_path = init_local_db()  # Crea tablas vía metadata.create_all
```

## Mapeo SPEC §4 → Tablas

| Memory System (SPEC) | Tabla | Descripción |
|---|---|---|
| Brand Memory → Voz | brand_profiles.voice | Voz de marca |
| Brand Memory → Tono | brand_profiles.tone | Tono predominante |
| Brand Memory → Personalidad | brand_profiles.personality | Rasgos de personalidad |
| Brand Memory → Opiniones | brand_profiles.opinions + brand_memory_entries | Opiniones y entradas detalladas |
| Brand Memory → Estilo | brand_profiles.style | Estilo de comunicación |
| Brand Memory → Temas prohibidos | brand_profiles.sensitive_topics | Temas sensibles |
| Content Memory → Qué se publicó | content_assets | Assets producidos |
| Content Memory → Qué funcionó | content_performances (engagement_rate > threshold) | Métricas de éxito |
| Content Memory → Qué no funcionó | content_performances (engagement_rate < threshold) | Métricas de fracaso |
| Content Memory → Qué se repitió | content_ideas + content_assets (dedup por title/body) | Detección de repetición |
| Content Memory → Ideas↔Assets | content_ideas 1:N content_assets | Relación idea-asset |
| Audience Memory → Horarios | audience_insights (insight_type=best_time) | Mejores horarios |
| Audience Memory → Formatos | audience_insights (insight_type=best_format) | Mejores formatos |
| Audience Memory → Hooks | audience_insights (insight_type=top_hook) | Hooks exitosos |
| Audience Memory → Temas exitosos | audience_insights (insight_type=top_topic) | Temas que funcionan |
| Audience Memory → Segmentos | audience_insights.segment | Segmentos de audiencia |
| Context Memory → Proyectos | context_entries (entry_type=project) | Proyectos activos |
| Context Memory → Eventos | context_entries (entry_type=event) | Eventos próximos |
| Context Memory → Lanzamientos | context_entries (entry_type=milestone) | Milestones/lanzamientos |
| Context Memory → Roadmap | context_entries (entry_type=milestone, status=upcoming) | Próximos hitos |
| Context Memory → Contexto personal | context_entries (entry_type=personal) | Contexto personal |

## Convenciones

- **PKs:** UUID v4
- **Timestamps:** `created_at`, `updated_at` con `server_default=func.now()`
- **Soft delete:** `deleted_at` nullable (todos los repos filtran `deleted_at IS NULL`)
- **Enums:** Python Enum + VARCHAR en DB (portabilidad SQLite ↔ Postgres)
- **JSONB:** Metadata flexible por tabla
- **Repositorios:** Inyectan `Session` via FastAPI `Depends(get_session)`
- **Modo local:** Auto-detectado, sin configuración manual
