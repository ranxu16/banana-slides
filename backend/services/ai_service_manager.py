"""
AIService singleton manager for optimizing provider initialization

This module provides a singleton pattern implementation for AIService to avoid
repeated initialization of AI providers (TextProvider and ImageProvider) on every request.

Benefits:
- Reuses AI provider instances across requests
- Reduces initialization overhead
- Better resource management
- Thread-safe for Flask multi-threaded environment

Usage:
    from services.ai_service_manager import get_ai_service
    
    # In your controller
    ai_service = get_ai_service()
    outline = ai_service.generate_outline(project_context)
"""

import logging
from threading import Lock
from typing import Optional
from flask import current_app, has_app_context
from .ai_service import AIService
from .ai_providers import (
    LAZYLLM_VENDORS,
    create_caption_provider,
    create_image_provider,
    create_text_provider,
    get_text_provider,
    get_image_provider,
    get_caption_provider,
    TextProvider,
    ImageProvider,
)
from .ai_runtime import AIRuntimeConfig

logger = logging.getLogger(__name__)

# Global singleton instance
_ai_service_instance: Optional[AIService] = None
_lock = Lock()

# Provider cache to avoid re-initialization when models don't change
_text_provider_cache: dict = {}
_image_provider_cache: dict = {}
_caption_provider_cache: dict = {}
_runtime_text_provider_cache: dict = {}
_runtime_caption_provider_cache: dict = {}
_runtime_image_provider_cache: dict = {}
_cache_lock = Lock()


def _get_cached_text_provider(model: str) -> TextProvider:
    """
    Get or create a cached text provider instance
    
    Args:
        model: Model name to use
        
    Returns:
        Cached or new TextProvider instance
    """
    with _cache_lock:
        if model not in _text_provider_cache:
            logger.info(f"Creating new TextProvider for model: {model}")
            _text_provider_cache[model] = get_text_provider(model=model)
        else:
            logger.debug(f"Reusing cached TextProvider for model: {model}")
        return _text_provider_cache[model]


def _get_cached_image_provider(model: str) -> ImageProvider:
    """
    Get or create a cached image provider instance
    
    Args:
        model: Model name to use
        
    Returns:
        Cached or new ImageProvider instance
    """
    with _cache_lock:
        if model not in _image_provider_cache:
            logger.info(f"Creating new ImageProvider for model: {model}")
            _image_provider_cache[model] = get_image_provider(model=model)
        else:
            logger.debug(f"Reusing cached ImageProvider for model: {model}")
        return _image_provider_cache[model]


def _get_cached_caption_provider(model: str) -> TextProvider:
    """Get or create a cached caption provider instance"""
    with _cache_lock:
        if model not in _caption_provider_cache:
            logger.info(f"Creating new CaptionProvider for model: {model}")
            _caption_provider_cache[model] = get_caption_provider(model=model)
        return _caption_provider_cache[model]


def get_runtime_text_provider(runtime: AIRuntimeConfig) -> TextProvider:
    """Return a provider isolated by model, endpoint, credential and account identity."""
    if runtime.provider in ({"lazyllm"} | LAZYLLM_VENDORS):
        raise ValueError("LazyLLM personal runtime isolation is not available yet; use the global configuration for this capability.")
    with _cache_lock:
        if runtime.cache_key not in _runtime_text_provider_cache:
            _runtime_text_provider_cache[runtime.cache_key] = create_text_provider(
                runtime.provider_config(),
                model=runtime.model,
            )
        return _runtime_text_provider_cache[runtime.cache_key]


def _reject_unisolated_lazyllm(runtime: AIRuntimeConfig) -> None:
    if runtime.provider in ({"lazyllm"} | LAZYLLM_VENDORS):
        raise ValueError(
            "LazyLLM personal runtime isolation is not available yet; "
            "use the global configuration for this capability."
        )


def get_runtime_caption_provider(runtime: AIRuntimeConfig) -> TextProvider:
    """Return a vision provider isolated by endpoint, credential and account."""
    _reject_unisolated_lazyllm(runtime)
    with _cache_lock:
        if runtime.cache_key not in _runtime_caption_provider_cache:
            _runtime_caption_provider_cache[runtime.cache_key] = create_caption_provider(
                runtime.provider_config(),
                model=runtime.model,
            )
        return _runtime_caption_provider_cache[runtime.cache_key]


def get_runtime_image_provider(runtime: AIRuntimeConfig) -> ImageProvider:
    """Return an image provider isolated by endpoint, credential and account."""
    _reject_unisolated_lazyllm(runtime)
    with _cache_lock:
        if runtime.cache_key not in _runtime_image_provider_cache:
            _runtime_image_provider_cache[runtime.cache_key] = create_image_provider(
                runtime.provider_config(),
                model=runtime.model,
                image_api_protocol=runtime.image_api_protocol,
                resolution=runtime.resolution,
            )
        return _runtime_image_provider_cache[runtime.cache_key]


def get_runtime_ai_service(runtime: AIRuntimeConfig) -> AIService:
    """Create an AIService bound to one explicit runtime without reading global provider config."""
    if runtime.capability not in {"outline", "description", "natural_edit", "pptx_generation", "export_queue"}:
        raise ValueError(f"Text runtime does not support capability: {runtime.capability}")
    service = AIService(
        text_provider=get_runtime_text_provider(runtime),
        initialize_missing_providers=False,
    )
    service.text_model = runtime.model
    return service


def get_ai_service(force_new: bool = False) -> AIService:
    """
    Get the singleton AIService instance with optimized provider caching
    
    This function creates and returns a singleton AIService instance that reuses
    AI providers (TextProvider and ImageProvider) across requests, significantly
    reducing initialization overhead.
    
    Args:
        force_new: If True, forces creation of a new instance (useful for testing)
        
    Returns:
        AIService singleton instance with cached providers
        
    Note:
        The providers are cached per model name. If TEXT_MODEL or IMAGE_MODEL
        changes in Flask config, new providers will be created automatically.
    """
    global _ai_service_instance
    
    if force_new:
        with _lock:
            logger.info("Force creating new AIService instance")
            _ai_service_instance = None
    
    if _ai_service_instance is None:
        with _lock:
            # Double-check locking pattern
            if _ai_service_instance is None:
                logger.info("Initializing AIService singleton with provider caching")
                
                # Get model names from Flask config or use defaults
                from config import get_config
                config = get_config()
                
                if has_app_context() and current_app and hasattr(current_app, "config"):
                    text_model = current_app.config.get("TEXT_MODEL", config.TEXT_MODEL)
                    image_model = current_app.config.get("IMAGE_MODEL", config.IMAGE_MODEL)
                    caption_model = current_app.config.get("IMAGE_CAPTION_MODEL", config.IMAGE_CAPTION_MODEL)
                else:
                    text_model = config.TEXT_MODEL
                    image_model = config.IMAGE_MODEL
                    caption_model = config.IMAGE_CAPTION_MODEL

                # Get cached providers
                text_provider = _get_cached_text_provider(text_model)
                image_provider = _get_cached_image_provider(image_model)
                caption_provider = _get_cached_caption_provider(caption_model)

                # Create AIService with cached providers
                _ai_service_instance = AIService(
                    text_provider=text_provider,
                    image_provider=image_provider,
                    caption_provider=caption_provider
                )

                logger.info(f"AIService singleton created with models: text={text_model}, image={image_model}, caption={caption_model}")
    
    return _ai_service_instance


def clear_ai_service_cache():
    """
    Clear the AIService singleton and provider cache
    
    This is useful when:
    - Configuration changes (API keys, endpoints, models)
    - Testing scenarios requiring fresh instances
    - Memory cleanup needed
    
    Note:
    - Uses nested locks to ensure atomic cache clearing operation
    - Prevents race conditions where new instances could be created
      with stale cached providers during the clearing process
    """
    global _ai_service_instance
    
    with _lock:
        _ai_service_instance = None
        logger.info("AIService singleton cache cleared")
        with _cache_lock:
            _text_provider_cache.clear()
            _image_provider_cache.clear()
            _caption_provider_cache.clear()
            _runtime_text_provider_cache.clear()
            _runtime_caption_provider_cache.clear()
            _runtime_image_provider_cache.clear()
            logger.info("Provider cache cleared")


def get_provider_cache_info() -> dict:
    """
    Get information about cached providers (for debugging/monitoring)
    
    Returns:
        Dictionary with cache statistics
    """
    with _cache_lock:
        return {
            "text_providers": list(_text_provider_cache.keys()),
            "image_providers": list(_image_provider_cache.keys()),
            "caption_providers": list(_caption_provider_cache.keys()),
            "runtime_text_providers": len(_runtime_text_provider_cache),
            "runtime_caption_providers": len(_runtime_caption_provider_cache),
            "runtime_image_providers": len(_runtime_image_provider_cache),
            "total_cached": (
                len(_text_provider_cache) + len(_image_provider_cache) + len(_caption_provider_cache)
                + len(_runtime_text_provider_cache) + len(_runtime_caption_provider_cache)
                + len(_runtime_image_provider_cache)
            )
        }
