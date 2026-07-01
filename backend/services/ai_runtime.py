"""Request/task scoped AI runtime configuration."""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from typing import Any


def _fingerprint(value: str | None) -> str:
    if not value:
        return "none"
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


@dataclass(frozen=True)
class AIRuntimeConfig:
    capability: str
    provider: str
    model: str
    api_key: str | None = field(default=None, repr=False)
    api_base_url: str | None = None
    account_identity: str | None = None
    source_summary: dict[str, Any] = field(default_factory=dict, compare=False, hash=False)

    @classmethod
    def from_resolved(cls, capability: str, resolved: dict[str, Any]) -> "AIRuntimeConfig":
        source_field = {
            "outline": "text_model_source",
            "description": "text_model_source",
            "natural_edit": "text_model_source",
            "image_caption": "image_caption_model_source",
            "image_generation": "image_model_source",
            "pptx_generation": "text_model_source",
            "editable_pptx_visual": "image_caption_model_source",
            "editable_pptx_element": "image_model_source",
            "export_queue": "text_model_source",
        }[capability]
        model_field = {
            "outline": "text_model",
            "description": "text_model",
            "natural_edit": "text_model",
            "image_caption": "image_caption_model",
            "image_generation": "image_model",
            "pptx_generation": "text_model",
            "editable_pptx_visual": "image_caption_model",
            "editable_pptx_element": "image_model",
            "export_queue": "text_model",
        }[capability]
        key_field = model_field.replace("_model", "_api_key")
        base_field = model_field.replace("_model", "_api_base_url")
        return cls(
            capability=capability,
            provider=str(resolved.get(source_field) or resolved.get("ai_provider_format") or "openai").lower(),
            model=str(resolved.get(model_field) or ""),
            api_key=resolved.get(key_field) or resolved.get("api_key"),
            api_base_url=resolved.get(base_field) or resolved.get("api_base_url"),
            account_identity=resolved.get("_account_identity"),
            source_summary=dict(resolved.get("_effective_source") or {}),
        )

    @property
    def credential_fingerprint(self) -> str:
        return _fingerprint(self.api_key)

    @property
    def cache_key(self) -> tuple[str, str, str, str, str, str]:
        return (
            self.capability,
            self.provider,
            self.model,
            self.api_base_url or "",
            self.credential_fingerprint,
            self.account_identity or "",
        )

    def provider_config(self) -> dict[str, Any]:
        if self.provider in {"qwen", "doubao", "deepseek", "glm", "siliconflow", "sensenova", "minimax", "kimi", "lazyllm"}:
            return {"format": "lazyllm", "source": self.provider}
        if self.provider == "codex":
            return {"format": "codex", "api_key": self.api_key}
        return {
            "format": self.provider,
            "api_key": self.api_key,
            "api_base": self.api_base_url,
        }

    def public_summary(self) -> dict[str, Any]:
        return {
            "capability": self.capability,
            "provider": self.provider,
            "model": self.model,
            "api_base_url": self.api_base_url,
            "credential_fingerprint": self.credential_fingerprint,
            "account_identity": self.account_identity,
            "source": self.source_summary,
        }


def resolve_user_ai_runtime(capability: str, user):
    """Resolve one user's capability config and return its isolated AIService."""
    from services.ai_service_manager import get_runtime_ai_service
    from services.settings_resolver import resolve_capability_runtime_config

    resolved = resolve_capability_runtime_config(capability, user)
    runtime = AIRuntimeConfig.from_resolved(capability, resolved)
    if not runtime.model:
        raise ValueError(f"No model configured for capability: {capability}")
    if runtime.provider in {"qwen", "doubao", "deepseek", "glm", "siliconflow", "sensenova", "minimax", "kimi", "lazyllm"}:
        provider_source = runtime.source_summary.get("provider")
        credential_source = runtime.source_summary.get("credential")
        if "personal" in {provider_source, credential_source}:
            raise ValueError(
                "LazyLLM personal runtime isolation is not available yet; "
                "switch this capability to the global configuration or an isolated API provider."
            )
        from services.ai_service_manager import get_ai_service
        return runtime, get_ai_service()
    return runtime, get_runtime_ai_service(runtime)
