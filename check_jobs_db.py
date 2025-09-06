import sqlite3

def check_job_posts():
    try:
        conn = sqlite3.connect('remotehive.db')
        cursor = conn.cursor()
        
        # Check if job_posts table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='job_posts';")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("job_posts table does not exist")
            return
        
        # Get recent job posts
        cursor.execute('SELECT id, title, status, created_at FROM job_posts ORDER BY created_at DESC LIMIT 10')
        jobs = cursor.fetchall()
        
        print(f"Found {len(jobs)} job posts in database:")
        print("-" * 60)
        
        for job in jobs:
            print(f"ID: {job[0]}, Title: {job[1]}, Status: {job[2]}, Created: {job[3]}")
        
        # Get total count
        cursor.execute('SELECT COUNT(*) FROM job_posts')
        total = cursor.fetchone()[0]
        print(f"\nTotal job posts in database: {total}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error checking database: {e}")

if __name__ == "__main__":
    check_job_posts()