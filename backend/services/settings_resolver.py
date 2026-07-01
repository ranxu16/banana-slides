"""Resolve global, personal and capability-level AI settings."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from models import Settings, UserSettings
from services.ai_providers import LAZYLLM_VENDORS


TEXT_CAPABILITIES = {"outline", "description", "natural_edit"}
API_REQUIRED_CAPABILITIES = {
    "image_generation",
    "pptx_generation",
    "editable_pptx_visual",
    "editable_pptx_element",
    "export_queue",
}

CAPABILITY_LABELS = {
    "outline": "大纲生成",
    "description": "页面描述",
    "natural_edit": "自然语言修改",
    "image_caption": "图片识别/视觉理解",
    "image_generation": "图片生成",
    "pptx_generation": "PPTX 生成",
    "editable_pptx_visual": "可编辑 PPTX 视觉拆层",
    "editable_pptx_element": "gpt-image-2 独立元素生成",
    "export_queue": "导出任务队列",
}


@dataclass
class CapabilityRoute:
    model_field: str
    source_field: str
    key_field: str
    base_field: str


CAPABILITY_ROUTES = {
    "outline": CapabilityRoute("text_model", "text_model_source", "text_api_key", "text_api_base_url"),
    "description": CapabilityRoute("text_model", "text_model_source", "text_api_key", "text_api_base_url"),
    "natural_edit": CapabilityRoute("text_model", "text_model_source", "text_api_key", "text_api_base_url"),
    "image_caption": CapabilityRoute("image_caption_model", "image_caption_model_source", "image_caption_api_key", "image_caption_api_base_url"),
    "image_generation": CapabilityRoute("image_model", "image_model_source", "image_api_key", "image_api_base_url"),
    "pptx_generation": CapabilityRoute("text_model", "text_model_source", "text_api_key", "text_api_base_url"),
    "editable_pptx_visual": CapabilityRoute("image_caption_model", "image_caption_model_source", "image_caption_api_key", "image_caption_api_base_url"),
    "editable_pptx_element": CapabilityRoute("image_model", "image_model_source", "image_api_key", "image_api_base_url"),
    "export_queue": CapabilityRoute("text_model", "text_model_source", "text_api_key", "text_api_base_url"),
}


def _has_value(value: Any) -> bool:
    return value is not None and str(value).strip() != ""


def _value_from_layers(
    field: str,
    global_settings: Settings,
    global_dict: dict[str, Any],
    personal_settings: UserSettings | None,
    use_personal: bool,
) -> dict[str, Any]:
    personal_value = getattr(personal_settings, field, None) if personal_settings else None
    global_raw = getattr(global_settings, field, None) if hasattr(global_settings, field) else None
    global_value = global_dict.get(field, global_raw)
    if use_personal and _has_value(personal_value):
        return {"value": personal_value, "source": "personal"}
    if _has_value(global_raw):
        return {"value": global_value, "source": "global"}
    return {"value": global_value, "source": "system_default"}


def _secret_from_layers(
    field: str,
    length_field: str,
    global_settings: Settings,
    global_dict: dict[str, Any],
    personal_settings: UserSettings | None,
    use_personal: bool,
) -> dict[str, Any]:
    personal_value = getattr(personal_settings, field, None) if personal_settings else None
    global_raw = getattr(global_settings, field, None) if hasattr(global_settings, field) else None
    if use_personal and _has_value(personal_value):
        return {"length": len(personal_value), "source": "personal", "configured": True}
    if _has_value(global_raw):
        return {"length": len(global_raw), "source": "global", "configured": True}
    length = int(global_dict.get(length_field) or 0)
    return {"length": length, "source": "system_default", "configured": length > 0}


def _lazyllm_key_length(
    provider: str,
    global_settings: Settings,
    personal_settings: UserSettings | None,
    use_personal: bool,
) -> dict[str, Any]:
    provider = (provider or "").lower()
    if not provider:
        return {"length": 0, "source": "none", "configured": False}
    if use_personal and personal_settings:
        personal_keys = personal_settings.get_lazyllm_api_keys_dict()
        if personal_keys.get(provider):
            return {"length": len(personal_keys[provider]), "source": "personal", "configured": True}
    global_keys = global_settings.get_lazyllm_api_keys_dict()
    if global_keys.get(provider):
        return {"length": len(global_keys[provider]), "source": "global", "configured": True}
    return {"length": 0, "source": "none", "configured": False}


def _capability_use_personal(
    capability: str,
    personal_settings: UserSettings | None,
) -> tuple[bool, bool]:
    if not personal_settings:
        return False, True
    if personal_settings.force_global_default:
        return False, True
    override = personal_settings.get_capability_overrides_dict().get(capability, {})
    use_global_default = bool(override.get("use_global_default", False))
    return not use_global_default, use_global_default


def _runtime_value(
    field: str,
    global_settings: Settings,
    personal_settings: UserSettings | None,
    use_personal: bool,
):
    if use_personal and personal_settings:
        personal_value = getattr(personal_settings, field, None)
        if _has_value(personal_value):
            return personal_value, "personal"

    global_value = getattr(global_settings, field, None)
    if _has_value(global_value):
        return global_value, "global"

    default_value = Settings._get_config_defaults().get(field)
    return default_value, "system_default"


def resolve_capability_runtime_config(capability: str, user=None) -> dict[str, Any]:
    """Return the secret-bearing effective config for an internal capability call."""
    route = CAPABILITY_ROUTES.get(capability)
    if not route:
        raise ValueError(f"Unknown capability: {capability}")

    global_settings = Settings.get_settings()
    global_dict = global_settings.to_dict()
    personal_settings = getattr(user, "settings", None) if user else None
    use_personal, use_global_default = _capability_use_personal(capability, personal_settings)

    provider, provider_source = _runtime_value(
        route.source_field, global_settings, personal_settings, use_personal
    )
    if not _has_value(provider):
        provider, provider_source = _runtime_value(
            "ai_provider_format", global_settings, personal_settings, use_personal
        )

    model, model_source = _runtime_value(
        route.model_field, global_settings, personal_settings, use_personal
    )
    api_key, credential_source = _runtime_value(
        route.key_field, global_settings, personal_settings, use_personal
    )
    if not _has_value(api_key):
        api_key, credential_source = _runtime_value(
            "api_key", global_settings, personal_settings, use_personal
        )
    api_base_url, base_source = _runtime_value(
        route.base_field, global_settings, personal_settings, use_personal
    )
    if not _has_value(api_base_url):
        api_base_url, base_source = _runtime_value(
            "api_base_url", global_settings, personal_settings, use_personal
        )

    provider_name = str(provider or "").lower()
    account_identity = None
    if provider_name == "codex":
        api_key = global_settings.get_openai_oauth_token()
        credential_source = "account"
        account_identity = global_settings.openai_oauth_account_id
    lazyllm_api_keys = {}
    if provider_name in LAZYLLM_VENDORS:
        if use_personal and personal_settings:
            lazyllm_api_keys = personal_settings.get_lazyllm_api_keys_dict()
        if not lazyllm_api_keys.get(provider_name):
            lazyllm_api_keys = global_settings.get_lazyllm_api_keys_dict()

    runtime = {
        "ai_provider_format": provider,
        route.source_field: provider,
        route.model_field: model,
        route.key_field: api_key,
        route.base_field: api_base_url,
        "_effective_source": {
            "capability": capability,
            "use_global_default": use_global_default,
            "provider": provider_source,
            "model": model_source,
            "credential": credential_source,
            "api_base_url": base_source,
        },
        "_account_identity": account_identity,
    }
    if lazyllm_api_keys:
        runtime["lazyllm_api_keys"] = lazyllm_api_keys
    if capability in {"image_generation", "editable_pptx_element"}:
        protocol, _ = _runtime_value(
            "openai_image_api_protocol", global_settings, personal_settings, use_personal
        )
        runtime["openai_image_api_protocol"] = protocol or "auto"
        runtime["image_resolution"] = global_dict.get("image_resolution") or "2K"
    return {key: value for key, value in runtime.items() if value is not None}


def resolve_effective_settings(user=None) -> dict[str, Any]:
    global_settings = Settings.get_settings()
    global_dict = global_settings.to_dict()
    personal_settings = getattr(user, "settings", None) if user else None

    capabilities = {}
    for capability, route in CAPABILITY_ROUTES.items():
        use_personal, use_global_default = _capability_use_personal(capability, personal_settings)
        provider_info = _value_from_layers(
            route.source_field,
            global_settings,
            global_dict,
            personal_settings,
            use_personal,
        )
        if not _has_value(provider_info["value"]):
            provider_info = _value_from_layers(
                "ai_provider_format",
                global_settings,
                global_dict,
                personal_settings,
                use_personal,
            )
        provider = (provider_info["value"] or "").lower()
        model_info = _value_from_layers(
            route.model_field,
            global_settings,
            global_dict,
            personal_settings,
            use_personal,
        )
        base_info = _value_from_layers(
            route.base_field,
            global_settings,
            global_dict,
            personal_settings,
            use_personal,
        )

        if provider in LAZYLLM_VENDORS:
            credential = _lazyllm_key_length(provider, global_settings, personal_settings, use_personal)
        elif provider not in {"codex"}:
            credential = _secret_from_layers(
                route.key_field,
                f"{route.key_field}_length",
                global_settings,
                global_dict,
                personal_settings,
                use_personal,
            )
            if not credential["configured"]:
                credential = _secret_from_layers("api_key", "api_key_length", global_settings, global_dict, personal_settings, use_personal)
        else:
            credential = {"length": 0, "source": "account", "configured": bool(global_dict.get("openai_oauth_connected"))}

        subscription_supported = capability in TEXT_CAPABILITIES and provider in {"codex", "openai"}
        api_required = capability in API_REQUIRED_CAPABILITIES
        if api_required:
            execution_mode = "api"
        elif subscription_supported and credential["source"] == "account":
            execution_mode = "account_subscription"
        elif credential["configured"]:
            execution_mode = "api"
        else:
            execution_mode = "unconfigured"

        ready = True
        reason = ""
        if api_required and provider == "codex":
            ready = False
            reason = "该能力必须走 API/企业代理，不能仅使用 Codex/ChatGPT 订阅登录态。"
        elif api_required and not credential["configured"]:
            ready = False
            reason = "该能力必须配置 API Key 或企业后端代理。"
        elif not api_required and provider == "codex" and not global_dict.get("openai_oauth_connected"):
            ready = False
            reason = "Codex/ChatGPT 账号未连接。"
        elif not _has_value(model_info["value"]):
            ready = False
            reason = "未配置模型。"
        elif execution_mode == "unconfigured":
            ready = False
            reason = "未找到可用的 API Key 或账号连接。"

        capabilities[capability] = {
            "key": capability,
            "label": CAPABILITY_LABELS[capability],
            "model": model_info,
            "provider": provider_info,
            "api_base_url": base_info,
            "credential": credential,
            "use_global_default": use_global_default,
            "execution_mode": execution_mode,
            "subscription_supported": subscription_supported,
            "api_required": api_required,
            "ready": ready,
            "reason": reason,
        }

    return {
        "source_order": ["system_default", "global", "personal", "project_override", "effective"],
        "global": global_dict,
        "personal": personal_settings.to_dict() if personal_settings else None,
        "account_status": {
            "openai_oauth_connected": bool(global_dict.get("openai_oauth_connected")),
            "openai_oauth_account_id": global_dict.get("openai_oauth_account_id"),
            "codex_available": bool(global_dict.get("openai_oauth_connected")),
        },
        "capabilities": capabilities,
    }
