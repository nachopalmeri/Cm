"""Platform-specific content rules for the ghostwriter.

Each platform defines format, hook style, structure and CTA expectations
so the LLM generates content that fits the destination natively.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PlatformRule:
    name: str
    ideal_length: str
    hook_style: str
    structure: str
    cta_style: str
    cross_post_hint: str | None = None


PLATFORM_RULES: dict[str, PlatformRule] = {
    "x": PlatformRule(
        name="X / Twitter",
        ideal_length="280-1500 caracteres (longpost denso)",
        hook_style="Primera linea agresiva: contradiccion, dato sorprendente o pregunta que incomoda. El scroll se detiene en la primera frase.",
        structure="Parrafos de 1-3 frases. Linea vacia entre cada uno. Sin subtitulos. Sin bullets. Ritmo rap.",
        cta_style="Pregunta final que invite al reply. Nunca 'Dale RT si estas de acuerdo'.",
        cross_post_hint="Si existe version larga en Substack, terminar con una linea separada: 'Version completa: [link]' — esto activa trafico cruzado.",
    ),
    "substack": PlatformRule(
        name="Substack",
        ideal_length="800-1500 palabras",
        hook_style="Titulo que promete profundidad + anecdota de apertura o pregunta filosofica. El lector eligio abrir el email, dale profundidad.",
        structure="Secciones con subtitulos en negrita. Narrativa fluida. Parrafos medianos (3-5 frases). Puede usar analogias y digresiones si suman.",
        cta_style="Cierre con reflexion + 'Si te gusto, suscribite' o 'Respondeme este mail'. Comentarios habilitados.",
        cross_post_hint="El post de X es el gancho para traer atencion hacia este. Son complementarios, no clones.",
    ),
    "linkedin": PlatformRule(
        name="LinkedIn",
        ideal_length="150-300 palabras",
        hook_style="Primera linea en negrita que interrumpa el scroll. Personal y especifico, no corporativo y generico.",
        structure="Parrafos cortos (1-2 frases). Espacio entre cada uno. Bullets opcionales si hay lista de 3+. Terminar con insight unico.",
        cta_style="Pregunta profesional que invite a comentar. Evitar pedir likes directamente.",
        cross_post_hint=None,
    ),
    "tiktok": PlatformRule(
        name="TikTok (guion hablado)",
        ideal_length="60-90 segundos de habla (~150 palabras)",
        hook_style="Primeros 3 segundos: dato sorprendente o provocacion directa a camara. 'Lo que nadie te dice sobre X' o 'Hice X y paso esto'.",
        structure="Intro hook / Desarrollo de 2-3 puntos / Giro o revelacion / CTA. Todo fluye oral, sin subtitulos ni bullets en el guion.",
        cta_style="'Seguime para la parte 2', 'Comentame si te paso' o pregunta directa al viewer.",
        cross_post_hint=None,
    ),
}

_FALLBACK_RULE = PlatformRule(
    name="General",
    ideal_length="Longitud apropiada para la plataforma",
    hook_style="Primera linea que capture atencion inmediatamente",
    structure="Estructura clara con inicio, desarrollo y cierre",
    cta_style="Llamada a la accion relevante al contexto",
)


def get_platform_rule(platform: str) -> PlatformRule:
    """Return the PlatformRule for the given platform slug (case-insensitive).

    Falls back to a generic rule for unknown platforms.
    """
    return PLATFORM_RULES.get(platform.lower().strip(), _FALLBACK_RULE)


def render_platform_rules(platform: str) -> str:
    """Render platform rules as a formatted string for prompt injection."""
    rule = get_platform_rule(platform)
    lines = [
        f"Plataforma: {rule.name}",
        f"Longitud ideal: {rule.ideal_length}",
        f"Estilo de hook: {rule.hook_style}",
        f"Estructura: {rule.structure}",
        f"CTA: {rule.cta_style}",
    ]
    if rule.cross_post_hint:
        lines.append(f"Estrategia cross-platform: {rule.cross_post_hint}")
    return "\n".join(lines)