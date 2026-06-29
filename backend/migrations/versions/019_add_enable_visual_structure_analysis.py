"""add enable_visual_structure_analysis to projects

Revision ID: 019_add_enable_visual_structure_analysis
Revises: 018_add_project_title
Create Date: 2026-06-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '019_add_enable_visual_structure_analysis'
down_revision = '018_add_project_title'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add enable_visual_structure_analysis column to projects table.

    When enabled, the editable PPTX export will call a Vision model once per
    slide to detect card shapes, background colors and layout hierarchy, then
    render them as native vector shapes in the PPTX instead of using a
    screenshot background image.

    Defaults to False (disabled) to keep existing behavior unchanged.
    """
    op.add_column(
        'projects',
        sa.Column(
            'enable_visual_structure_analysis',
            sa.Boolean(),
            nullable=True,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column('projects', 'enable_visual_structure_analysis')
