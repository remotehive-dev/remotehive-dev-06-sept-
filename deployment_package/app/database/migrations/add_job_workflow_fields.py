"""Add job workflow fields and JobWorkflowLog table

Revision ID: add_job_workflow_fields
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_job_workflow_fields'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns to job_posts table
    op.add_column('job_posts', sa.Column('priority', sa.String(20), nullable=True, default='normal'))
    op.add_column('job_posts', sa.Column('submitted_for_approval_at', sa.DateTime(), nullable=True))
    op.add_column('job_posts', sa.Column('submitted_by', sa.String(36), nullable=True))
    op.add_column('job_posts', sa.Column('approved_at', sa.DateTime(), nullable=True))
    op.add_column('job_posts', sa.Column('approved_by', sa.String(36), nullable=True))
    op.add_column('job_posts', sa.Column('rejected_at', sa.DateTime(), nullable=True))
    op.add_column('job_posts', sa.Column('rejected_by', sa.String(36), nullable=True))
    op.add_column('job_posts', sa.Column('rejection_reason', sa.String(100), nullable=True))
    op.add_column('job_posts', sa.Column('rejection_notes', sa.Text(), nullable=True))
    op.add_column('job_posts', sa.Column('published_at', sa.DateTime(), nullable=True))
    op.add_column('job_posts', sa.Column('published_by', sa.String(36), nullable=True))
    op.add_column('job_posts', sa.Column('unpublished_at', sa.DateTime(), nullable=True))
    op.add_column('job_posts', sa.Column('unpublished_by', sa.String(36), nullable=True))
    op.add_column('job_posts', sa.Column('is_urgent', sa.Boolean(), nullable=False, default=False))
    op.add_column('job_posts', sa.Column('is_flagged', sa.Boolean(), nullable=False, default=False))
    op.add_column('job_posts', sa.Column('flagged_at', sa.DateTime(), nullable=True))
    op.add_column('job_posts', sa.Column('flagged_by', sa.String(36), nullable=True))
    op.add_column('job_posts', sa.Column('flagged_reason', sa.String(255), nullable=True))
    op.add_column('job_posts', sa.Column('external_id', sa.String(255), nullable=True))
    op.add_column('job_posts', sa.Column('external_source', sa.String(100), nullable=True))
    
    # Create job_workflow_logs table
    op.create_table('job_workflow_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('job_post_id', sa.String(36), sa.ForeignKey('job_posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('from_status', sa.String(50), nullable=True),
        sa.Column('to_status', sa.String(50), nullable=True),
        sa.Column('performed_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reason', sa.String(255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('additional_data', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    
    # Create indexes for better performance
    op.create_index('idx_job_posts_status', 'job_posts', ['status'])
    op.create_index('idx_job_posts_priority', 'job_posts', ['priority'])
    op.create_index('idx_job_posts_is_flagged', 'job_posts', ['is_flagged'])
    op.create_index('idx_job_posts_submitted_for_approval_at', 'job_posts', ['submitted_for_approval_at'])
    op.create_index('idx_job_posts_approved_at', 'job_posts', ['approved_at'])
    op.create_index('idx_job_posts_published_at', 'job_posts', ['published_at'])
    
    op.create_index('idx_job_workflow_logs_job_post_id', 'job_workflow_logs', ['job_post_id'])
    op.create_index('idx_job_workflow_logs_action', 'job_workflow_logs', ['action'])
    op.create_index('idx_job_workflow_logs_performed_by', 'job_workflow_logs', ['performed_by'])
    op.create_index('idx_job_workflow_logs_created_at', 'job_workflow_logs', ['created_at'])
    
    # Add foreign key constraints
    op.create_foreign_key(
        'fk_job_posts_submitted_by',
        'job_posts', 'users',
        ['submitted_by'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_job_posts_approved_by',
        'job_posts', 'users',
        ['approved_by'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_job_posts_rejected_by',
        'job_posts', 'users',
        ['rejected_by'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_job_posts_published_by',
        'job_posts', 'users',
        ['published_by'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_job_posts_unpublished_by',
        'job_posts', 'users',
        ['unpublished_by'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_job_posts_flagged_by',
        'job_posts', 'users',
        ['flagged_by'], ['id'],
        ondelete='SET NULL'
    )

def downgrade():
    # Drop foreign key constraints
    op.drop_constraint('fk_job_posts_flagged_by', 'job_posts', type_='foreignkey')
    op.drop_constraint('fk_job_posts_unpublished_by', 'job_posts', type_='foreignkey')
    op.drop_constraint('fk_job_posts_published_by', 'job_posts', type_='foreignkey')
    op.drop_constraint('fk_job_posts_rejected_by', 'job_posts', type_='foreignkey')
    op.drop_constraint('fk_job_posts_approved_by', 'job_posts', type_='foreignkey')
    op.drop_constraint('fk_job_posts_submitted_by', 'job_posts', type_='foreignkey')
    
    # Drop indexes
    op.drop_index('idx_job_workflow_logs_created_at', 'job_workflow_logs')
    op.drop_index('idx_job_workflow_logs_performed_by', 'job_workflow_logs')
    op.drop_index('idx_job_workflow_logs_action', 'job_workflow_logs')
    op.drop_index('idx_job_workflow_logs_job_post_id', 'job_workflow_logs')
    
    op.drop_index('idx_job_posts_published_at', 'job_posts')
    op.drop_index('idx_job_posts_approved_at', 'job_posts')
    op.drop_index('idx_job_posts_submitted_for_approval_at', 'job_posts')
    op.drop_index('idx_job_posts_is_flagged', 'job_posts')
    op.drop_index('idx_job_posts_priority', 'job_posts')
    op.drop_index('idx_job_posts_status', 'job_posts')
    
    # Drop job_workflow_logs table
    op.drop_table('job_workflow_logs')
    
    # Drop new columns from job_posts table
    op.drop_column('job_posts', 'external_source')
    op.drop_column('job_posts', 'external_id')
    op.drop_column('job_posts', 'flagged_reason')
    op.drop_column('job_posts', 'flagged_by')
    op.drop_column('job_posts', 'flagged_at')
    op.drop_column('job_posts', 'is_flagged')
    op.drop_column('job_posts', 'is_urgent')
    op.drop_column('job_posts', 'unpublished_by')
    op.drop_column('job_posts', 'unpublished_at')
    op.drop_column('job_posts', 'published_by')
    op.drop_column('job_posts', 'published_at')
    op.drop_column('job_posts', 'rejection_notes')
    op.drop_column('job_posts', 'rejection_reason')
    op.drop_column('job_posts', 'rejected_by')
    op.drop_column('job_posts', 'rejected_at')
    op.drop_column('job_posts', 'approved_by')
    op.drop_column('job_posts', 'approved_at')
    op.drop_column('job_posts', 'submitted_by')
    op.drop_column('job_posts', 'submitted_for_approval_at')
    op.drop_column('job_posts', 'priority')