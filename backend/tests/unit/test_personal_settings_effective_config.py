"""Personal settings and effective config resolver tests."""

from unittest.mock import patch


def test_personal_settings_save_masks_secrets(client):
    response = client.put('/api/auth/personal-settings', json={
        'force_global_default': False,
        'ai_provider_format': 'openai',
        'api_key': 'personal-secret-key',
        'api_base_url': 'https://api.example.com',
        'text_model': 'gpt-5.5',
        'text_model_source': 'openai',
        'capability_overrides': {
            'outline': {'use_global_default': False},
            'image_generation': {'use_global_default': True},
        },
    })

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['ai_provider_format'] == 'openai'
    assert data['api_base_url'] == 'https://api.example.com'
    assert data['api_key_length'] == len('personal-secret-key')
    assert 'api_key' not in data
    assert data['capability_overrides']['image_generation']['use_global_default'] is True


def test_personal_settings_reset_clears_user_config(client):
    client.put('/api/auth/personal-settings', json={
        'ai_provider_format': 'openai',
        'api_key': 'personal-secret-key',
    })

    response = client.post('/api/auth/personal-settings/reset')
    assert response.status_code == 200

    response = client.get('/api/auth/personal-settings')
    assert response.status_code == 200
    assert response.get_json()['data'] == {}


def test_effective_config_marks_codex_api_required_capability_not_ready(client):
    client.put('/api/settings', json={
        'ai_provider_format': 'openai',
        'text_model': 'gpt-5.5',
        'image_model': 'gpt-image-2',
        'image_caption_model': 'gpt-5.5',
    })
    client.put('/api/auth/personal-settings', json={
        'ai_provider_format': 'codex',
        'image_model_source': 'codex',
        'image_model': 'gpt-image-2',
    })

    response = client.get('/api/settings/effective')

    assert response.status_code == 200
    data = response.get_json()['data']
    image_generation = data['capabilities']['image_generation']
    assert image_generation['api_required'] is True
    assert image_generation['ready'] is False
    assert '必须走 API' in image_generation['reason']
    assert data['personal']['ai_provider_format'] == 'codex'


def test_runtime_config_uses_personal_capability_settings(app, client):
    with app.app_context():
        from models import User, UserSettings, db
        from services.settings_resolver import resolve_capability_runtime_config

        user = User.query.filter_by(username='test-admin').first()
        user_settings = UserSettings(
            user_id=user.id,
            ai_provider_format='openai',
            text_model='gpt-personal',
            text_model_source='openai',
            text_api_key='personal-text-key',
            text_api_base_url='https://personal.example/v1',
        )
        db.session.add(user_settings)
        db.session.commit()

        runtime = resolve_capability_runtime_config('outline', user)

        assert runtime['text_model'] == 'gpt-personal'
        assert runtime['text_model_source'] == 'openai'
        assert runtime['text_api_key'] == 'personal-text-key'
        assert runtime['text_api_base_url'] == 'https://personal.example/v1'
        assert runtime['_effective_source']['credential'] == 'personal'


def test_service_test_uses_effective_config_then_unsaved_override(client):
    client.put('/api/auth/personal-settings', json={
        'ai_provider_format': 'openai',
        'text_model': 'gpt-personal',
        'text_model_source': 'openai',
        'text_api_key': 'personal-text-key',
    })

    with patch('controllers.settings_controller.task_manager.submit_task') as submit_task:
        response = client.post('/api/settings/tests/text-model', json={
            'text_model': 'gpt-unsaved',
        })

    assert response.status_code == 200
    test_settings = submit_task.call_args.args[3]
    assert test_settings['text_model'] == 'gpt-unsaved'
    assert test_settings['text_model_source'] == 'openai'
    assert test_settings['text_api_key'] == 'personal-text-key'
    assert test_settings['_effective_source']['model'] == 'request_override'
    assert test_settings['_effective_source']['credential'] == 'personal'
