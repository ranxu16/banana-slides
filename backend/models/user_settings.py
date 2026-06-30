"""UserSettings model — per-user API 配置，覆盖全局 Settings"""
import uuid
from datetime import datetime
from . import db


class UserSettings(db.Model):
    """每个用户独立的 API 配置，优先级高于全局 Settings"""
    __tablename__ = 'user_settings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'),
                        unique=True, nullable=False)

    # 个人 API 配置（留空则继承全局）
    api_key = db.Column(db.String(500), nullable=True)
    api_base_url = db.Column(db.String(500), nullable=True)
    text_model = db.Column(db.String(100), nullable=True)
    image_model = db.Column(db.String(100), nullable=True)
    image_caption_model = db.Column(db.String(100), nullable=True)
    text_model_source = db.Column(db.String(50), nullable=True)
    image_model_source = db.Column(db.String(50), nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = db.relationship('User', back_populates='settings')

    def to_dict(self):
        return {
            'api_key': self.api_key or '',
            'api_base_url': self.api_base_url or '',
            'text_model': self.text_model or '',
            'image_model': self.image_model or '',
            'image_caption_model': self.image_caption_model or '',
            'text_model_source': self.text_model_source or '',
            'image_model_source': self.image_model_source or '',
        }
