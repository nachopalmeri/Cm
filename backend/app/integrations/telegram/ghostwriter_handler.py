"""Telegram handlers for the AI Ghostwriter flow.

Commands:
  /ghost <topic> [platform]  - generate drafts (platform defaults to x)
  /ingest <text>             - store a content sample in BrandMemory

Callback actions (inline buttons):
  ghost_approve:<draft_id>:<text_b64>  - approve and store as feedback_approved
  ghost_reject:<draft_id>:<text_b64>   - reject, prompt for correction
  ghost_correct:<draft_id>             - user types correction in next message
"""
from __future__ import annotations

import base64
import logging
import uuid

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

from app.config import settings
from app.agents.llm import build_llm_provider
from app.integrations.telegram.defaults import default_brand_profile
from app.schemas.api import GenerateRequest, IngestRequest, FeedbackRequest

logger = logging.getLogger(__name__)

_PLATFORM_DEFAULT = "x"
_MAX_BUTTON_TEXT = 32  # Telegram callback_data limit is 64 bytes


def _get_llm():
    return build_llm_provider(
        provider=settings.LLM_PROVIDER,
        openai_api_key=settings.OPENAI_API_KEY,
        anthropic_api_key=settings.ANTHROPIC_API_KEY,
        model=(
            settings.OPENAI_MODEL
            if settings.LLM_PROVIDER == "openai"
            else settings.ANTHROPIC_MODEL
        ),
    )


def _get_db_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.db.base import Base

    db_url = settings.DATABASE_URL or "sqlite:///./ghostwriter.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def _encode(text: str) -> str:
    """Base64-encode draft text for callback_data (max 48 chars)."""
    return base64.urlsafe_b64encode(text[:36].encode()).decode()[:48]


def _decode(encoded: str) -> str:
    """Decode base64 draft text from callback_data."""
    try:
        padded = encoded + "=" * (4 - len(encoded) % 4)
        return base64.urlsafe_b64decode(padded).decode()
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# /ghost command
# ---------------------------------------------------------------------------

async def ghost_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate ghostwriter drafts via Telegram.

    Usage: /ghost <topic> [platform]
    Example: /ghost "AI agents need memory" x
    """
    if update.effective_message is None:
        return

    args = context.args or []
    if not args:
        await update.effective_message.reply_text(
            "Uso: /ghost <tema> [plataforma]\n"
            "Ejemplo: /ghost 'AI agents need memory' x\n"
            "Plataformas: x, linkedin, substack, tiktok"
        )
        return

    topic = args[0]
    platform = args[1] if len(args) > 1 else _PLATFORM_DEFAULT
    brand = default_brand_profile()

    await update.effective_message.reply_text(
        f"Generando {3} drafts sobre '{topic}' para {platform}..."
    )

    session = _get_db_session()
    try:
        from app.ghostwriter.service import GhostwriterService
        svc = GhostwriterService(session, llm=_get_llm())
        result = await svc.generate(
            topic=topic,
            platform=platform,
            count=3,
            brand_profile=brand,
        )
    except Exception as exc:
        logger.exception("Ghost generate failed")
        await update.effective_message.reply_text(f"Error generando drafts: {exc}")
        return
    finally:
        session.close()

    if not result.options:
        await update.effective_message.reply_text("No se generaron drafts.")
        return

    # Store drafts in bot_data for feedback reference
    context.bot_data.setdefault("ghost_drafts", {})
    for draft in result.options:
        context.bot_data["ghost_drafts"][draft.id] = draft.text

    # Send each draft with approve/reject buttons
    for i, draft in enumerate(result.options, 1):
        encoded = _encode(draft.text)
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton(
                    "Aprobar",
                    callback_data=f"ghost_approve:{draft.id}:{encoded}",
                ),
                InlineKeyboardButton(
                    "Rechazar",
                    callback_data=f"ghost_reject:{draft.id}:{encoded}",
                ),
            ]
        ])
        msg = f"Draft {i}/{len(result.options)}\n\n{draft.text}"
        await update.effective_message.reply_text(msg, reply_markup=keyboard)


# ---------------------------------------------------------------------------
# /ingest command
# ---------------------------------------------------------------------------

async def ingest_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Ingest a content sample into BrandMemory.

    Usage: /ingest <texto de tu post>
    """
    if update.effective_message is None:
        return

    args = context.args or []
    if not args:
        await update.effective_message.reply_text(
            "Uso: /ingest <texto de tu post>\n"
            "Ejemplo: /ingest 'AI agents sin memoria son solo autocomplete'"
        )
        return

    text = " ".join(args)
    brand = default_brand_profile()

    session = _get_db_session()
    try:
        from app.ghostwriter.service import GhostwriterService
        svc = GhostwriterService(session, llm=_get_llm())
        result = await svc.ingest(
            texts=[text],
            source="telegram",
            brand_profile=brand,
        )
    except Exception as exc:
        logger.exception("Ghost ingest failed")
        await update.effective_message.reply_text(f"Error en ingest: {exc}")
        return
    finally:
        session.close()

    await update.effective_message.reply_text(
        f"Guardado en BrandMemory ({result.ingested} sample). "
        "Tu voz se actualiza con cada ingest."
    )


# ---------------------------------------------------------------------------
# Callback handler (approve / reject)
# ---------------------------------------------------------------------------

async def ghost_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle approve/reject button presses for ghostwriter drafts."""
    query = update.callback_query
    if query is None:
        return
    await query.answer()

    data = query.data or ""
    parts = data.split(":", 2)
    if len(parts) < 3:
        return

    action, draft_id, encoded_text = parts
    draft_text = context.bot_data.get("ghost_drafts", {}).get(draft_id, _decode(encoded_text))
    brand = default_brand_profile()

    # Use a stable brand_profile_id stub (first profile in DB)
    session = _get_db_session()
    try:
        from app.ghostwriter.service import GhostwriterService
        from app.memory.memory_service import MemoryService
        mem = MemoryService(session)
        profiles = mem.brand.list_profiles(limit=1)
        brand_profile_id = profiles[0].id if profiles else uuid.uuid4()

        svc = GhostwriterService(session, llm=_get_llm())

        if action == "ghost_approve":
            await svc.feedback(
                draft_id=draft_id,
                draft_text=draft_text,
                approved=True,
                correction=None,
                brand_profile_id=brand_profile_id,
            )
            await query.edit_message_text(
                f"Aprobado y guardado en BrandMemory.\n\n{draft_text}",
                reply_markup=None,
            )

        elif action == "ghost_reject":
            # Store pending correction request
            context.bot_data.setdefault("ghost_pending_correction", {})[str(query.from_user.id)] = {
                "draft_id": draft_id,
                "draft_text": draft_text,
                "brand_profile_id": str(brand_profile_id),
            }
            await query.edit_message_text(
                f"Rechazado. Escribi tu corrección como siguiente mensaje "
                f"o enviá /skip para omitir.\n\nDraft original:\n{draft_text}",
                reply_markup=None,
            )
    except Exception as exc:
        logger.exception("Ghost callback failed")
        await query.edit_message_text(f"Error procesando feedback: {exc}", reply_markup=None)
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Correction message handler
# ---------------------------------------------------------------------------

async def correction_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Capture free-text correction for a rejected draft."""
    if update.effective_message is None or update.effective_user is None:
        return

    user_id = str(update.effective_user.id)
    pending = context.bot_data.get("ghost_pending_correction", {}).get(user_id)
    if not pending:
        return  # Not waiting for a correction from this user

    correction = update.effective_message.text or ""
    if correction.strip() == "/skip":
        context.bot_data["ghost_pending_correction"].pop(user_id, None)
        await update.effective_message.reply_text("Omitido.")
        return

    session = _get_db_session()
    try:
        from app.ghostwriter.service import GhostwriterService
        svc = GhostwriterService(session, llm=_get_llm())
        await svc.feedback(
            draft_id=pending["draft_id"],
            draft_text=pending["draft_text"],
            approved=False,
            correction=correction,
            brand_profile_id=uuid.UUID(pending["brand_profile_id"]),
        )
        context.bot_data["ghost_pending_correction"].pop(user_id, None)
        await update.effective_message.reply_text(
            "Corrección guardada en BrandMemory. El próximo generate va a aprender de esto."
        )
    except Exception as exc:
        logger.exception("Correction storage failed")
        await update.effective_message.reply_text(f"Error guardando corrección: {exc}")
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Handler registration helper
# ---------------------------------------------------------------------------

def register_ghostwriter_handlers(application) -> None:
    """Register all ghostwriter handlers on a python-telegram-bot Application."""
    application.add_handler(CommandHandler("ghost", ghost_command))
    application.add_handler(CommandHandler("ingest", ingest_command))
    application.add_handler(
        CallbackQueryHandler(ghost_callback, pattern=r"^ghost_(approve|reject):")
    )
    application.add_handler(
        MessageHandler(
            filters.TEXT & ~filters.COMMAND,
            correction_message,
        )
    )
