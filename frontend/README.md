# Ghostwriter

AI-powered brand voice writing tool. Generate content that matches your unique voice, learn from corrections, and improve over time.

## Quick Start

1. Copy `.env.example` to `.env.local` and fill in your values
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Architecture

- **Frontend**: Next.js 14 + TypeScript + TailwindCSS
- **Database**: Supabase (Postgres + Auth + RLS)
- **AI**: Groq (llama-3.3-70b-versatile)
- **Services**: Voice Learning, Draft Generation, Brain Manager, Editor Agent

## Key Features

- **Brand Brain**: Learns your writing style from samples and corrections
- **Draft Generation**: Creates content matching your voice
- **Voice Learning**: Extracts rules from your corrections
- **Editor Agent**: Auto-reviews drafts for quality
- **Observability**: Request tracing and cost tracking

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/drafts` | GET | List user drafts |
| `/api/drafts/generate` | POST | Generate a new draft |
| `/api/drafts/[id]` | GET/PATCH/DELETE | Single draft operations |
| `/api/drafts/[id]/comments` | GET/POST | Draft comments |
| `/api/brain` | GET/PATCH | Brand brain operations |
| `/api/voice/learn` | POST | Learn from a correction |

## Environment Variables

See `.env.example` for required variables.

## Database

Supabase with Row Level Security (RLS). All tables scoped to `user_id = auth.uid()`.

## License

Private
