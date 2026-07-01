"""expand user settings config fields

Revision ID: 021_expand_user_settings_config
Revises: 020_add_users
Create Date: 2026-07-01
"""
from alembic import op
import sqlalchemy as sa

revision = '021_expand_user_settings_config'
down_revision = '020_add_users'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('user_settings') as batch_op:
        batch_op.add_column(sa.Column('force_global_default', sa.Boolean(), nullable=False, server_default=sa.false()))
        batch_op.add_column(sa.Column('ai_provider_format', sa.String(20), nullable=True))
        batch_op.add_column(sa.Column('image_caption_model_source', sa.String(50), nullable=True))
        batch_op.add_column(sa.Column('openai_image_api_protocol', sa.String(10), nullable=True))
        batch_op.add_column(sa.Column('text_api_key', sa.String(500), nullable=True))
        batch_op.add_column(sa.Column('text_api_base_url', sa.String(500), nullable=True))
        batch_op.add_column(sa.Column('image_api_key', sa.String(500), nullable=True))
        batch_op.add_column(sa.Column('image_api_base_url', sa.String(500), nullable=True))
        batch_op.add_column(sa.Column('image_caption_api_key', sa.String(500), nullable=True))
        batch_op.add_column(sa.Column('image_caption_api_base_url', sa.String(500), nullable=True))
        batch_op.add_column(sa.Column('lazyllm_api_keys', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('capability_overrides', sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('user_settings') as batch_op:
        batch_op.drop_column('capability_overrides')
        batch_op.drop_column('lazyllm_api_keys')
        batch_op.drop_column('image_caption_api_base_url')
        batch_op.drop_column('image_caption_api_key')
        batch_op.drop_column('image_api_base_url')
        batch_op.drop_column('image_api_key')
        batch_op.drop_column('text_api_base_url')
        batch_op.drop_column('text_api_key')
        batch_op.drop_column('openai_image_api_protocol')
        batch_op.drop_column('image_caption_model_source')
        batch_op.drop_column('ai_provider_format')
        batch_op.drop_column('force_global_default')
