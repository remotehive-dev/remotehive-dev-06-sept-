import sys
sys.path.append('.')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.models import User, UserRole
from app.core.config import settings

# Create database engine
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def update_user_role():
    db = SessionLocal()
    try:
        # Find the user by email
        user = db.query(User).filter(User.email == "superadmin@remotehive.in").first()
        if user:
            print(f"Found user: {user.email} with current role: {user.role}")
            # Update role to super_admin
            user.role = UserRole.SUPER_ADMIN
            db.commit()
            print(f"Updated user role to: {user.role}")
        else:
            print("User not found")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_user_role()