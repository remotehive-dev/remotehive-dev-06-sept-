#!/usr/bin/env python3
"""
Database Export Script for RemoteHive Project Migration
Exports all SQLite databases to SQL dumps and JSON backups
"""

import sqlite3
import json
import os
import shutil
from datetime import datetime
from pathlib import Path
import sys

def create_backup_directory():
    """Create timestamped backup directory"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = Path(f"migration_backup_{timestamp}")
    backup_dir.mkdir(exist_ok=True)
    return backup_dir

def export_sqlite_to_sql(db_path, output_path):
    """Export SQLite database to SQL dump"""
    if not os.path.exists(db_path):
        print(f"Warning: Database {db_path} not found")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            # Write SQL dump
            for line in conn.iterdump():
                f.write(f"{line}\n")
        
        conn.close()
        print(f"✓ Exported {db_path} to {output_path}")
        return True
    except Exception as e:
        print(f"✗ Error exporting {db_path}: {e}")
        return False

def export_sqlite_to_json(db_path, output_path):
    """Export SQLite database to JSON format"""
    if not os.path.exists(db_path):
        print(f"Warning: Database {db_path} not found")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        database_data = {}
        
        for table in tables:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            
            # Convert rows to dictionaries
            table_data = []
            for row in rows:
                row_dict = {}
                for key in row.keys():
                    value = row[key]
                    # Handle datetime and other non-JSON serializable types
                    if isinstance(value, bytes):
                        value = value.decode('utf-8', errors='ignore')
                    row_dict[key] = value
                table_data.append(row_dict)
            
            database_data[table] = {
                'count': len(table_data),
                'data': table_data
            }
        
        # Write JSON dump
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(database_data, f, indent=2, default=str)
        
        conn.close()
        print(f"✓ Exported {db_path} to JSON: {output_path}")
        return True
    except Exception as e:
        print(f"✗ Error exporting {db_path} to JSON: {e}")
        return False

def copy_database_files(backup_dir):
    """Copy all database files to backup directory"""
    db_files = [
        'remotehive.db',
        'remotehive.db-shm',
        'remotehive.db-wal',
        'app.db'
    ]
    
    copied_files = []
    
    for db_file in db_files:
        if os.path.exists(db_file):
            dest_path = backup_dir / db_file
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(db_file, dest_path)
            copied_files.append(db_file)
            print(f"✓ Copied {db_file} to backup")
        else:
            print(f"⚠ Database file not found: {db_file}")
    
    return copied_files

def export_environment_files(backup_dir):
    """Export all environment configuration files"""
    env_files = [
        '.env',
        '.env.example',
        'remotehive-admin/.env.local',
        'remotehive-public/.env.local',
        'requirements.txt',
        'remotehive-admin/package.json',
        'remotehive-public/package.json',
        'package.json'
    ]
    
    config_dir = backup_dir / 'config'
    config_dir.mkdir(exist_ok=True)
    
    copied_configs = []
    
    for env_file in env_files:
        if os.path.exists(env_file):
            dest_path = config_dir / env_file
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(env_file, dest_path)
            copied_configs.append(env_file)
            print(f"✓ Copied config: {env_file}")
        else:
            print(f"⚠ Config file not found: {env_file}")
    
    return copied_configs

def generate_database_stats(db_path):
    """Generate statistics for a database"""
    if not os.path.exists(db_path):
        return None
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get table information
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        stats = {
            'file_size': os.path.getsize(db_path),
            'table_count': len(tables),
            'tables': {}
        }
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            stats['tables'][table] = count
        
        conn.close()
        return stats
    except Exception as e:
        print(f"Error getting stats for {db_path}: {e}")
        return None

def create_migration_report(backup_dir, copied_files, copied_configs):
    """Create a detailed migration report"""
    report = {
        'migration_date': datetime.now().isoformat(),
        'source_platform': 'Windows',
        'target_platform': 'macOS',
        'backup_directory': str(backup_dir),
        'databases': {},
        'configuration_files': copied_configs,
        'database_files': copied_files
    }
    
    # Add database statistics
    db_files = ['remotehive.db', 'app.db']
    for db_file in db_files:
        if os.path.exists(db_file):
            stats = generate_database_stats(db_file)
            if stats:
                report['databases'][db_file] = stats
    
    # Write report
    report_path = backup_dir / 'migration_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"✓ Migration report created: {report_path}")
    return report

def main():
    """Main export function"""
    print("🚀 Starting RemoteHive Database Export for macOS Migration")
    print("=" * 60)
    
    # Create backup directory
    backup_dir = create_backup_directory()
    print(f"📁 Created backup directory: {backup_dir}")
    
    # Copy database files
    print("\n📊 Copying database files...")
    copied_files = copy_database_files(backup_dir)
    
    # Export databases to SQL
    print("\n💾 Exporting databases to SQL...")
    databases = [
        ('remotehive.db', backup_dir / 'remotehive.sql'),
        ('app.db', backup_dir / 'app.sql')
    ]
    
    for db_path, sql_path in databases:
        export_sqlite_to_sql(db_path, sql_path)
    
    # Export databases to JSON
    print("\n📋 Exporting databases to JSON...")
    for db_path, _ in databases:
        json_path = backup_dir / f"{Path(db_path).stem}.json"
        export_sqlite_to_json(db_path, json_path)
    
    # Copy configuration files
    print("\n⚙️ Copying configuration files...")
    copied_configs = export_environment_files(backup_dir)
    
    # Create migration report
    print("\n📄 Creating migration report...")
    report = create_migration_report(backup_dir, copied_files, copied_configs)
    
    # Create README for backup
    readme_content = f"""# RemoteHive Migration Backup

Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Source: Windows
Target: macOS

## Contents

### Database Files
{chr(10).join(f'- {f}' for f in copied_files)}

### SQL Exports
- remotehive.sql
- app.sql

### JSON Exports
- remotehive.json
- app.json

### Configuration Files
{chr(10).join(f'- {f}' for f in copied_configs)}

## Usage

1. Transfer this entire backup directory to your macOS machine
2. Follow the MACOS_MIGRATION_GUIDE.md instructions
3. Use the SQL files to restore databases if needed
4. Use the JSON files for data analysis or alternative imports

## Database Statistics

{json.dumps(report.get('databases', {}), indent=2)}
"""
    
    readme_path = backup_dir / 'README.md'
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"\n✅ Export completed successfully!")
    print(f"📦 Backup location: {backup_dir.absolute()}")
    print(f"📊 Total files backed up: {len(copied_files) + len(copied_configs) + 6}")
    print("\n🎯 Next steps:")
    print("1. Transfer the backup directory to your macOS machine")
    print("2. Follow the MACOS_MIGRATION_GUIDE.md instructions")
    print("3. Verify all data after migration")
    
    return backup_dir

if __name__ == "__main__":
    try:
        backup_dir = main()
        print(f"\n🎉 Migration backup ready: {backup_dir}")
    except KeyboardInterrupt:
        print("\n❌ Export cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Export failed: {e}")
        sys.exit(1)