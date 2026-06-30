"""JWT 认证工具 — require_auth / require_admin / get_current_user"""
import base64
import hashlib
import hmac
import json
import logging
import time
from functools import wraps
from flask import request, g

logger = logging.getLogger(__name__)

JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_DAYS = 7


def _get_secret() -> str:
    from flask import current_app
    return current_app.config.get('SECRET_KEY', 'banana-secret-change-me')


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def _b64url_decode(data: str) -> bytes:
    padding = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode('ascii'))


def generate_token(user_id: str) -> str:
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    exp = now + timedelta(days=JWT_EXPIRY_DAYS)
    header = {'typ': 'JWT', 'alg': JWT_ALGORITHM}
    payload = {
        'sub': user_id,
        'iat': int(now.timestamp()),
        'exp': int(exp.timestamp()),
    }
    signing_input = '.'.join([
        _b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8')),
        _b64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8')),
    ])
    signature = hmac.new(
        _get_secret().encode('utf-8'),
        signing_input.encode('ascii'),
        hashlib.sha256,
    ).digest()
    return f'{signing_input}.{_b64url_encode(signature)}'


def _decode_token(token: str) -> dict | None:
    try:
        header_b64, payload_b64, signature_b64 = token.split('.', 2)
        signing_input = f'{header_b64}.{payload_b64}'
        expected_signature = hmac.new(
            _get_secret().encode('utf-8'),
            signing_input.encode('ascii'),
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(_b64url_decode(signature_b64), expected_signature):
            return None

        header = json.loads(_b64url_decode(header_b64))
        if header.get('alg') != JWT_ALGORITHM:
            return None

        payload = json.loads(_b64url_decode(payload_b64))
        exp = payload.get('exp')
        if exp is not None and float(exp) < time.time():
            return None
        return payload
    except Exception:
        return None


def _extract_user_from_token():
    """从 Authorization: Bearer <token> 解析 User，写入 g.current_user。失败返回 None。"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:]
    payload = _decode_token(token)
    if not payload:
        return None
    user_id = payload.get('sub')
    if not user_id:
        return None
    from models import User
    user = User.query.get(user_id)
    if user and user.is_active:
        return user
    return None


def get_current_user():
    """返回当前已认证用户（已通过 require_auth 装饰器），或 None。"""
    return getattr(g, 'current_user', None)


def authenticate_request():
    """解析当前请求的 JWT，成功时写入 g.current_user 并返回用户。"""
    user = _extract_user_from_token()
    if user is not None:
        g.current_user = user
    return user


def user_can_access_project(project, user=None) -> bool:
    """普通用户只能访问自己的项目；管理员可访问历史和其他用户项目。"""
    user = user or get_current_user()
    if not user or not project:
        return False
    return project.user_id == user.id or bool(user.is_admin)


def get_project_or_404(project_id: str):
    """按当前用户权限获取项目；无权限时故意返回 404 避免暴露存在性。"""
    from models import Project
    from utils import not_found

    project = Project.query.get(project_id)
    if not project:
        return None, not_found('Project')
    if not user_can_access_project(project):
        return None, not_found('Project')
    return project, None


def require_auth(f):
    """装饰器：必须登录，否则返回 401。"""
    @wraps(f)
    def decorated(*args, **kwargs):
        from utils import error_response
        user = authenticate_request()
        if user is None:
            return error_response('UNAUTHORIZED', '请先登录', 401)
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    """装饰器：必须是管理员，否则返回 403。"""
    @wraps(f)
    def decorated(*args, **kwargs):
        from utils import error_response
        user = authenticate_request()
        if user is None:
            return error_response('UNAUTHORIZED', '请先登录', 401)
        if not user.is_admin:
            return error_response('FORBIDDEN', '需要管理员权限', 403)
        return f(*args, **kwargs)
    return decorated


def optional_auth(f):
    """装饰器：尝试认证，失败不阻止请求（g.current_user 可能为 None）。"""
    @wraps(f)
    def decorated(*args, **kwargs):
        g.current_user = _extract_user_from_token()
        return f(*args, **kwargs)
    return decorated
