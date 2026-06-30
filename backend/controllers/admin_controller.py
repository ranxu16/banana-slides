"""Admin Controller — 用户管理、系统概览（仅管理员）"""
import logging
from flask import Blueprint, request, g
from models import db, User, UserSettings, Project
from utils import success_response, error_response, bad_request, not_found
from utils.auth import require_admin

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/overview', methods=['GET'])
@require_admin
def overview():
    """GET /api/admin/overview — 系统概览"""
    total_users = User.query.count()
    total_projects = Project.query.count()
    assigned_projects = Project.query.filter(Project.user_id.isnot(None)).count()
    unassigned_projects = Project.query.filter(Project.user_id.is_(None)).count()
    active_users = User.query.filter_by(is_active=True).count()
    return success_response({
        'total_users': total_users,
        'active_users': active_users,
        'total_projects': total_projects,
        'assigned_projects': assigned_projects,
        'unassigned_projects': unassigned_projects,
    })


@admin_bp.route('/users', methods=['GET'])
@require_admin
def list_users():
    """GET /api/admin/users — 用户列表"""
    users = User.query.order_by(User.created_at.desc()).all()
    return success_response([u.to_dict(include_stats=True) for u in users])


@admin_bp.route('/users', methods=['POST'])
@require_admin
def create_user():
    """POST /api/admin/users — 管理员创建用户"""
    try:
        data = request.get_json() or {}
        username = (data.get('username') or '').strip()
        password = (data.get('password') or '').strip()
        email = (data.get('email') or '').strip() or None
        is_admin = bool(data.get('is_admin', False))

        if not username or len(username) < 2:
            return bad_request('用户名至少 2 个字符')
        if not password or len(password) < 6:
            return bad_request('密码至少 6 位')
        if User.query.filter_by(username=username).first():
            return bad_request('用户名已存在')
        if email and User.query.filter_by(email=email).first():
            return bad_request('邮箱已被注册')

        user = User(username=username, email=email, is_admin=is_admin)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return success_response(user.to_dict(), status_code=201)

    except Exception as e:
        db.session.rollback()
        logger.error(f'create_user error: {e}', exc_info=True)
        return error_response('SERVER_ERROR', str(e), 500)


@admin_bp.route('/users/<user_id>', methods=['GET'])
@require_admin
def get_user(user_id):
    """GET /api/admin/users/<user_id>"""
    user = User.query.get(user_id)
    if not user:
        return not_found('User')
    return success_response(user.to_dict(include_stats=True))


@admin_bp.route('/users/<user_id>', methods=['PATCH'])
@require_admin
def update_user(user_id):
    """PATCH /api/admin/users/<user_id> — 修改用户信息（启用/禁用/管理员/重置密码）"""
    try:
        user = User.query.get(user_id)
        if not user:
            return not_found('User')

        # 不允许管理员禁用/降级自己
        current = g.current_user
        data = request.get_json() or {}

        if 'is_active' in data:
            if user.id == current.id and not data['is_active']:
                return bad_request('不能禁用自己的账号')
            user.is_active = bool(data['is_active'])

        if 'is_admin' in data:
            if user.id == current.id and not data['is_admin']:
                return bad_request('不能撤销自己的管理员权限')
            user.is_admin = bool(data['is_admin'])

        if 'email' in data:
            email = (data['email'] or '').strip() or None
            if email and User.query.filter(User.email == email, User.id != user_id).first():
                return bad_request('邮箱已被其他用户使用')
            user.email = email

        if 'new_password' in data:
            new_pwd = (data['new_password'] or '').strip()
            if len(new_pwd) < 6:
                return bad_request('密码至少 6 位')
            user.set_password(new_pwd)

        db.session.commit()
        return success_response(user.to_dict(include_stats=True))

    except Exception as e:
        db.session.rollback()
        logger.error(f'update_user error: {e}', exc_info=True)
        return error_response('SERVER_ERROR', str(e), 500)


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@require_admin
def delete_user(user_id):
    """DELETE /api/admin/users/<user_id> — 删除用户及其所有数据"""
    try:
        user = User.query.get(user_id)
        if not user:
            return not_found('User')
        if user.id == g.current_user.id:
            return bad_request('不能删除自己的账号')

        db.session.delete(user)
        db.session.commit()
        return success_response({'message': f'用户 {user.username} 已删除'})

    except Exception as e:
        db.session.rollback()
        logger.error(f'delete_user error: {e}', exc_info=True)
        return error_response('SERVER_ERROR', str(e), 500)
