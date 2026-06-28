"""
Settings controller tests for provider format handling.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
import requests
from flask import Flask

import app as app_module
from config import Config
from controllers import settings_controller
from controllers.settings_controller import update_settings, verify_api_key


def _build_settings(**overrides):
    defaults = {
        'ai_provider_format': 'gemini',
        'api_key': None,
        'api_base_url': None,
        'text_model': None,
        'image_model': None,
        'image_caption_model': None,
        'image_resolution': None,
        'image_aspect_ratio': None,
        'max_description_workers': None,
        'max_image_workers': None,
        'mineru_api_base': None,
        'mineru_token': None,
        'output_language': None,
        'enable_text_reasoning': False,
        'text_thinking_budget': None,
        'enable_image_reasoning': False,
        'image_thinking_budget': None,
        'baidu_api_key': None,
        'text_model_source': None,
        'image_model_source': None,
        'image_caption_model_source': None,
        'lazyllm_api_keys': None,
    }
    defaults.update(overrides)

    settings = SimpleNamespace(**defaults)
    settings.to_dict = lambda: {
        'ai_provider_format': settings.ai_provider_format,
        'api_key_length': len(settings.api_key) if settings.api_key else 0,
    }
    return settings


def test_load_settings_prefers_env_api_key_over_database(monkeypatch):
    """Environment API credentials should take precedence over stale database values."""
    monkeypatch.setenv('GOOGLE_API_KEY', 'env-google-key')
    monkeypatch.setenv('OPENAI_API_KEY', 'env-openai-key')
    monkeypatch.setenv('GOOGLE_API_BASE', 'https://env.google.example')
    monkeypatch.setenv('OPENAI_API_BASE', 'https://env.openai.example')

    settings = _build_settings(
        api_key='db-placeholder-key',
        api_base_url='https://db.example',
    )

    app = Flask(__name__)
    app.config.from_object(Config)

    with patch('models.Settings.get_settings', return_value=settings):
        with patch('services.task_manager.sync_resource_limits'):
            app_module._load_settings_to_config(app)

    assert app.config['GOOGLE_API_KEY'] == 'env-google-key'
    assert app.config['OPENAI_API_KEY'] == 'env-openai-key'
    assert app.config['GOOGLE_API_BASE'] == 'https://env.google.example'
    assert app.config['OPENAI_API_BASE'] == 'https://env.openai.example'


def test_update_settings_accepts_lazyllm_provider():
    """`lazyllm` should be accepted as a valid provider format."""
    app = Flask(__name__)

    settings = _build_settings()
    with app.app_context():
        with app.test_request_context('/api/settings/', method='PUT', json={'ai_provider_format': 'lazyllm'}):
            with patch('controllers.settings_controller.Settings.get_settings', return_value=settings):
                with patch('controllers.settings_controller.db.session.commit'):
                    with patch('controllers.settings_controller._sync_settings_to_config'):
                        response, status_code = update_settings()

    assert status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['ai_provider_format'] == 'lazyllm'


def test_verify_uses_configured_text_model():
    """Verify endpoint should use configured text model, not a hardcoded gemini model."""
    app = Flask(__name__)
    app.config.update(
        TEXT_MODEL='gemini-3-flash-preview',
        AI_PROVIDER_FORMAT='lazyllm',
    )

    settings = _build_settings(ai_provider_format='lazyllm', text_model='deepseek-chat')
    mock_provider = MagicMock()
    mock_provider.generate_text.return_value = 'OK'

    with app.app_context():
        with app.test_request_context('/api/settings/verify', method='POST'):
            with patch('controllers.settings_controller.Settings.get_settings', return_value=settings):
                with patch('services.ai_providers.get_text_provider', return_value=mock_provider) as mock_get_provider:
                    response, status_code = verify_api_key()

    assert status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['available'] is True
    mock_get_provider.assert_called_once_with(model='deepseek-chat')
    mock_provider.generate_text.assert_called_once()


def test_codex_401_settings_test_disconnects_oauth_and_reports_state(client, app):
    """A Codex 401 during settings tests should clear stale OAuth state."""
    with app.app_context():
        from models import Settings, Task, db

        settings = Settings.get_settings()
        settings.openai_oauth_access_token = 'expired-access-token'
        settings.openai_oauth_refresh_token = 'expired-refresh-token'
        settings.openai_oauth_account_id = 'user@example.com'
        task = Task(
            project_id='settings-test',
            task_type='TEST_TEXT_MODEL',
            status='PENDING',
        )
        db.session.add(task)
        db.session.commit()
        task_id = task.id

        response = requests.Response()
        response.status_code = 401
        response.url = 'https://chatgpt.com/backend-api/codex/responses'
        error = requests.exceptions.HTTPError(
            '401 Client Error: Unauthorized for url: https://chatgpt.com/backend-api/codex/responses',
            response=response,
        )

        def fail_with_codex_401():
            raise error

        with patch.dict(settings_controller.TEST_FUNCTIONS, {'text-model': fail_with_codex_401}):
            settings_controller._run_test_async(
                task_id,
                'text-model',
                {'text_model_source': 'codex'},
                app,
            )

        db.session.expire_all()
        settings = Settings.get_settings()
        assert settings.openai_oauth_access_token is None
        assert settings.openai_oauth_refresh_token is None
        assert settings.openai_oauth_account_id is None

    status_response = client.get(f'/api/settings/tests/{task_id}/status')
    assert status_response.status_code == 200
    data = status_response.get_json()
    assert data['success'] is True
    assert data['data']['status'] == 'FAILED'
    assert data['data']['openai_oauth_disconnected'] is True
    assert '重新登录 OpenAI' in data['data']['error']


@pytest.mark.parametrize(
    ('test_name', 'source_key', 'task_type'),
    [
        ('text-model', 'text_model_source', 'TEST_TEXT_MODEL'),
        ('image-model', 'image_model_source', 'TEST_IMAGE_MODEL'),
        ('caption-model', 'image_caption_model_source', 'TEST_CAPTION_MODEL'),
    ],
)
def test_codex_oauth_not_connected_settings_test_disconnects_oauth_and_reports_state(
    client,
    app,
    test_name,
    source_key,
    task_type,
):
    """A Codex settings test should sync OAuth state when no token can be loaded."""
    with app.app_context():
        from models import Settings, Task, db

        settings = Settings.get_settings()
        settings.openai_oauth_access_token = 'stale-access-token'
        settings.openai_oauth_refresh_token = 'stale-refresh-token'
        settings.openai_oauth_account_id = 'user@example.com'
        task = Task(
            project_id='settings-test',
            task_type=task_type,
            status='PENDING',
        )
        db.session.add(task)
        db.session.commit()
        task_id = task.id

        def fail_with_missing_codex_oauth():
            raise ValueError(
                'OpenAI OAuth is not connected. Please log in with your OpenAI account in Settings.'
            )

        with patch.dict(settings_controller.TEST_FUNCTIONS, {test_name: fail_with_missing_codex_oauth}):
            settings_controller._run_test_async(
                task_id,
                test_name,
                {source_key: 'codex'},
                app,
            )

        db.session.expire_all()
        settings = Settings.get_settings()
        assert settings.openai_oauth_access_token is None
        assert settings.openai_oauth_refresh_token is None
        assert settings.openai_oauth_account_id is None

    status_response = client.get(f'/api/settings/tests/{task_id}/status')
    assert status_response.status_code == 200
    data = status_response.get_json()
    assert data['success'] is True
    assert data['data']['status'] == 'FAILED'
    assert data['data']['openai_oauth_disconnected'] is True
    assert '重新登录 OpenAI' in data['data']['error']


def test_non_codex_oauth_not_connected_error_does_not_disconnect_codex_oauth(client, app):
    """The local OAuth-not-connected text should only clear OAuth for Codex tests."""
    with app.app_context():
        from models import Settings, Task, db

        settings = Settings.get_settings()
        settings.openai_oauth_access_token = 'still-valid-access-token'
        settings.openai_oauth_refresh_token = 'still-valid-refresh-token'
        settings.openai_oauth_account_id = 'user@example.com'
        task = Task(
            project_id='settings-test',
            task_type='TEST_TEXT_MODEL',
            status='PENDING',
        )
        db.session.add(task)
        db.session.commit()
        task_id = task.id

        def fail_with_missing_oauth_text():
            raise ValueError(
                'OpenAI OAuth is not connected. Please log in with your OpenAI account in Settings.'
            )

        with patch.dict(settings_controller.TEST_FUNCTIONS, {'text-model': fail_with_missing_oauth_text}):
            settings_controller._run_test_async(
                task_id,
                'text-model',
                {'text_model_source': 'gemini'},
                app,
            )

        db.session.expire_all()
        settings = Settings.get_settings()
        assert settings.openai_oauth_access_token == 'still-valid-access-token'
        assert settings.openai_oauth_refresh_token == 'still-valid-refresh-token'
        assert settings.openai_oauth_account_id == 'user@example.com'

    status_response = client.get(f'/api/settings/tests/{task_id}/status')
    assert status_response.status_code == 200
    data = status_response.get_json()
    assert data['success'] is True
    assert data['data']['status'] == 'FAILED'
    assert 'openai_oauth_disconnected' not in data['data']


def test_unrelated_401_settings_test_does_not_disconnect_codex_oauth(client, app):
    """A non-Codex service test should not clear OAuth just because Codex is configured globally."""
    with app.app_context():
        from models import Settings, Task, db

        settings = Settings.get_settings()
        settings.openai_oauth_access_token = 'still-valid-access-token'
        settings.openai_oauth_refresh_token = 'still-valid-refresh-token'
        settings.openai_oauth_account_id = 'user@example.com'
        task = Task(
            project_id='settings-test',
            task_type='TEST_BAIDU_OCR',
            status='PENDING',
        )
        db.session.add(task)
        db.session.commit()
        task_id = task.id

        response = requests.Response()
        response.status_code = 401
        error = requests.exceptions.HTTPError(
            '401 Client Error: Unauthorized for url: https://example.com/ocr',
            response=response,
        )

        def fail_with_unrelated_401():
            raise error

        with patch.dict(settings_controller.TEST_FUNCTIONS, {'baidu-ocr': fail_with_unrelated_401}):
            settings_controller._run_test_async(
                task_id,
                'baidu-ocr',
                {'ai_provider_format': 'codex'},
                app,
            )

        db.session.expire_all()
        settings = Settings.get_settings()
        assert settings.openai_oauth_access_token == 'still-valid-access-token'
        assert settings.openai_oauth_refresh_token == 'still-valid-refresh-token'
        assert settings.openai_oauth_account_id == 'user@example.com'

    status_response = client.get(f'/api/settings/tests/{task_id}/status')
    assert status_response.status_code == 200
    data = status_response.get_json()
    assert data['success'] is True
    assert data['data']['status'] == 'FAILED'
    assert 'openai_oauth_disconnected' not in data['data']


def test_codex_test_error_text_with_4010_does_not_disconnect_oauth(client, app):
    """A non-401 number in error text should not be treated as an OAuth 401."""
    with app.app_context():
        from models import Settings, Task, db

        settings = Settings.get_settings()
        settings.openai_oauth_access_token = 'still-valid-access-token'
        settings.openai_oauth_refresh_token = 'still-valid-refresh-token'
        settings.openai_oauth_account_id = 'user@example.com'
        task = Task(
            project_id='settings-test',
            task_type='TEST_TEXT_MODEL',
            status='PENDING',
        )
        db.session.add(task)
        db.session.commit()
        task_id = task.id

        def fail_with_port_number():
            raise ValueError('Connection failed to http://localhost:4010/codex-proxy')

        with patch.dict(settings_controller.TEST_FUNCTIONS, {'text-model': fail_with_port_number}):
            settings_controller._run_test_async(
                task_id,
                'text-model',
                {'text_model_source': 'codex'},
                app,
            )

        db.session.expire_all()
        settings = Settings.get_settings()
        assert settings.openai_oauth_access_token == 'still-valid-access-token'
        assert settings.openai_oauth_refresh_token == 'still-valid-refresh-token'
        assert settings.openai_oauth_account_id == 'user@example.com'

    status_response = client.get(f'/api/settings/tests/{task_id}/status')
    data = status_response.get_json()
    assert data['data']['status'] == 'FAILED'
    assert 'openai_oauth_disconnected' not in data['data']
