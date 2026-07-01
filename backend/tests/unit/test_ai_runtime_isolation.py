"""Request-scoped AI runtime and provider cache isolation tests."""

from unittest.mock import MagicMock, patch

from services.ai_runtime import AIRuntimeConfig


def _runtime(api_key: str, account_identity: str | None = None) -> AIRuntimeConfig:
    return AIRuntimeConfig(
        capability="outline",
        provider="openai",
        model="gpt-shared-model",
        api_key=api_key,
        api_base_url="https://api.example/v1",
        account_identity=account_identity,
    )


def test_runtime_repr_and_public_summary_do_not_expose_api_key():
    runtime = _runtime("top-secret-key")

    assert "top-secret-key" not in repr(runtime)
    assert "top-secret-key" not in str(runtime.public_summary())
    assert runtime.public_summary()["credential_fingerprint"] != "none"


def test_same_model_with_different_credentials_does_not_reuse_provider():
    from services import ai_service_manager

    ai_service_manager.clear_ai_service_cache()
    providers = [MagicMock(name="provider-a"), MagicMock(name="provider-b")]
    with patch(
        "services.ai_service_manager.create_text_provider",
        side_effect=providers,
    ) as create_provider:
        first = ai_service_manager.get_runtime_text_provider(_runtime("user-a-key"))
        second = ai_service_manager.get_runtime_text_provider(_runtime("user-b-key"))

    assert first is providers[0]
    assert second is providers[1]
    assert create_provider.call_count == 2


def test_identical_runtime_reuses_provider_without_storing_plaintext_cache_key():
    from services import ai_service_manager

    ai_service_manager.clear_ai_service_cache()
    provider = MagicMock(name="shared-provider")
    runtime = _runtime("same-user-key", account_identity="user@example.com")
    with patch(
        "services.ai_service_manager.create_text_provider",
        return_value=provider,
    ) as create_provider:
        first = ai_service_manager.get_runtime_text_provider(runtime)
        second = ai_service_manager.get_runtime_text_provider(runtime)

    assert first is second is provider
    create_provider.assert_called_once()
    assert "same-user-key" not in str(runtime.cache_key)


def test_lazyllm_personal_runtime_is_rejected_until_key_isolation_exists():
    from services import ai_service_manager

    runtime = AIRuntimeConfig(
        capability="outline",
        provider="deepseek",
        model="deepseek-chat",
        api_key="personal-lazy-key",
    )

    try:
        ai_service_manager.get_runtime_text_provider(runtime)
    except ValueError as exc:
        assert "runtime isolation" in str(exc)
    else:
        raise AssertionError("LazyLLM runtime must not silently use a global credential")


def test_global_lazyllm_runtime_keeps_legacy_global_service():
    from services.ai_runtime import resolve_user_ai_runtime

    resolved = {
        'text_model_source': 'deepseek',
        'text_model': 'deepseek-chat',
        '_effective_source': {
            'provider': 'global',
            'credential': 'global',
        },
    }
    legacy_service = MagicMock(name='legacy-global-service')
    with patch(
        'services.settings_resolver.resolve_capability_runtime_config',
        return_value=resolved,
    ), patch(
        'services.ai_service_manager.get_ai_service',
        return_value=legacy_service,
    ):
        runtime, service = resolve_user_ai_runtime('outline', object())

    assert runtime.provider == 'deepseek'
    assert service is legacy_service


def test_caption_runtime_cache_isolated_by_credentials():
    from services import ai_service_manager

    ai_service_manager.clear_ai_service_cache()
    first_runtime = AIRuntimeConfig(
        capability='image_caption', provider='openai', model='gpt-5.5',
        api_key='caption-user-a', api_base_url='https://api.example/v1',
    )
    second_runtime = AIRuntimeConfig(
        capability='image_caption', provider='openai', model='gpt-5.5',
        api_key='caption-user-b', api_base_url='https://api.example/v1',
    )
    providers = [MagicMock(name='caption-a'), MagicMock(name='caption-b')]
    with patch(
        'services.ai_service_manager.create_caption_provider',
        side_effect=providers,
    ) as create_provider:
        first = ai_service_manager.get_runtime_caption_provider(first_runtime)
        second = ai_service_manager.get_runtime_caption_provider(second_runtime)

    assert first is providers[0]
    assert second is providers[1]
    assert create_provider.call_count == 2


def test_image_runtime_cache_includes_protocol_and_resolution():
    from services import ai_service_manager

    ai_service_manager.clear_ai_service_cache()
    base = dict(
        capability='image_generation', provider='openai', model='gpt-image-2',
        api_key='image-user-key', api_base_url='https://api.example/v1',
    )
    first_runtime = AIRuntimeConfig(**base, image_api_protocol='images', resolution='1K')
    second_runtime = AIRuntimeConfig(**base, image_api_protocol='chat', resolution='2K')
    providers = [MagicMock(name='image-a'), MagicMock(name='image-b')]
    with patch(
        'services.ai_service_manager.create_image_provider',
        side_effect=providers,
    ) as create_provider:
        first = ai_service_manager.get_runtime_image_provider(first_runtime)
        second = ai_service_manager.get_runtime_image_provider(second_runtime)

    assert first is providers[0]
    assert second is providers[1]
    assert create_provider.call_count == 2
    assert create_provider.call_args_list[0].kwargs['image_api_protocol'] == 'images'
    assert create_provider.call_args_list[1].kwargs['resolution'] == '2K'


def test_composite_image_service_uses_independent_text_and_image_runtimes():
    from services.ai_runtime import resolve_user_image_ai_runtime

    resolved = {
        'description': {
            'text_model_source': 'openai',
            'text_model': 'gpt-text',
            'text_api_key': 'text-key',
            '_effective_source': {'provider': 'personal', 'credential': 'personal'},
        },
        'image_generation': {
            'image_model_source': 'openai',
            'image_model': 'gpt-image-2',
            'image_api_key': 'image-key',
            'openai_image_api_protocol': 'images',
            'image_resolution': '1K',
            '_effective_source': {'provider': 'personal', 'credential': 'personal'},
        },
    }
    text_provider = MagicMock(name='runtime-text-provider')
    image_provider = MagicMock(name='runtime-image-provider')

    def fake_resolve(capability, user):
        return resolved[capability]

    with patch(
        'services.settings_resolver.resolve_capability_runtime_config',
        side_effect=fake_resolve,
    ), patch(
        'services.ai_service_manager.get_runtime_text_provider',
        return_value=text_provider,
    ), patch(
        'services.ai_service_manager.get_runtime_image_provider',
        return_value=image_provider,
    ):
        runtimes, service = resolve_user_image_ai_runtime(object())

    assert service.text_provider is text_provider
    assert service.image_provider is image_provider
    assert runtimes['prompt'].credential_fingerprint != runtimes['image'].credential_fingerprint
    assert runtimes['image'].image_api_protocol == 'images'


def test_composite_image_service_rejects_codex_subscription_image_provider():
    from services.ai_runtime import resolve_user_image_ai_runtime

    def fake_resolve(capability, user):
        if capability == 'description':
            return {'text_model_source': 'openai', 'text_model': 'gpt-text', 'text_api_key': 'key'}
        return {'image_model_source': 'codex', 'image_model': 'gpt-image-2', '_account_identity': 'user@example.com'}

    with patch(
        'services.settings_resolver.resolve_capability_runtime_config',
        side_effect=fake_resolve,
    ):
        try:
            resolve_user_image_ai_runtime(object())
        except ValueError as exc:
            assert 'requires an API key' in str(exc)
        else:
            raise AssertionError('Codex subscription must not run image generation')
