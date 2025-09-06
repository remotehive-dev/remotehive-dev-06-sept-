"""Initial tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create users table
    op.create_table('users',
    sa.Column('id', sa.String(36), nullable=False),
    sa.Column('clerk_user_id', sa.String(length=255), nullable=True),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=True),
    sa.Column('first_name', sa.String(length=100), nullable=False),
    sa.Column('last_name', sa.String(length=100), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('role', sa.Enum('JOB_SEEKER', 'EMPLOYER', 'ADMIN', 'SUPER_ADMIN', name='userrole'), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('is_verified', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('clerk_user_id'),
    sa.UniqueConstraint('email')
    )

    # Create job_seekers table
    op.create_table('job_seekers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.String(36), nullable=False),
    sa.Column('current_title', sa.String(length=255), nullable=True),
    sa.Column('experience_level', sa.String(length=50), nullable=True),
    sa.Column('years_of_experience', sa.Integer(), nullable=True),
    sa.Column('skills', sa.Text(), nullable=True),
    sa.Column('preferred_job_types', sa.Text(), nullable=True),
    sa.Column('preferred_locations', sa.Text(), nullable=True),
    sa.Column('remote_work_preference', sa.Boolean(), nullable=True),
    sa.Column('min_salary', sa.Integer(), nullable=True),
    sa.Column('max_salary', sa.Integer(), nullable=True),
    sa.Column('salary_currency', sa.String(length=10), nullable=True),
    sa.Column('resume_url', sa.String(length=500), nullable=True),
    sa.Column('portfolio_url', sa.String(length=500), nullable=True),
    sa.Column('cover_letter_template', sa.Text(), nullable=True),
    sa.Column('is_actively_looking', sa.Boolean(), nullable=True),
    sa.Column('education_level', sa.String(length=100), nullable=True),
    sa.Column('field_of_study', sa.String(length=100), nullable=True),
    sa.Column('university', sa.String(length=255), nullable=True),
    sa.Column('graduation_year', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    # Create employers table
    op.create_table('employers',
    sa.Column('id', sa.String(36), nullable=False),
    sa.Column('user_id', sa.String(36), nullable=False),
    sa.Column('employer_number', sa.String(length=20), nullable=True),
    sa.Column('company_name', sa.String(length=255), nullable=False),
    sa.Column('company_email', sa.String(length=255), nullable=False),
    sa.Column('company_phone', sa.String(length=20), nullable=True),
    sa.Column('company_website', sa.String(length=255), nullable=True),
    sa.Column('company_description', sa.Text(), nullable=True),
    sa.Column('company_logo', sa.String(length=500), nullable=True),
    sa.Column('industry', sa.String(length=100), nullable=True),
    sa.Column('company_size', sa.String(length=50), nullable=True),
    sa.Column('location', sa.String(length=255), nullable=True),
    sa.Column('is_verified', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('company_email'),
    sa.UniqueConstraint('employer_number')
    )

    # Create job_posts table
    op.create_table('job_posts',
    sa.Column('id', sa.String(36), nullable=False),
    sa.Column('employer_id', sa.String(36), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('requirements', sa.Text(), nullable=True),
    sa.Column('responsibilities', sa.Text(), nullable=True),
    sa.Column('benefits', sa.Text(), nullable=True),
    sa.Column('job_type', sa.String(length=50), nullable=False),
    sa.Column('work_location', sa.String(length=50), nullable=False),
    sa.Column('salary_min', sa.Integer(), nullable=True),
    sa.Column('salary_max', sa.Integer(), nullable=True),
    sa.Column('salary_currency', sa.String(length=10), nullable=True),
    sa.Column('experience_level', sa.String(length=50), nullable=True),
    sa.Column('education_level', sa.String(length=100), nullable=True),
    sa.Column('skills_required', sa.JSON(), nullable=True),
    sa.Column('application_deadline', sa.DateTime(), nullable=True),
    sa.Column('is_remote', sa.Boolean(), nullable=True),
    sa.Column('location_city', sa.String(length=100), nullable=True),
    sa.Column('location_state', sa.String(length=100), nullable=True),
    sa.Column('location_country', sa.String(length=100), nullable=True),
    sa.Column('status', sa.String(length=50), nullable=True),
    sa.Column('priority', sa.String(length=20), nullable=True),
    sa.Column('workflow_stage', sa.String(length=50), nullable=True),
    sa.Column('employer_number', sa.String(length=20), nullable=True),
    sa.Column('auto_publish', sa.Boolean(), nullable=True),
    sa.Column('scheduled_publish_date', sa.DateTime(), nullable=True),
    sa.Column('expiry_date', sa.DateTime(), nullable=True),
    sa.Column('last_workflow_action', sa.String(length=50), nullable=True),
    sa.Column('workflow_notes', sa.Text(), nullable=True),
    sa.Column('admin_priority', sa.Integer(), nullable=True),
    sa.Column('requires_review', sa.Boolean(), nullable=True),
    sa.Column('review_completed_at', sa.DateTime(), nullable=True),
    sa.Column('review_completed_by', sa.String(36), nullable=True),
    sa.Column('submitted_for_approval_at', sa.DateTime(), nullable=True),
    sa.Column('submitted_by', sa.String(36), nullable=True),
    sa.Column('approved_at', sa.DateTime(), nullable=True),
    sa.Column('approved_by', sa.String(36), nullable=True),
    sa.Column('rejected_at', sa.DateTime(), nullable=True),
    sa.Column('rejected_by', sa.String(36), nullable=True),
    sa.Column('rejection_reason', sa.String(length=100), nullable=True),
    sa.Column('rejection_notes', sa.Text(), nullable=True),
    sa.Column('published_at', sa.DateTime(), nullable=True),
    sa.Column('published_by', sa.String(36), nullable=True),
    sa.Column('unpublished_at', sa.DateTime(), nullable=True),
    sa.Column('unpublished_by', sa.String(36), nullable=True),
    sa.Column('unpublish_reason', sa.Text(), nullable=True),
    sa.Column('is_featured', sa.Boolean(), nullable=True),
    sa.Column('is_urgent', sa.Boolean(), nullable=True),
    sa.Column('is_flagged', sa.Boolean(), nullable=True),
    sa.Column('flagged_at', sa.DateTime(), nullable=True),
    sa.Column('flagged_by', sa.String(36), nullable=True),
    sa.Column('flagged_reason', sa.Text(), nullable=True),
    sa.Column('views_count', sa.Integer(), nullable=True),
    sa.Column('applications_count', sa.Integer(), nullable=True),
    sa.Column('external_apply_url', sa.String(length=500), nullable=True),
    sa.Column('external_id', sa.String(length=255), nullable=True),
    sa.Column('external_source', sa.String(length=100), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['employer_id'], ['employers.id'], ),
    sa.ForeignKeyConstraint(['flagged_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['published_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['rejected_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['review_completed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['submitted_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['unpublished_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # Create job_applications table
    op.create_table('job_applications',
    sa.Column('id', sa.String(36), nullable=False),
    sa.Column('job_post_id', sa.String(36), nullable=False),
    sa.Column('job_seeker_id', sa.Integer(), nullable=False),
    sa.Column('cover_letter', sa.Text(), nullable=True),
    sa.Column('resume_url', sa.String(length=500), nullable=True),
    sa.Column('portfolio_url', sa.String(length=500), nullable=True),
    sa.Column('expected_salary', sa.Integer(), nullable=True),
    sa.Column('salary_currency', sa.String(length=10), nullable=True),
    sa.Column('available_start_date', sa.DateTime(), nullable=True),
    sa.Column('applicant_email', sa.String(length=255), nullable=True),
    sa.Column('applicant_phone', sa.String(length=50), nullable=True),
    sa.Column('status', sa.String(length=50), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['job_post_id'], ['job_posts.id'], ),
    sa.ForeignKeyConstraint(['job_seeker_id'], ['job_seekers.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('job_applications')
    op.drop_table('job_posts')
    op.drop_table('employers')
    op.drop_table('job_seekers')
    op.drop_table('users')
    op.execute('DROP TYPE userrole')