"""add users and user_settings tables, add user_id to projects

Revision ID: 020_add_users
Revises: 019_add_enable_visual_structure_analysis
Create Date: 2026-06-29
"""
from alembic import op
import sqlalchemy as sa

revision = '020_add_users'
down_revision = '019_add_enable_visual_structure_analysis'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 创建 users 表
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('username', sa.String(50), unique=True, nullable=False),
        sa.Column('email', sa.String(120), unique=True, nullable=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # 创建 user_settings 表
    op.create_table(
        'user_settings',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'),
                  unique=True, nullable=False),
        sa.Column('api_key', sa.String(500), nullable=True),
        sa.Column('api_base_url', sa.String(500), nullable=True),
        sa.Column('text_model', sa.String(100), nullable=True),
        sa.Column('image_model', sa.String(100), nullable=True),
        sa.Column('image_caption_model', sa.String(100), nullable=True),
        sa.Column('text_model_source', sa.String(50), nullable=True),
        sa.Column('image_model_source', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # projects 表加 user_id（允许 NULL，历史数据兼容）
    # SQLite 不支持 ALTER TABLE ADD COLUMN with FK constraint，使用 batch 模式
    with op.batch_alter_table('projects') as batch_op:
        batch_op.add_column(
            sa.Column('user_id', sa.String(36), nullable=True)
        )


def downgrade() -> None:
    op.drop_column('projects', 'user_id')
    op.drop_table('user_settings')
    op.drop_table('users')
