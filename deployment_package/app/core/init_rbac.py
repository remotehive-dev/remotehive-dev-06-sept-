import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.database import get_db_session, get_database_manager
from app.database.models import User, UserRole, Base
from app.core.local_auth import get_password_hash
from app.core.rbac import RolePermission, UserSession, LoginAttempt, Permission

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    db_manager = get_database_manager()
    Base.metadata.create_all(bind=db_manager.engine)
    print("Database tables created successfully.")

def init_role_permissions(db: Session):
    """Initialize role-permission mappings in database"""
    print("Initializing role permissions...")
    
    # Use the predefined role-permission mappings from rbac.py
    from app.core.rbac import ROLE_PERMISSIONS
    
    role_permissions = ROLE_PERMISSIONS
    
    # Clear existing role permissions
    db.query(RolePermission).delete()
    
    # Insert role permissions
    for role, permissions in role_permissions.items():
        for permission in permissions:
            role_perm = RolePermission(
                role=role,
                permission=permission.value
            )
            db.add(role_perm)
    
    db.commit()
    print("Role permissions initialized successfully.")

def create_super_admin(db: Session, email: str, password: str):
    """Create the main super admin user"""
    print(f"Creating super admin user: {email}")
    
    # Check if super admin already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"Super admin user {email} already exists.")
        
        # Update password if different
        new_password_hash = get_password_hash(password)
        if existing_user.password_hash != new_password_hash:
            existing_user.password_hash = new_password_hash
            print("Super admin password updated.")
        
        # Ensure role is super_admin
        if existing_user.role != UserRole.SUPER_ADMIN:
            existing_user.role = UserRole.SUPER_ADMIN
            print("Super admin role updated.")
        
        # Ensure user is active and verified
        if not existing_user.is_active:
            existing_user.is_active = True
            print("Super admin activated.")
        
        if not existing_user.is_verified:
            existing_user.is_verified = True
            print("Super admin verified.")
        
        db.commit()
        return existing_user
    
    # Create new super admin user
    super_admin = User(
        email=email,
        password_hash=get_password_hash(password),
        first_name="Super",
        last_name="Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)
    
    print(f"Super admin user created successfully with ID: {super_admin.id}")
    return super_admin

def verify_database_setup(db: Session):
    """Verify that the database is set up correctly"""
    print("Verifying database setup...")
    
    # Check if tables exist
    tables_to_check = ['users', 'role_permissions', 'user_sessions', 'login_attempts']
    
    for table in tables_to_check:
        try:
            result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f"Table '{table}': {count} records")
        except Exception as e:
            print(f"Error checking table '{table}': {e}")
    
    # Check super admin user
    super_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
    if super_admin:
        print(f"Super admin found: {super_admin.email} (ID: {super_admin.id})")
    else:
        print("No super admin user found!")
    
    # Check role permissions
    role_perms = db.query(RolePermission).count()
    print(f"Role permissions configured: {role_perms}")
    
    print("Database verification completed.")

def init_rbac_system(super_admin_email: str = "admin@remotehive.in", super_admin_password: str = "Ranjeet11$"):
    """Initialize the complete RBAC system"""
    print("Initializing RBAC system...")
    print("=" * 50)
    
    try:
        # Create tables
        create_tables()
        
        # Get database session
        db = next(get_db_session())
        
        try:
            # Initialize role permissions
            init_role_permissions(db)
            
            # Create super admin user
            super_admin = create_super_admin(db, super_admin_email, super_admin_password)
            
            # Verify setup
            verify_database_setup(db)
            
            print("=" * 50)
            print("RBAC system initialized successfully!")
            print(f"Super Admin Email: {super_admin_email}")
            print(f"Super Admin Password: {super_admin_password}")
            print("=" * 50)
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error initializing RBAC system: {e}")
        return False

def reset_rbac_system():
    """Reset the RBAC system (use with caution)"""
    print("WARNING: This will reset the entire RBAC system!")
    response = input("Are you sure you want to continue? (yes/no): ")
    
    if response.lower() != 'yes':
        print("Reset cancelled.")
        return
    
    try:
        db = next(get_db_session())
        
        try:
            # Clear all RBAC-related data
            db.query(UserSession).delete()
            db.query(LoginAttempt).delete()
            db.query(RolePermission).delete()
            db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])).delete()
            
            db.commit()
            print("RBAC system reset completed.")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error resetting RBAC system: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "reset":
        reset_rbac_system()
    else:
        # Initialize with default super admin credentials
        init_rbac_system()