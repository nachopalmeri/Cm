# Backend — Social AI OS

## Dev

```bash
# Install dependencies
pip install -e ".[dev]"

# Run server
uvicorn app.main:app --reload --port 8000
```

## Telegram bot (v0.3.1)

Telegram is a human approval and control interface. It does not publish content to social networks.

### Setup

```bash
# Required
export TELEGRAM_BOT_TOKEN="your-bot-token"

# Run bot with polling
python -m app.integrations.telegram.bot
```

On Windows PowerShell:

```powershell
$env:TELEGRAM_BOT_TOKEN="your-bot-token"
python -m app.integrations.telegram.bot
```

### Commands

- `/start` — Show available commands.
- `/health` — Check bot/backend status and token configuration.
- `/weekly` — Run the weekly content workflow with local MockLLM defaults, show a rich summary, and present each asset with inline approve/reject buttons.

### Inline buttons

After `/weekly`, each asset shows:

- **✅ Approve** — Mark asset as approved (local state only, no publishing).
- **❌ Reject** — Mark asset as rejected (local state only).
- **🔄 Regenerate** — Planned feature; re-run `/weekly` to generate new assets.

### Testing without a token

```bash
# Test pure formatting functions and defaults (no token needed)
python -m pytest tests/test_telegram_handlers.py -v

# Test the full internal pipeline that /weekly uses
python -c "from app.integrations.telegram.defaults import default_brand_profile, default_weekly_brief; from app.integrations.telegram.bot import format_workflow_summary; from app.workflows.weekly import run_weekly_content_plan; run = run_weekly_content_plan(brief=default_weekly_brief(), brand=default_brand_profile()); print(format_workflow_summary(run))"
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes (to run bot) | Bot token from @BotFather. Not needed for tests. |

## API

- `GET /health` — Liveness probe.
- `POST /workflows/weekly-content-plan` — Run weekly content planning workflow.

## Structure

- `app/schemas/` — Pydantic models shared across modules.
- `app/workflows/` — Workflow implementations (synchronous skeletons for now).
- `app/integrations/telegram/` — Telegram control interface.
- `app/config.py` — Settings via pydantic-settings.
- `app/main.py` — FastAPI app and routers.
