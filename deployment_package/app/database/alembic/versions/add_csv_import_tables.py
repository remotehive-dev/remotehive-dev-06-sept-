"""Add CSV import tables

Revision ID: csv_import_001
Revises: ml_rls_policies
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'csv_import_001'
down_revision = '44b4daf6376d'
branch_labels = None
depends_on = None

def upgrade():
    # Create CSV imports table
    op.create_table('csv_imports',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('total_rows', sa.Integer(), nullable=False),
        sa.Column('valid_rows', sa.Integer(), nullable=True, default=0),
        sa.Column('invalid_rows', sa.Integer(), nullable=True, default=0),
        sa.Column('processed_rows', sa.Integer(), nullable=True, default=0),
        sa.Column('successful_imports', sa.Integer(), nullable=True, default=0),
        sa.Column('failed_imports', sa.Integer(), nullable=True, default=0),
        sa.Column('status', sa.String(20), nullable=True, server_default='PENDING'),
        sa.Column('progress', sa.Float(), nullable=True, default=0.0),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create CSV import logs table
    op.create_table('csv_import_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('upload_id', sa.String(36), nullable=False),
        sa.Column('row_number', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['upload_id'], ['csv_imports.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['job_id'], ['job_posts.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for better performance
    op.create_index('idx_csv_imports_user_id', 'csv_imports', ['user_id'])
    op.create_index('idx_csv_imports_status', 'csv_imports', ['status'])
    op.create_index('idx_csv_imports_created_at', 'csv_imports', ['created_at'])
    op.create_index('idx_csv_import_logs_upload_id', 'csv_import_logs', ['upload_id'])
    op.create_index('idx_csv_import_logs_status', 'csv_import_logs', ['status'])
    op.create_index('idx_csv_import_logs_row_number', 'csv_import_logs', ['row_number'])

def downgrade():
    # Drop indexes
    op.drop_index('idx_csv_import_logs_row_number', table_name='csv_import_logs')
    op.drop_index('idx_csv_import_logs_status', table_name='csv_import_logs')
    op.drop_index('idx_csv_import_logs_upload_id', table_name='csv_import_logs')
    op.drop_index('idx_csv_imports_created_at', table_name='csv_imports')
    op.drop_index('idx_csv_imports_status', table_name='csv_imports')
    op.drop_index('idx_csv_imports_user_id', table_name='csv_imports')
    
    # Drop tables
    op.drop_table('csv_import_logs')
    op.drop_table('csv_imports')