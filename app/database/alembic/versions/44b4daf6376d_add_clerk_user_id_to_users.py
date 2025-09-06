"""add_clerk_user_id_to_users

Revision ID: 44b4daf6376d
Revises: d5a3515f4a6b
Create Date: 2025-08-07 16:44:37.273587

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '44b4daf6376d'
down_revision = 'd5a3515f4a6b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('users', schema=None, copy_from=None) as batch_op:
        # Add clerk_user_id column
        batch_op.add_column(sa.Column('clerk_user_id', sa.String(255), nullable=True))
        batch_op.create_unique_constraint('uq_users_clerk_user_id', ['clerk_user_id'])
        
        # Make password_hash nullable for Clerk users
        batch_op.alter_column('password_hash', nullable=True)


def downgrade() -> None:
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('users', schema=None, copy_from=None) as batch_op:
        # Remove clerk_user_id column
        batch_op.drop_constraint('uq_users_clerk_user_id', type_='unique')
        batch_op.drop_column('clerk_user_id')
        
        # Make password_hash non-nullable again
        batch_op.alter_column('password_hash', nullable=False)
