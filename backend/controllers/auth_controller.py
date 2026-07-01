"""Auth Controller — 注册 / 登录 / 个人信息 / 修改密码 / 个人 API 设置"""
import json
import logging
from flask import Blueprint, request, g
from models import db, User, UserSettings
from utils import success_response, error_response, bad_request
from utils.auth import require_auth, generate_token
from services.ai_providers import LAZYLLM_VENDORS

logger = logging.getLogger(__name__)
ALLOWED_PROVIDER_FORMATS = {"openai", "gemini", "lazyllm", "codex"} | LAZYLLM_VENDORS
ALLOWED_OPENAI_IMAGE_PROTOCOLS = {"auto", "images", "chat"}
ALLOWED_CAPABILITIES = {
    "outline",
    "description",
    "natural_edit",
    "image_caption",
    "image_generation",
    "pptx_generation",
    "editable_pptx_visual",
    "editable_pptx_element",
    "export_queue",
}

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    """POST /api/auth/register — 注册新用户（开放注册模式）"""
    try:
        data = request.get_json() or {}
        username = (data.get('username') or '').strip()
        password = (data.get('password') or '').strip()
        email = (data.get('email') or '').strip() or None

        if not username or len(username) < 2:
            return bad_request('用户名至少 2 个字符')
        if len(username) > 50:
            return bad_request('用户名不能超过 50 个字符')
        if not password or len(password) < 6:
            return bad_request('密码至少 6 位')

        if User.query.filter_by(username=username).first():
            return bad_request('用户名已存在')
        if email and User.query.filter_by(email=email).first():
            return bad_request('邮箱已被注册')

        user = User(username=username, email=email)
        user.set_password(password)
        # 第一个注册的用户自动成为管理员
        if User.query.count() == 0:
            user.is_admin = True

        db.session.add(user)
        db.session.commit()

        token = generate_token(user.id)
        return success_response({'token': token, 'user': user.to_dict()}, status_code=201)

    except Exception as e:
        db.session.rollback()
        logger.error(f'register error: {e}', exc_info=True)
        return error_response('SERVER_ERROR', str(e), 500)


@auth_bp.route('/login', methods=['POST'])
def login():
    """POST /api/auth/login — 登录"""
    try:
        data = request.get_json() or {}
        username = (data.get('username') or '').strip()
        password = (data.get('password') or '').strip()

        if not username or not password:
            return bad_request('用户名和密码不能为空')

        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            return error_response('INVALID_CREDENTIALS', '用户名或密码错误', 401)
        if not user.is_active:
            return error_response('ACCOUNT_DISABLED', '账号已被禁用，请联系管理员', 403)

        token = generate_token(user.id)
        return success_response({'token': token, 'user': user.to_dict()})

    except Exception as e:
        logger.error(f'login error: {e}', exc_info=True)
        return error_response('SERVER_ERROR', str(e), 500)


@auth_bp.route('/me', methods=['GET'])
@require_auth
def me():
    """GET /api/auth/me — 获取当前用户信息"""
    user = g.current_user
    user_dict = user.to_dict()
    # 附带个人 API 设置
    if user.settings:
        user_dict['personal_settings'] = user.settings.to_dict()
    else:
        user_dict['personal_settings'] = None
    return success_response(user_dict)


@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    """POST /api/auth/change-password — 修改密码"""
    try:
        data = request.get_json() or {}
        old_password = (data.get('old_password') or '').strip()
        new_password = (data.get('new_password') or '').strip()

        if not old_password or not new_password:
            return bad_request('旧密码和新密码不能为空')
        if len(new_password) < 6:
            return bad_request('新密码至少 6 位')

        user = g.current_user
        if not user.check_password(old_password):
            return error_response('INVALID_CREDENTIALS', '旧密码错误', 401)

        user.set_password(new_password)
        db.session.commit()
        return success_response({'message': '密码已修改'})

    except Exception as e:
        db.session.rollback()
        logger.error(f'change_password error: {e}', exc_info=True)
        return error_response('SERVER_ERROR', str(e), 500)


@auth_bp.route('/personal-settings', methods=['GET'])
@require_auth
def get_personal_settings():
    """GET /api/auth/personal-settings — 获取个人 API 配置"""
    user = g.current_user
    if not user.settings:
        return success_response({})
    return success_response(user.settings.to_dict())


@auth_bp.route('/personal-settings', methods=['PUT'])
@require_auth
def update_personal_settings():
    """PUT /api/auth/personal-settings — 更新个人 API 配置"""
    try:
        user = g.current_user
        data = request.get_json() or {}

        settings = user.settings
        if not settings:
            settings = UserSettings(user_id=user.id)
            db.session.add(settings)

        if 'force_global_default' in data:
            settings.force_global_default = bool(data['force_global_default'])

        if 'ai_provider_format' in data:
            provider = (data.get('ai_provider_format') or '').strip().lower()
            if provider and provider not in ALLOWED_PROVIDER_FORMATS:
                return bad_request(f"ai_provider_format must be one of {', '.join(sorted(ALLOWED_PROVIDER_FORMATS))}")
            settings.ai_provider_format = provider or None

        text_fields = [
            'api_key',
            'api_base_url',
            'text_model',
            'image_model',
            'image_caption_model',
            'text_model_source',
            'image_model_source',
            'image_caption_model_source',
            'text_api_key',
            'text_api_base_url',
            'image_api_key',
            'image_api_base_url',
            'image_caption_api_key',
            'image_caption_api_base_url',
        ]
        for key in text_fields:
            if key in data:
                # 空字符串视为清除（存 None）
                val = (data[key] or '').strip() or None
                setattr(settings, key, val)

        if 'openai_image_api_protocol' in data:
            protocol = (data.get('openai_image_api_protocol') or 'auto').strip()
            if protocol not in ALLOWED_OPENAI_IMAGE_PROTOCOLS:
                return bad_request("openai_image_api_protocol must be 'auto', 'images', or 'chat'")
            settings.openai_image_api_protocol = protocol if protocol != 'auto' else None

        if 'lazyllm_api_keys' in data:
            keys_data = data['lazyllm_api_keys']
            if keys_data is None:
                settings.lazyllm_api_keys = None
            elif isinstance(keys_data, dict):
                existing = settings.get_lazyllm_api_keys_dict()
                for vendor, key in keys_data.items():
                    vendor_name = (vendor or '').strip().lower()
                    if vendor_name not in LAZYLLM_VENDORS:
                        return bad_request(f"Unsupported LazyLLM vendor: {vendor}")
                    if key:
                        existing[vendor_name] = str(key).strip()
                    elif vendor_name in existing:
                        existing.pop(vendor_name)
                settings.lazyllm_api_keys = json.dumps(existing, ensure_ascii=False) if existing else None
            else:
                return bad_request('lazyllm_api_keys must be an object or null')

        if 'capability_overrides' in data:
            overrides = data['capability_overrides'] or {}
            if not isinstance(overrides, dict):
                return bad_request('capability_overrides must be an object')
            normalized = {}
            for capability, config in overrides.items():
                if capability not in ALLOWED_CAPABILITIES:
                    return bad_request(f'Unsupported capability override: {capability}')
                if not isinstance(config, dict):
                    return bad_request(f'capability_overrides.{capability} must be an object')
                normalized[capability] = {
                    'use_global_default': bool(config.get('use_global_default', False)),
                }
            settings.capability_overrides = json.dumps(normalized, ensure_ascii=False) if normalized else None

        db.session.commit()
        return success_response(settings.to_dict())

    except Exception as e:
        db.session.rollback()
        logger.error(f'update_personal_settings error: {e}', exc_info=True)
        return error_response('SERVER_ERROR', str(e), 500)


@auth_bp.route('/personal-settings/reset', methods=['POST'])
@require_auth
def reset_personal_settings():
    """POST /api/auth/personal-settings/reset — 清空个人 API 配置，回退全局默认"""
    try:
        user = g.current_user
        if user.settings:
            db.session.delete(user.settings)
            db.session.commit()
        return success_response({})
    except Exception as e:
        db.session.rollback()
        logger.error(f'reset_personal_settings error: {e}', exc_info=True)
        return error_response('SERVER_ERROR', str(e), 500)
