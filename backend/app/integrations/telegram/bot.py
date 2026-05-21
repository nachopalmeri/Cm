"""Telegram bot entrypoint â€” v0.4.0 approval UX with TikTok Pack review."""
from __future__ import annotations

import logging

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
)

from app.config import settings
from app.integrations.telegram.defaults import default_brand_profile, default_weekly_brief
from app.schemas.content import ContentAsset
from app.schemas.tiktok import TikTokPack
from app.schemas.workflow import WorkflowRun, WorkflowStatus
from app.workflows.weekly import run_weekly_content_plan


logger = logging.getLogger(__name__)

_ASSET_BODY_PREVIEW_LEN = 200
_VOICEOVER_PREVIEW_LEN = 150

# ---------------------------------------------------------------------------
# Pure formatting helpers (testable without Telegram)
# ---------------------------------------------------------------------------


def format_workflow_summary(workflow_run: WorkflowRun) -> str:
    """Rich summary of a WorkflowRun for Telegram display."""
    lines = [
        f"ðŸ“‹ Workflow: {workflow_run.workflow_type}",
        f"Run: {workflow_run.run_id}",
        f"Status: {workflow_run.status.value}",
        f"Brand: {workflow_run.brand_handle}",
        "",
    ]

    if workflow_run.pillars:
        lines.append(f"ðŸ— Pillars ({len(workflow_run.pillars)}):")
        for p in workflow_run.pillars:
            lines.append(f"  â€¢ {p.name}: {p.description}")

    if workflow_run.assets:
        lines.append("")
        lines.append(f"ðŸ“„ Assets ({len(workflow_run.assets)}):")
        for idx, a in enumerate(workflow_run.assets):
            lines.append(f"  {idx + 1}. [{a.platform.value}] {a.format} â€” {a.status}")

    if workflow_run.tiktok_packs:
        lines.append("")
        lines.append(f"ðŸŽµ TikTok Packs ({len(workflow_run.tiktok_packs)}):")
        for idx, tp in enumerate(workflow_run.tiktok_packs):
            lines.append(f"  {idx + 1}. {tp.title}")

    lines.append("")
    lines.append(f"ðŸ” Traces: {len(workflow_run.traces)}")

    if workflow_run.error_message:
        lines.append(f"âŒ Error: {workflow_run.error_message}")

    return "\n".join(lines)


def format_asset_card(asset: ContentAsset, index: int) -> str:
    """Format a single asset for Telegram display with preview."""
    preview = asset.body[:_ASSET_BODY_PREVIEW_LEN]
    if len(asset.body) > _ASSET_BODY_PREVIEW_LEN:
        preview += "â€¦"

    return (
        f"ðŸ“ Asset #{index + 1}\n"
        f"Platform: {asset.platform.value}\n"
        f"Format: {asset.format}\n"
        f"Status: {asset.status}\n"
        f"Preview:\n{preview}"
    )


def format_tiktok_pack_summary(pack: TikTokPack, index: int) -> str:
    """Compact TikTok Pack card for the listing after /weekly."""
    return (
        f"ðŸŽµ TikTok Pack #{index + 1}\n"
        f"Title: {pack.title}\n"
        f"Hook: {pack.hook}\n"
        f"CTA: {pack.cta}\n"
        f"Hashtags: {' '.join(pack.hashtags[:5])}"
    )


def format_tiktok_pack_detail(pack: TikTokPack) -> str:
    """Full TikTok Pack detail shown when user taps View."""
    voiceover = pack.voiceover_script[:_VOICEOVER_PREVIEW_LEN]
    if len(pack.voiceover_script) > _VOICEOVER_PREVIEW_LEN:
        voiceover += "â€¦"

    captions = "\n".join(f"  â€¢ {c}" for c in pack.on_screen_captions[:6])
    checklist = "\n".join(f"  â€¢ {c}" for c in pack.recording_checklist[:6])

    return (
        f"ðŸŽ¬ {pack.title}\n\n"
        f"Hook: {pack.hook}\n"
        f"Promise: {pack.promise}\n\n"
        f"Voiceover:\n{voiceover}\n\n"
        f"On-screen captions:\n{captions}\n\n"
        f"Visual direction:\n{pack.visual_instructions}\n\n"
        f"Recording checklist:\n{checklist}\n\n"
        f"CTA: {pack.cta}\n"
        f"Hashtags: {' '.join(pack.hashtags)}"
    )


def format_error_message(error_type: str, detail: str = "") -> str:
    """User-facing error messages by category."""
    messages = {
        "no_token": (
            "âš ï¸ TELEGRAM_BOT_TOKEN no configurado.\n"
            "ConfigurÃ¡ la variable de entorno antes de iniciar el bot."
        ),
        "workflow_exception": (
            "âŒ El workflow semanal fallÃ³.\n"
            f"Detalle: {detail}" if detail else "âŒ El workflow semanal fallÃ³. RevisÃ¡ logs del backend."
        ),
        "invalid_payload": (
            "âš ï¸ Payload invÃ¡lido para el workflow.\n"
            f"Detalle: {detail}" if detail else "âš ï¸ Payload invÃ¡lido para el workflow."
        ),
        "asset_not_found": "âš ï¸ Asset no encontrado en el Ãºltimo run.",
        "pack_not_found": "âš ï¸ TikTok Pack no encontrado en el Ãºltimo run.",
        "no_run_available": "âš ï¸ No hay un workflow run disponible. EjecutÃ¡ /weekly primero.",
    }
    return messages.get(error_type, f"âš ï¸ Error desconocido: {error_type}")


def build_asset_keyboard(asset_id: str) -> InlineKeyboardMarkup:
    """Inline keyboard with approve/reject buttons for an asset."""
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("âœ… Approve", callback_data=f"approve:{asset_id}"),
            InlineKeyboardButton("âŒ Reject", callback_data=f"reject:{asset_id}"),
        ],
        [
            InlineKeyboardButton("ðŸ”„ Regenerate", callback_data=f"regenerate:{asset_id}"),
        ],
    ])


def build_tiktok_pack_keyboard(pack_index: int) -> InlineKeyboardMarkup:
    """Inline keyboard with View button for a TikTok Pack."""
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("ðŸ‘ View Pack", callback_data=f"view_pack:{pack_index}"),
        ],
    ])


# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.effective_message is None:
        return
    await update.effective_message.reply_text(
        "ðŸ¤– Social AI OS bot activo.\n\n"
        "Comandos:\n"
        "/health â€” verificar estado\n"
        "/weekly â€” ejecutar workflow semanal con MockLLM\n\n"
        "Este bot es interfaz de aprobaciÃ³n. No publica contenido en redes."
    )


async def health(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.effective_message is None:
        return
    token_status = "âœ… configurado" if settings.TELEGRAM_BOT_TOKEN else "âŒ no configurado"
    await update.effective_message.reply_text(
        f"ok â€” {settings.APP_NAME}\nToken: {token_status}"
    )


async def weekly(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.effective_message is None:
        return

    await update.effective_message.reply_text("â³ Ejecutando workflow semanal con MockLLMâ€¦")

    try:
        workflow_run = await run_weekly_content_plan(
            brief=default_weekly_brief(),
            brand=default_brand_profile(),
        )
    except Exception as exc:
        logger.exception("Telegram weekly workflow failed")
        await update.effective_message.reply_text(
            format_error_message("workflow_exception", str(exc))
        )
        return

    # Store run for callback access
    context.bot_data["last_run"] = workflow_run

    # Send overall summary with pillar list, asset list, TikTok Pack list
    await update.effective_message.reply_text(format_workflow_summary(workflow_run))

    # Send each asset with inline approve/reject buttons
    for idx, asset in enumerate(workflow_run.assets):
        card = format_asset_card(asset, idx)
        keyboard = build_asset_keyboard(asset.id)
        await update.effective_message.reply_text(card, reply_markup=keyboard)

    # Send each TikTok Pack with View button
    for idx, pack in enumerate(workflow_run.tiktok_packs):
        summary = format_tiktok_pack_summary(pack, idx)
        keyboard = build_tiktok_pack_keyboard(idx)
        await update.effective_message.reply_text(summary, reply_markup=keyboard)


async def asset_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle inline button presses for assets and TikTok Packs."""
    query = update.callback_query
    if query is None:
        return

    await query.answer()

    callback_data = query.data or ""
    parts = callback_data.split(":", 1)
    if len(parts) != 2:
        await query.edit_message_reply_markup(reply_markup=None)
        return

    action, key = parts

    workflow_run: WorkflowRun | None = context.bot_data.get("last_run")
    if workflow_run is None:
        await query.edit_message_text(format_error_message("no_run_available"))
        return

    # --- Asset actions ---
    if action in ("approve", "reject", "regenerate"):
        asset = next((a for a in workflow_run.assets if a.id == key), None)
        if asset is None:
            await query.edit_message_text(format_error_message("asset_not_found"))
            return

        if action == "approve":
            asset.status = "approved"
            await query.edit_message_text(
                f"âœ… Asset aprobado.\n\n{format_asset_card(asset, workflow_run.assets.index(asset))}",
                reply_markup=None,
            )
        elif action == "reject":
            asset.status = "rejected"
            await query.edit_message_text(
                f"âŒ Asset rechazado.\n\n{format_asset_card(asset, workflow_run.assets.index(asset))}",
                reply_markup=None,
            )
        elif action == "regenerate":
            await query.edit_message_text(
                "ðŸ”„ Regenerate no implementado aÃºn. Re-ejecutÃ¡ /weekly para generar nuevos assets.",
                reply_markup=None,
            )

    # --- TikTok Pack actions ---
    elif action == "view_pack":
        try:
            pack_index = int(key)
        except (ValueError, IndexError):
            await query.edit_message_text(format_error_message("pack_not_found"))
            return

        if pack_index < 0 or pack_index >= len(workflow_run.tiktok_packs):
            await query.edit_message_text(format_error_message("pack_not_found"))
            return

        pack = workflow_run.tiktok_packs[pack_index]
        await query.edit_message_text(
            format_tiktok_pack_detail(pack),
            reply_markup=None,
        )

    else:
        await query.edit_message_reply_markup(reply_markup=None)


# ---------------------------------------------------------------------------
# Application builder
# ---------------------------------------------------------------------------


def build_application():
    if not settings.TELEGRAM_BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is required to run the Telegram bot")

    from app.integrations.telegram.ghostwriter_handler import register_ghostwriter_handlers

    application = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("health", health))
    application.add_handler(CommandHandler("weekly", weekly))
    application.add_handler(CallbackQueryHandler(asset_callback, pattern=r"^(?!ghost_)"))
    # Register ghostwriter handlers (ghost, ingest, approve/reject, correction)
    register_ghostwriter_handlers(application)
    return application


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    application = build_application()
    application.run_polling()


if __name__ == "__main__":
    main()


