# Cm — Social AI OS

AI-native content operating system for personal brands. Multi-agent pipeline that turns a weekly brief (or social input from X / Substack) into approved content assets, TikTok packs, and auto-generated videos, with Telegram as human approval interface.

## Status

- Tests: 141 passing
- Pipeline: Strategist -> Writer -> Editor -> TikTokPackGenerator -> TikTokVideoGenerator
- Interfaces: REST API (FastAPI) + Telegram bot
- Storage: SQLite local / Postgres + pgvector (optional)
- LLM: MockLLM by default; pluggable provider

## Stack

- Python 3.11+
- FastAPI + Pydantic v2
- SQLAlchemy + Alembic
- python-telegram-bot
- moviepy + edge-tts + Pillow + Pexels (TikTok video generation)
- feedparser (Substack RSS)
- pytest

## Quickstart

\\\powershell
cd backend
pip install -e ".[dev]"
copy ..\.env.example ..\.env
python -m pytest
uvicorn app.main:app --reload
\\\

## Environment variables

See \.env.example\. All optional — system runs offline with MockLLM and SQLite.

## Architecture

- \ackend/app/schemas/\ — single source of truth for shared Pydantic contracts
- \ackend/app/agents/\ — Orchestrator + Strategist + Writer + Editor
- \ackend/app/workflows/\ — weekly content plan + TikTok pack generator
- \ackend/app/generators/\ — TikTok video composer (stock + TTS + captions)
- \ackend/app/integrations/telegram/\ — approval UX (no publishing)
- \ackend/app/integrations/twitter/\, \substack/\ — input analyzers + fusion
- \ackend/app/memory/\ — persistent memory layer (optional)
- \ackend/app/prompts/\ — versioned prompt registry
- \ackend/migrations/\ — Alembic migrations

## Endpoints

- \GET /health\
- \POST /workflows/weekly-content-plan\ — accepts optional \social_sources\ for auto-enrichment

## Roadmap

- v0.7.0 — Deploy (Railway + Supabase)
- v0.8.0 — Real publisher (X / TikTok / Substack)
- v0.9.0 — Analytics learning loop
- v1.0.0 — Multi-tenant SaaS

## License

Private. All rights reserved.
