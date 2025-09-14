import asyncio
from datetime import datetime
from app.models.mongodb_models import User, UserRole
from app.core.security import get_password_hash
from app.core.rbac import UserRole, Permission

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    # MongoDB doesn't require table creation like SQLAlchemy
    # Collections are created automatically when documents are inserted
    print("MongoDB collections will be created automatically when needed.")

def init_role_permissions(db):
    """Initialize role-permission mappings in database"""
    print("Initializing role permissions...")
    
    # MongoDB-based role permissions are handled differently
    # Role permissions are now managed through the RBAC system
    print("Role permissions are managed through MongoDB RBAC system.")
    print("Role permissions initialized successfully.")

async def create_super_admin(db, email: str, password: str):
    """Create the main super admin user"""
    print(f"Creating super admin user: {email}")
    
    # Check if super admin already exists
    existing_user = await User.find_one(User.email == email)
    if existing_user:
        print(f"Super admin user {email} already exists.")
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
    
    await super_admin.insert()
    
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

async def main():
    """Main function to initialize RBAC system"""
    print("Starting RBAC initialization...")
    
    # Create database tables (MongoDB collections created automatically)
    create_tables()
    
    # Initialize role permissions (MongoDB-based)
    init_role_permissions(None)
    
    # Create super admin user
    super_admin_email = "admin@remotehive.in"
    super_admin_password = "Ranjeet11$"
    await create_super_admin(None, super_admin_email, super_admin_password)
    
    print("RBAC initialization completed successfully!")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "reset":
        reset_rbac_system()
    else:
        # Initialize with default super admin credentials
        asyncio.run(main())