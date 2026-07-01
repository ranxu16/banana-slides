"""add project override fields metadata

Revision ID: 022_add_project_override_fields
Revises: 021_expand_user_settings_config
Create Date: 2026-07-01
"""
from alembic import op
import sqlalchemy as sa


revision = '022_add_project_override_fields'
down_revision = '021_expand_user_settings_config'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('projects') as batch_op:
        batch_op.add_column(sa.Column('project_override_fields', sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('projects') as batch_op:
        batch_op.drop_column('project_override_fields')
