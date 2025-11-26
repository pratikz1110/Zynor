"""add skills JSONB to technicians

Revision ID: 3a37c312d12f
Revises: e1404879a252
Create Date: 2025-11-02 10:36:57.546669

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3a37c312d12f'
down_revision = 'e1404879a252'
branch_labels = None
depends_on = None


def upgrade():
    # Add column with a temporary server_default to backfill existing rows
    op.add_column(
        'technicians',
        sa.Column(
            'skills',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            server_default=sa.text("'[]'::jsonb")
        )
    )
    # Drop the default so future inserts don't get DB-assigned values unless provided
    op.alter_column('technicians', 'skills', server_default=None)


def downgrade():
    op.drop_column('technicians', 'skills')
