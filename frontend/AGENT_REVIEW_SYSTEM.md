# Agent Review System

Sistema de revisión automática de drafts con comentarios generados por IA.

---

## 🎯 Objetivo

Proporcionar feedback automático sobre la calidad de los drafts generados, detectando problemas comunes y sugiriendo mejoras antes de publicar.

---

## 🏗️ Arquitectura

### Componentes

```
┌─────────────────────────────────────────────────────┐
│                  Draft Generation                    │
│                                                       │
│  1. User requests draft                              │
│  2. Generate content (Groq)                          │
│  3. Save to database                                 │
│  4. Auto-review (background) ──────────┐            │
│  5. Return draft to user                │            │
└─────────────────────────────────────────┼────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────┐
│                  Editor Agent                        │
│                                                       │
│  Analyzes:                                           │
│  • Hook quality (engaging opening)                   │
│  • Voice match (user's style)                        │
│  • Repetition (word frequency)                       │
│  • Structure (formatting)                            │
│  • Length (platform limits)                          │
│                                                       │
│  Generates: ReviewResult                             │
│  • comments: ReviewComment[]                         │
│  • overall_score: number                             │
└─────────────────────────────────────────┬────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────┐
│                  Comments Storage                    │
│                                                       │
│  draft_comments table:                               │
│  • id, draft_id, user_id                            │
│  • type (agent/user)                                │
│  • severity (info/warning/error)                    │
│  • category, content                                │
│  • resolved, metadata                               │
└─────────────────────────────────────────┬────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────┐
│                  Comments UI                         │
│                                                       │
│  CommentsPanel:                                      │
│  • List comments with filters                       │
│  • Resolve/unresolve                                │
│  • Add user comments                                │
│  • Delete user comments                             │
│                                                       │
│  CommentCard:                                        │
│  • Visual severity indicators                       │
│  • Category badges                                  │
│  • Suggestions dropdown                             │
│  • Timestamp                                        │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Análisis del Editor Agent

### 1. Hook Analysis

**Objetivo:** Detectar hooks débiles que no captan atención.

**Criterios:**
- ✅ Tiene pregunta (?)
- ✅ Tiene énfasis (!)
- ✅ Incluye números
- ✅ Es corto (<100 chars)
- ❌ Empieza con palabras débiles (hoy, ayer, les cuento, etc.)

**Score:** 0-100 (threshold: 40)

**Ejemplo de comentario:**
```
⚠️ Hook
El hook podría ser más fuerte. Considerá empezar con una pregunta 
provocativa, un dato impactante, o una afirmación controversial 
para captar atención.

Sugerencias:
• Usar una pregunta que genere curiosidad
• Incluir un número o estadística sorprendente
• Hacer una afirmación controversial o contraintuitiva
```

### 2. Voice Match Analysis

**Objetivo:** Verificar que el tono y vocabulario coincidan con el estilo del usuario.

**Criterios:**
- Match rate de palabras comunes (>20%)
- Consistencia de tono (formal vs informal)
- Uso de vocabulario característico

**Ejemplo de comentario:**
```
⚠️ Voz
El tono o vocabulario no coincide con tu estilo habitual. 
Revisá que suene auténtico y natural para vos.

Sugerencias:
• Usar palabras y expresiones que usás normalmente
• Mantener el nivel de formalidad de tus otros posts
• Evitar jerga o términos que no usarías en persona
```

### 3. Repetition Detection

**Objetivo:** Detectar palabras repetidas excesivamente.

**Criterios:**
- Palabras de >4 letras repetidas >2 veces
- Ranking por frecuencia

**Ejemplo de comentario:**
```
ℹ️ Repetición
Detecté palabras repetidas: "herramientas" (3x), "datos" (3x). 
Considerá usar sinónimos para mayor variedad.

Sugerencias:
• Usar sinónimos para palabras repetidas
• Reformular frases para evitar repetición
• Eliminar palabras innecesarias
```

### 4. Structure Analysis

**Objetivo:** Verificar formato apropiado para la plataforma.

**Twitter:**
- ❌ Líneas >280 chars

**LinkedIn:**
- ℹ️ Falta de espacios entre párrafos (si >3 líneas)

**Ejemplo de comentario:**
```
⚠️ Estructura
Algunas líneas son muy largas para Twitter. Considerá dividirlas 
en tweets más cortos o usar un thread.

Sugerencias:
• Dividir en múltiples tweets
• Usar saltos de línea para mejor legibilidad
• Acortar frases largas
```

### 5. Length Check

**Objetivo:** Verificar límites de plataforma.

**Twitter:**
- ❌ >280 chars (error)

**LinkedIn:**
- ⚠️ >3000 chars (warning)
- ℹ️ Ideal: 1300-1500 chars

**Ejemplo de comentario:**
```
❌ Longitud
El contenido excede el límite de Twitter (350/280 caracteres). 
Necesitás acortarlo o convertirlo en thread.

Sugerencias:
• Eliminar palabras innecesarias
• Usar abreviaciones apropiadas
• Dividir en múltiples tweets
```

---

## 🎨 Severity Levels

### Error ❌
- **Color:** Rojo
- **Uso:** Problemas críticos que impiden publicación
- **Ejemplos:** Excede límite de caracteres

### Warning ⚠️
- **Color:** Amarillo
- **Uso:** Problemas importantes que afectan calidad
- **Ejemplos:** Hook débil, voice mismatch, estructura pobre

### Info ℹ️
- **Color:** Azul
- **Uso:** Sugerencias de mejora opcionales
- **Ejemplos:** Repetición, falta de espacios

---

## 📂 Database Schema

```sql
CREATE TABLE draft_comments (
  id UUID PRIMARY KEY,
  draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT CHECK (type IN ('agent', 'user')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'error')),
  category TEXT CHECK (category IN ('hook', 'voice', 'repetition', 'structure', 'length', 'clarity')),
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `draft_id` - Para queries por draft
- `resolved` - Para filtrar pendientes
- `type` - Para filtrar agent vs user
- `severity` - Para ordenar por prioridad
- `created_at` - Para ordenar cronológicamente

---

## 🔌 API Endpoints

### GET `/api/drafts/[id]/comments`

Lista comentarios de un draft.

**Query params:**
- `resolved=true|false` - Filtrar por estado
- `type=agent|user` - Filtrar por tipo

**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "draft_id": "uuid",
      "type": "agent",
      "severity": "warning",
      "category": "hook",
      "content": "El hook podría ser más fuerte...",
      "resolved": false,
      "metadata": {
        "score": 35,
        "threshold": 40,
        "suggestions": ["..."]
      },
      "created_at": "2025-01-25T..."
    }
  ]
}
```

### POST `/api/drafts/[id]/comments`

Crea un comentario (user o agent).

**Body:**
```json
{
  "type": "user",
  "severity": "info",
  "category": "clarity",
  "content": "Revisar este párrafo",
  "metadata": {}
}
```

**Response:**
```json
{
  "comment": { ... }
}
```

### PATCH `/api/drafts/[id]/comments/[commentId]`

Actualiza un comentario (resolve/unresolve).

**Body:**
```json
{
  "resolved": true
}
```

**Response:**
```json
{
  "comment": { ... }
}
```

### DELETE `/api/drafts/[id]/comments/[commentId]`

Elimina un comentario.

**Response:**
```json
{
  "success": true
}
```

---

## 🎨 UI Components

### CommentsPanel

Sidebar que muestra todos los comentarios.

**Features:**
- Filtros: All, Unresolved, Agent, User
- Unresolved count badge
- New comment form
- Real-time updates
- Empty states

**Props:**
```typescript
interface CommentsPanelProps {
  draftId: string
}
```

### CommentCard

Card individual de comentario.

**Features:**
- Severity icon and color
- Category badge
- Resolve/unresolve toggle
- Delete button (user comments only)
- Suggestions dropdown
- Timestamp

**Props:**
```typescript
interface CommentCardProps {
  comment: Comment
  onResolve: (id: string, resolved: boolean) => void
  onDelete?: (id: string) => void
}
```

---

## 🧪 Testing

### Manual Testing Checklist

#### Auto-Review
- [ ] Generate draft → verify auto-review runs
- [ ] Check comments appear in database
- [ ] Verify comment categories are correct
- [ ] Verify severity levels are appropriate
- [ ] Check suggestions are actionable

#### Comments API
- [ ] GET comments → returns list
- [ ] GET with filters → filters work
- [ ] POST comment → creates successfully
- [ ] PATCH resolve → updates state
- [ ] DELETE comment → removes from DB

#### UI Components
- [ ] CommentsPanel loads comments
- [ ] Filters work (All, Unresolved, Agent, User)
- [ ] Resolve/unresolve toggles state
- [ ] Delete removes comment
- [ ] New comment form works
- [ ] Empty states display correctly

### Edge Cases

- [ ] Draft with no issues → 0 comments
- [ ] Draft with all issues → 5+ comments
- [ ] Resolve all comments → unresolved count = 0
- [ ] Delete draft → cascade deletes comments
- [ ] Very long comment → displays correctly
- [ ] Special characters in comment → sanitized

---

## 📊 Metrics

### Agent Performance

**Track:**
- Comments per draft (avg)
- Comments by severity (distribution)
- Comments by category (distribution)
- False positives (user-reported)
- Review duration (ms)

**Goals:**
- Avg comments: 2-4 per draft
- False positives: <20%
- Review duration: <2s

### User Engagement

**Track:**
- User comments created
- Comments resolved per day
- Drafts with 0 comments (%)
- Time to resolve (avg)

**Goals:**
- User comments: >10% of total
- Resolution rate: >80%
- Time to resolve: <5 min

---

## 🚀 Usage Example

### 1. Generate Draft

```typescript
// POST /api/drafts/generate
{
  "topic": "IA en educación",
  "channel": "twitter"
}

// Response
{
  "draft": {
    "id": "draft-123",
    "content": "Hoy quiero compartir...",
    ...
  },
  "trace_id": "trace-456"
}
```

### 2. Auto-Review (Background)

```typescript
// Automatically triggered after draft save
const review = await reviewDraft(content, brain, channel)

// Saves comments to database
for (const comment of review.comments) {
  await supabase.from('draft_comments').insert({
    draft_id,
    type: 'agent',
    severity: comment.severity,
    category: comment.category,
    content: comment.content,
    metadata: comment.metadata
  })
}
```

### 3. View Comments

```typescript
// GET /api/drafts/draft-123/comments?resolved=false

// Response
{
  "comments": [
    {
      "severity": "warning",
      "category": "hook",
      "content": "El hook podría ser más fuerte...",
      ...
    }
  ]
}
```

### 4. Resolve Comment

```typescript
// PATCH /api/drafts/draft-123/comments/comment-789
{
  "resolved": true
}
```

---

## 🔮 Future Improvements

### Short Term
- Notificaciones cuando agent agrega comentarios
- Comentarios inline (en lugar de sidebar)
- Sugerencias de fix automáticas
- Batch resolve

### Medium Term
- Agent aprende de comentarios resueltos/ignorados
- Comentarios con severity ajustable por user
- Export comments como checklist
- Analytics dashboard

### Long Term
- Multi-agent review (diferentes perspectivas)
- A/B testing de agent prompts
- User feedback loop para mejorar agent
- Integration con approval workflow

---

## 📚 References

- **Editor Agent:** `src/lib/services/editor-agent.ts`
- **Comments API:** `src/app/api/drafts/[id]/comments/`
- **UI Components:** `src/components/drafts/`
- **Migration:** `supabase/migrations/20250125_add_draft_comments.sql`
- **Plan:** `.windsurf/plans/ghostwriter-phase2-agent-review-5d3d61.md`
