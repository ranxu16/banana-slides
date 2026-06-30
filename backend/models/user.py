"""User model"""
import uuid
from datetime import datetime
from . import db


class User(db.Model):
    """用户表 — 支持多用户登录与数据隔离"""
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    projects = db.relationship('Project', back_populates='owner', lazy='dynamic',
                               foreign_keys='Project.user_id')
    settings = db.relationship('UserSettings', back_populates='user', uselist=False,
                               cascade='all, delete-orphan')

    def set_password(self, password: str):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        from werkzeug.security import check_password_hash
        try:
            return check_password_hash(self.password_hash, password)
        except Exception:
            return False

    def to_dict(self, include_stats=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
        }
        if include_stats:
            data['project_count'] = self.projects.count()
        return data
