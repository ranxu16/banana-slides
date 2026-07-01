"""UserSettings model — per-user API 配置，覆盖全局 Settings"""
import json
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
    force_global_default = db.Column(db.Boolean, nullable=False, default=False)
    ai_provider_format = db.Column(db.String(20), nullable=True)
    api_key = db.Column(db.String(500), nullable=True)
    api_base_url = db.Column(db.String(500), nullable=True)
    text_model = db.Column(db.String(100), nullable=True)
    image_model = db.Column(db.String(100), nullable=True)
    image_caption_model = db.Column(db.String(100), nullable=True)
    text_model_source = db.Column(db.String(50), nullable=True)
    image_model_source = db.Column(db.String(50), nullable=True)
    image_caption_model_source = db.Column(db.String(50), nullable=True)
    openai_image_api_protocol = db.Column(db.String(10), nullable=True)

    # Per-model API 凭证。NULL 表示继承全局同名配置。
    text_api_key = db.Column(db.String(500), nullable=True)
    text_api_base_url = db.Column(db.String(500), nullable=True)
    image_api_key = db.Column(db.String(500), nullable=True)
    image_api_base_url = db.Column(db.String(500), nullable=True)
    image_caption_api_key = db.Column(db.String(500), nullable=True)
    image_caption_api_base_url = db.Column(db.String(500), nullable=True)
    lazyllm_api_keys = db.Column(db.Text, nullable=True)

    # 个人侧能力级继承开关。JSON 示例:
    # {"outline": {"use_global_default": true}, "editable_pptx": {"use_global_default": false}}
    capability_overrides = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = db.relationship('User', back_populates='settings')

    def _key_length(self, value):
        return len(value) if value else 0

    def get_capability_overrides_dict(self):
        if not self.capability_overrides:
            return {}
        try:
            data = json.loads(self.capability_overrides)
            return data if isinstance(data, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    def get_lazyllm_api_keys_dict(self):
        if not self.lazyllm_api_keys:
            return {}
        try:
            data = json.loads(self.lazyllm_api_keys)
            return data if isinstance(data, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    def _get_lazyllm_api_keys_info(self):
        return {
            vendor: len(key)
            for vendor, key in self.get_lazyllm_api_keys_dict().items()
            if key
        }

    def to_dict(self):
        return {
            'force_global_default': bool(self.force_global_default),
            'ai_provider_format': self.ai_provider_format or '',
            'api_base_url': self.api_base_url or '',
            'api_key_length': self._key_length(self.api_key),
            'text_model': self.text_model or '',
            'image_model': self.image_model or '',
            'image_caption_model': self.image_caption_model or '',
            'text_model_source': self.text_model_source or '',
            'image_model_source': self.image_model_source or '',
            'image_caption_model_source': self.image_caption_model_source or '',
            'openai_image_api_protocol': self.openai_image_api_protocol or 'auto',
            'text_api_base_url': self.text_api_base_url or '',
            'text_api_key_length': self._key_length(self.text_api_key),
            'image_api_base_url': self.image_api_base_url or '',
            'image_api_key_length': self._key_length(self.image_api_key),
            'image_caption_api_base_url': self.image_caption_api_base_url or '',
            'image_caption_api_key_length': self._key_length(self.image_caption_api_key),
            'lazyllm_api_keys_info': self._get_lazyllm_api_keys_info(),
            'capability_overrides': self.get_capability_overrides_dict(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
