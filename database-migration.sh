#!/bin/bash

# =============================================================================
# RemoteHive Database Migration Script
# =============================================================================
# This script handles the complete migration from PostgreSQL/Supabase to MongoDB
# Includes data migration, schema conversion, and validation
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
MIGRATION_DIR="$PROJECT_ROOT/migration"
LOG_FILE="$PROJECT_ROOT/migration.log"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="development"
VERBOSE=false
DRY_RUN=false
FORCE=false
BATCH_SIZE=1000
MAX_RETRIES=3

# Database configurations
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-remotehive}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-remotehive}"
MONGO_USER="${MONGO_USER:-}"
MONGO_PASSWORD="${MONGO_PASSWORD:-}"

# Supabase configuration
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"

# =============================================================================
# Utility Functions
# =============================================================================

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            if [[ "$VERBOSE" == "true" ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $message"
            fi
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Progress indicator
show_progress() {
    local current=$1
    local total=$2
    local message="$3"
    local percent=$((current * 100 / total))
    local bar_length=50
    local filled_length=$((percent * bar_length / 100))
    
    printf "\r${CYAN}[%3d%%]${NC} " "$percent"
    printf "["
    printf "%*s" "$filled_length" | tr ' ' '█'
    printf "%*s" "$((bar_length - filled_length))" | tr ' ' '░'
    printf "] %s" "$message"
    
    if [[ $current -eq $total ]]; then
        echo
    fi
}

# Error handling
handle_error() {
    local exit_code=$?
    local line_number=$1
    log "ERROR" "An error occurred on line $line_number. Exit code: $exit_code"
    cleanup
    exit $exit_code
}

# Cleanup function
cleanup() {
    log "DEBUG" "Performing cleanup..."
    
    # Remove temporary files
    if [[ -d "$MIGRATION_DIR/tmp" ]]; then
        find "$MIGRATION_DIR/tmp" -name "*.tmp" -delete 2>/dev/null || true
    fi
    
    # Close database connections
    pkill -f "psql" 2>/dev/null || true
    pkill -f "mongo" 2>/dev/null || true
}

# Trap errors
trap 'handle_error $LINENO' ERR
trap cleanup EXIT

# =============================================================================
# Database Connection Functions
# =============================================================================

# Test PostgreSQL connection
test_postgres_connection() {
    log "INFO" "Testing PostgreSQL connection..."
    
    local connection_string="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
    
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
            log "SUCCESS" "PostgreSQL connection successful"
            return 0
        else
            log "ERROR" "PostgreSQL connection failed"
            return 1
        fi
    else
        log "ERROR" "psql command not found. Please install PostgreSQL client"
        return 1
    fi
}

# Test MongoDB connection
test_mongo_connection() {
    log "INFO" "Testing MongoDB connection..."
    
    local connection_string="mongodb://$MONGO_HOST:$MONGO_PORT/$MONGO_DB"
    
    if [[ -n "$MONGO_USER" && -n "$MONGO_PASSWORD" ]]; then
        connection_string="mongodb://$MONGO_USER:$MONGO_PASSWORD@$MONGO_HOST:$MONGO_PORT/$MONGO_DB"
    fi
    
    if command -v mongosh >/dev/null 2>&1; then
        if mongosh "$connection_string" --eval "db.runCommand('ping')" >/dev/null 2>&1; then
            log "SUCCESS" "MongoDB connection successful"
            return 0
        else
            log "ERROR" "MongoDB connection failed"
            return 1
        fi
    elif command -v mongo >/dev/null 2>&1; then
        if mongo "$connection_string" --eval "db.runCommand('ping')" >/dev/null 2>&1; then
            log "SUCCESS" "MongoDB connection successful"
            return 0
        else
            log "ERROR" "MongoDB connection failed"
            return 1
        fi
    else
        log "ERROR" "mongo/mongosh command not found. Please install MongoDB client"
        return 1
    fi
}

# Test Supabase connection
test_supabase_connection() {
    if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON_KEY" ]]; then
        log "WARN" "Supabase configuration not provided, skipping connection test"
        return 0
    fi
    
    log "INFO" "Testing Supabase connection..."
    
    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
            "$SUPABASE_URL/rest/v1/")
        
        if [[ "$response" == "200" ]]; then
            log "SUCCESS" "Supabase connection successful"
            return 0
        else
            log "ERROR" "Supabase connection failed (HTTP $response)"
            return 1
        fi
    else
        log "ERROR" "curl command not found. Please install curl"
        return 1
    fi
}

# =============================================================================
# Schema Analysis Functions
# =============================================================================

# Analyze PostgreSQL schema
analyze_postgres_schema() {
    log "INFO" "Analyzing PostgreSQL schema..."
    
    local schema_file="$MIGRATION_DIR/postgres_schema.json"
    
    # Create Python script for schema analysis
    cat > "$MIGRATION_DIR/analyze_postgres.py" << 'EOF'
import psycopg2
import json
import sys
from datetime import datetime

def analyze_schema(connection_params):
    try:
        conn = psycopg2.connect(**connection_params)
        cur = conn.cursor()
        
        schema_info = {
            'timestamp': datetime.now().isoformat(),
            'tables': {},
            'indexes': {},
            'constraints': {},
            'sequences': {}
        }
        
        # Get all tables
        cur.execute("""
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tables = cur.fetchall()
        
        for table_name, table_type in tables:
            # Get columns
            cur.execute("""
                SELECT column_name, data_type, is_nullable, column_default,
                       character_maximum_length, numeric_precision, numeric_scale
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position
            """, (table_name,))
            
            columns = cur.fetchall()
            
            # Get row count
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table_name}")
                row_count = cur.fetchone()[0]
            except:
                row_count = 0
            
            schema_info['tables'][table_name] = {
                'type': table_type,
                'row_count': row_count,
                'columns': [
                    {
                        'name': col[0],
                        'type': col[1],
                        'nullable': col[2] == 'YES',
                        'default': col[3],
                        'max_length': col[4],
                        'precision': col[5],
                        'scale': col[6]
                    }
                    for col in columns
                ]
            }
        
        # Get indexes
        cur.execute("""
            SELECT indexname, tablename, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
        """)
        
        indexes = cur.fetchall()
        for index_name, table_name, index_def in indexes:
            schema_info['indexes'][index_name] = {
                'table': table_name,
                'definition': index_def
            }
        
        # Get constraints
        cur.execute("""
            SELECT conname, contype, conrelid::regclass, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE connamespace = 'public'::regnamespace
        """)
        
        constraints = cur.fetchall()
        for constraint_name, constraint_type, table_name, constraint_def in constraints:
            schema_info['constraints'][constraint_name] = {
                'type': constraint_type,
                'table': str(table_name),
                'definition': constraint_def
            }
        
        cur.close()
        conn.close()
        
        return schema_info
        
    except Exception as e:
        print(f"Error analyzing schema: {e}", file=sys.stderr)
        return None

if __name__ == '__main__':
    import os
    
    connection_params = {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': int(os.getenv('POSTGRES_PORT', 5432)),
        'database': os.getenv('POSTGRES_DB', 'remotehive'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', '')
    }
    
    schema = analyze_schema(connection_params)
    if schema:
        print(json.dumps(schema, indent=2))
    else:
        sys.exit(1)
EOF

    # Run schema analysis
    if python3 "$MIGRATION_DIR/analyze_postgres.py" > "$schema_file" 2>/dev/null; then
        log "SUCCESS" "PostgreSQL schema analysis completed"
        
        # Show summary
        local table_count=$(jq '.tables | length' "$schema_file")
        local total_rows=$(jq '[.tables[].row_count] | add' "$schema_file")
        
        log "INFO" "Found $table_count tables with $total_rows total rows"
        
        return 0
    else
        log "ERROR" "PostgreSQL schema analysis failed"
        return 1
    fi
}

# Generate MongoDB schema mapping
generate_mongo_mapping() {
    log "INFO" "Generating MongoDB schema mapping..."
    
    local postgres_schema="$MIGRATION_DIR/postgres_schema.json"
    local mongo_mapping="$MIGRATION_DIR/mongo_mapping.json"
    
    if [[ ! -f "$postgres_schema" ]]; then
        log "ERROR" "PostgreSQL schema file not found"
        return 1
    fi
    
    # Create Python script for mapping generation
    cat > "$MIGRATION_DIR/generate_mapping.py" << 'EOF'
import json
import sys
from datetime import datetime

def postgres_to_mongo_type(pg_type, max_length=None):
    """Convert PostgreSQL type to MongoDB equivalent."""
    type_mapping = {
        'integer': 'int',
        'bigint': 'long',
        'smallint': 'int',
        'serial': 'int',
        'bigserial': 'long',
        'real': 'double',
        'double precision': 'double',
        'numeric': 'decimal',
        'money': 'decimal',
        'character varying': 'string',
        'varchar': 'string',
        'character': 'string',
        'char': 'string',
        'text': 'string',
        'boolean': 'bool',
        'date': 'date',
        'timestamp': 'date',
        'timestamp with time zone': 'date',
        'timestamp without time zone': 'date',
        'time': 'string',
        'interval': 'string',
        'uuid': 'string',
        'json': 'object',
        'jsonb': 'object',
        'array': 'array',
        'bytea': 'binData'
    }
    
    return type_mapping.get(pg_type.lower(), 'string')

def generate_collection_schema(table_name, table_info):
    """Generate MongoDB collection schema from PostgreSQL table."""
    
    collection_name = table_name
    
    # Convert table names to MongoDB collection naming convention
    if table_name.endswith('s'):
        collection_name = table_name  # Keep plural
    else:
        collection_name = table_name + 's'  # Make plural
    
    schema = {
        'collection_name': collection_name,
        'source_table': table_name,
        'estimated_size': table_info['row_count'],
        'fields': {},
        'indexes': [],
        'validation': {
            'required': [],
            'properties': {}
        }
    }
    
    for column in table_info['columns']:
        field_name = column['name']
        
        # Convert column names to camelCase
        if '_' in field_name:
            parts = field_name.split('_')
            field_name = parts[0] + ''.join(word.capitalize() for word in parts[1:])
        
        mongo_type = postgres_to_mongo_type(column['type'], column['max_length'])
        
        field_schema = {
            'type': mongo_type,
            'source_column': column['name'],
            'source_type': column['type'],
            'nullable': column['nullable']
        }
        
        if column['default']:
            field_schema['default'] = column['default']
        
        if column['max_length']:
            field_schema['max_length'] = column['max_length']
        
        schema['fields'][field_name] = field_schema
        
        # Add to validation schema
        if not column['nullable']:
            schema['validation']['required'].append(field_name)
        
        # Add type validation
        if mongo_type == 'string' and column['max_length']:
            schema['validation']['properties'][field_name] = {
                'type': 'string',
                'maxLength': column['max_length']
            }
        elif mongo_type in ['int', 'long', 'double']:
            schema['validation']['properties'][field_name] = {
                'type': 'number'
            }
        elif mongo_type == 'bool':
            schema['validation']['properties'][field_name] = {
                'type': 'boolean'
            }
        elif mongo_type == 'date':
            schema['validation']['properties'][field_name] = {
                'type': 'date'
            }
    
    return schema

def generate_mapping(postgres_schema):
    """Generate complete MongoDB mapping."""
    
    mapping = {
        'timestamp': datetime.now().isoformat(),
        'source_database': 'postgresql',
        'target_database': 'mongodb',
        'collections': {},
        'migration_order': [],
        'relationships': {},
        'indexes': {}
    }
    
    # Process each table
    for table_name, table_info in postgres_schema['tables'].items():
        collection_schema = generate_collection_schema(table_name, table_info)
        mapping['collections'][collection_schema['collection_name']] = collection_schema
        mapping['migration_order'].append(collection_schema['collection_name'])
    
    # Process indexes
    for index_name, index_info in postgres_schema.get('indexes', {}).items():
        if not index_name.endswith('_pkey'):  # Skip primary keys
            table_name = index_info['table']
            collection_name = None
            
            # Find corresponding collection
            for coll_name, coll_info in mapping['collections'].items():
                if coll_info['source_table'] == table_name:
                    collection_name = coll_name
                    break
            
            if collection_name:
                if collection_name not in mapping['indexes']:
                    mapping['indexes'][collection_name] = []
                
                mapping['indexes'][collection_name].append({
                    'name': index_name,
                    'source_definition': index_info['definition']
                })
    
    return mapping

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python generate_mapping.py <postgres_schema.json>", file=sys.stderr)
        sys.exit(1)
    
    try:
        with open(sys.argv[1], 'r') as f:
            postgres_schema = json.load(f)
        
        mapping = generate_mapping(postgres_schema)
        print(json.dumps(mapping, indent=2))
        
    except Exception as e:
        print(f"Error generating mapping: {e}", file=sys.stderr)
        sys.exit(1)
EOF

    # Generate mapping
    if python3 "$MIGRATION_DIR/generate_mapping.py" "$postgres_schema" > "$mongo_mapping" 2>/dev/null; then
        log "SUCCESS" "MongoDB mapping generated"
        
        # Show summary
        local collection_count=$(jq '.collections | length' "$mongo_mapping")
        log "INFO" "Generated mapping for $collection_count collections"
        
        return 0
    else
        log "ERROR" "MongoDB mapping generation failed"
        return 1
    fi
}

# =============================================================================
# Data Migration Functions
# =============================================================================

# Create backup of source data
create_backup() {
    log "INFO" "Creating backup of source data..."
    
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/postgres_backup_$backup_timestamp.sql"
    
    mkdir -p "$BACKUP_DIR"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would create backup: $backup_file"
        return 0
    fi
    
    # Create PostgreSQL backup
    if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$backup_file" 2>/dev/null; then
        
        # Compress backup
        gzip "$backup_file"
        
        log "SUCCESS" "Backup created: ${backup_file}.gz"
        return 0
    else
        log "ERROR" "Backup creation failed"
        return 1
    fi
}

# Migrate data from PostgreSQL to MongoDB
migrate_data() {
    log "INFO" "Starting data migration..."
    
    local mapping_file="$MIGRATION_DIR/mongo_mapping.json"
    
    if [[ ! -f "$mapping_file" ]]; then
        log "ERROR" "MongoDB mapping file not found"
        return 1
    fi
    
    # Create Python migration script
    cat > "$MIGRATION_DIR/migrate_data.py" << 'EOF'
import psycopg2
import pymongo
import json
import sys
import os
from datetime import datetime, timezone
from decimal import Decimal
import uuid
from typing import Any, Dict, List

class DataMigrator:
    def __init__(self, postgres_params, mongo_params, mapping, batch_size=1000):
        self.postgres_params = postgres_params
        self.mongo_params = mongo_params
        self.mapping = mapping
        self.batch_size = batch_size
        
        # Connect to databases
        self.pg_conn = psycopg2.connect(**postgres_params)
        self.mongo_client = pymongo.MongoClient(**mongo_params)
        self.mongo_db = self.mongo_client[mongo_params['database']]
    
    def convert_value(self, value: Any, target_type: str) -> Any:
        """Convert PostgreSQL value to MongoDB compatible value."""
        
        if value is None:
            return None
        
        if target_type == 'int':
            return int(value)
        elif target_type == 'long':
            return int(value)
        elif target_type == 'double':
            return float(value)
        elif target_type == 'decimal':
            return float(value) if isinstance(value, Decimal) else value
        elif target_type == 'string':
            return str(value)
        elif target_type == 'bool':
            return bool(value)
        elif target_type == 'date':
            if isinstance(value, datetime):
                return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
            return value
        elif target_type == 'object':
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except:
                    return value
            return value
        elif target_type == 'array':
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except:
                    return [value]
            return value if isinstance(value, list) else [value]
        else:
            return value
    
    def transform_row(self, row: tuple, columns: List[str], field_mapping: Dict) -> Dict:
        """Transform PostgreSQL row to MongoDB document."""
        
        document = {}
        
        for i, column_name in enumerate(columns):
            value = row[i]
            
            # Find corresponding MongoDB field
            mongo_field = None
            target_type = 'string'
            
            for field_name, field_info in field_mapping.items():
                if field_info['source_column'] == column_name:
                    mongo_field = field_name
                    target_type = field_info['type']
                    break
            
            if mongo_field:
                converted_value = self.convert_value(value, target_type)
                document[mongo_field] = converted_value
        
        return document
    
    def migrate_collection(self, collection_info: Dict) -> bool:
        """Migrate a single collection."""
        
        collection_name = collection_info['collection_name']
        source_table = collection_info['source_table']
        field_mapping = collection_info['fields']
        
        print(f"Migrating {source_table} -> {collection_name}...")
        
        try:
            # Get source data
            cursor = self.pg_conn.cursor()
            cursor.execute(f"SELECT * FROM {source_table}")
            
            # Get column names
            columns = [desc[0] for desc in cursor.description]
            
            # Get MongoDB collection
            mongo_collection = self.mongo_db[collection_name]
            
            # Clear existing data (optional)
            mongo_collection.delete_many({})
            
            # Migrate in batches
            batch = []
            total_rows = 0
            
            while True:
                rows = cursor.fetchmany(self.batch_size)
                if not rows:
                    break
                
                # Transform rows
                for row in rows:
                    document = self.transform_row(row, columns, field_mapping)
                    batch.append(document)
                
                # Insert batch
                if batch:
                    mongo_collection.insert_many(batch)
                    total_rows += len(batch)
                    print(f"  Migrated {total_rows} rows...")
                    batch = []
            
            cursor.close()
            
            print(f"  Completed: {total_rows} rows migrated")
            return True
            
        except Exception as e:
            print(f"  Error migrating {collection_name}: {e}")
            return False
    
    def create_indexes(self) -> bool:
        """Create MongoDB indexes."""
        
        print("Creating indexes...")
        
        try:
            for collection_name, collection_info in self.mapping['collections'].items():
                mongo_collection = self.mongo_db[collection_name]
                
                # Create basic indexes
                for field_name, field_info in collection_info['fields'].items():
                    if field_name in ['id', '_id', 'userId', 'companyId', 'jobId']:
                        try:
                            mongo_collection.create_index(field_name)
                            print(f"  Created index on {collection_name}.{field_name}")
                        except Exception as e:
                            print(f"  Warning: Could not create index on {collection_name}.{field_name}: {e}")
            
            return True
            
        except Exception as e:
            print(f"Error creating indexes: {e}")
            return False
    
    def validate_migration(self) -> bool:
        """Validate migration results."""
        
        print("Validating migration...")
        
        try:
            cursor = self.pg_conn.cursor()
            
            for collection_name, collection_info in self.mapping['collections'].items():
                source_table = collection_info['source_table']
                
                # Count source rows
                cursor.execute(f"SELECT COUNT(*) FROM {source_table}")
                source_count = cursor.fetchone()[0]
                
                # Count target documents
                mongo_collection = self.mongo_db[collection_name]
                target_count = mongo_collection.count_documents({})
                
                print(f"  {source_table}: {source_count} -> {collection_name}: {target_count}")
                
                if source_count != target_count:
                    print(f"  WARNING: Row count mismatch for {collection_name}")
                    return False
            
            cursor.close()
            
            print("Validation completed successfully")
            return True
            
        except Exception as e:
            print(f"Validation error: {e}")
            return False
    
    def migrate_all(self) -> bool:
        """Migrate all collections."""
        
        print("Starting data migration...")
        
        success = True
        
        # Migrate collections in order
        for collection_name in self.mapping['migration_order']:
            collection_info = self.mapping['collections'][collection_name]
            
            if not self.migrate_collection(collection_info):
                success = False
                break
        
        if success:
            # Create indexes
            success = self.create_indexes()
        
        if success:
            # Validate migration
            success = self.validate_migration()
        
        return success
    
    def close(self):
        """Close database connections."""
        self.pg_conn.close()
        self.mongo_client.close()

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python migrate_data.py <mapping.json>", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Load mapping
        with open(sys.argv[1], 'r') as f:
            mapping = json.load(f)
        
        # Database parameters
        postgres_params = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': int(os.getenv('POSTGRES_PORT', 5432)),
            'database': os.getenv('POSTGRES_DB', 'remotehive'),
            'user': os.getenv('POSTGRES_USER', 'postgres'),
            'password': os.getenv('POSTGRES_PASSWORD', '')
        }
        
        mongo_host = os.getenv('MONGO_HOST', 'localhost')
        mongo_port = int(os.getenv('MONGO_PORT', 27017))
        mongo_db = os.getenv('MONGO_DB', 'remotehive')
        mongo_user = os.getenv('MONGO_USER', '')
        mongo_password = os.getenv('MONGO_PASSWORD', '')
        
        if mongo_user and mongo_password:
            mongo_uri = f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}/{mongo_db}"
        else:
            mongo_uri = f"mongodb://{mongo_host}:{mongo_port}"
        
        mongo_params = {
            'host': mongo_uri,
            'database': mongo_db
        }
        
        # Create migrator
        batch_size = int(os.getenv('BATCH_SIZE', 1000))
        migrator = DataMigrator(postgres_params, mongo_params, mapping, batch_size)
        
        # Run migration
        success = migrator.migrate_all()
        
        # Cleanup
        migrator.close()
        
        if success:
            print("Migration completed successfully")
            sys.exit(0)
        else:
            print("Migration failed")
            sys.exit(1)
            
    except Exception as e:
        print(f"Migration error: {e}", file=sys.stderr)
        sys.exit(1)
EOF

    # Run data migration
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would migrate data using mapping file"
        return 0
    fi
    
    if python3 "$MIGRATION_DIR/migrate_data.py" "$mapping_file"; then
        log "SUCCESS" "Data migration completed"
        return 0
    else
        log "ERROR" "Data migration failed"
        return 1
    fi
}

# =============================================================================
# Validation Functions
# =============================================================================

# Validate migration results
validate_migration() {
    log "INFO" "Validating migration results..."
    
    local mapping_file="$MIGRATION_DIR/mongo_mapping.json"
    local validation_report="$MIGRATION_DIR/validation_report.json"
    
    if [[ ! -f "$mapping_file" ]]; then
        log "ERROR" "MongoDB mapping file not found"
        return 1
    fi
    
    # Create validation script
    cat > "$MIGRATION_DIR/validate_migration.py" << 'EOF'
import psycopg2
import pymongo
import json
import sys
import os
from datetime import datetime
from typing import Dict, List, Any

class MigrationValidator:
    def __init__(self, postgres_params, mongo_params, mapping):
        self.postgres_params = postgres_params
        self.mongo_params = mongo_params
        self.mapping = mapping
        
        # Connect to databases
        self.pg_conn = psycopg2.connect(**postgres_params)
        self.mongo_client = pymongo.MongoClient(**mongo_params)
        self.mongo_db = self.mongo_client[mongo_params['database']]
    
    def validate_counts(self) -> Dict[str, Any]:
        """Validate row/document counts."""
        
        results = {}
        cursor = self.pg_conn.cursor()
        
        for collection_name, collection_info in self.mapping['collections'].items():
            source_table = collection_info['source_table']
            
            try:
                # Count source rows
                cursor.execute(f"SELECT COUNT(*) FROM {source_table}")
                source_count = cursor.fetchone()[0]
                
                # Count target documents
                mongo_collection = self.mongo_db[collection_name]
                target_count = mongo_collection.count_documents({})
                
                results[collection_name] = {
                    'source_table': source_table,
                    'source_count': source_count,
                    'target_count': target_count,
                    'match': source_count == target_count,
                    'difference': target_count - source_count
                }
                
            except Exception as e:
                results[collection_name] = {
                    'source_table': source_table,
                    'error': str(e)
                }
        
        cursor.close()
        return results
    
    def validate_data_integrity(self) -> Dict[str, Any]:
        """Validate data integrity by sampling records."""
        
        results = {}
        cursor = self.pg_conn.cursor()
        
        for collection_name, collection_info in self.mapping['collections'].items():
            source_table = collection_info['source_table']
            field_mapping = collection_info['fields']
            
            try:
                # Sample some records
                cursor.execute(f"SELECT * FROM {source_table} LIMIT 10")
                sample_rows = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                
                mongo_collection = self.mongo_db[collection_name]
                sample_docs = list(mongo_collection.find().limit(10))
                
                # Compare sample data
                integrity_issues = []
                
                for i, row in enumerate(sample_rows[:len(sample_docs)]):
                    doc = sample_docs[i]
                    
                    for j, column_name in enumerate(columns):
                        pg_value = row[j]
                        
                        # Find corresponding MongoDB field
                        mongo_field = None
                        for field_name, field_info in field_mapping.items():
                            if field_info['source_column'] == column_name:
                                mongo_field = field_name
                                break
                        
                        if mongo_field and mongo_field in doc:
                            mongo_value = doc[mongo_field]
                            
                            # Basic type and value comparison
                            if pg_value is not None and mongo_value is not None:
                                if str(pg_value) != str(mongo_value):
                                    integrity_issues.append({
                                        'row': i,
                                        'column': column_name,
                                        'field': mongo_field,
                                        'postgres_value': str(pg_value),
                                        'mongo_value': str(mongo_value)
                                    })
                
                results[collection_name] = {
                    'source_table': source_table,
                    'sample_size': len(sample_rows),
                    'integrity_issues': integrity_issues,
                    'issues_count': len(integrity_issues)
                }
                
            except Exception as e:
                results[collection_name] = {
                    'source_table': source_table,
                    'error': str(e)
                }
        
        cursor.close()
        return results
    
    def validate_indexes(self) -> Dict[str, Any]:
        """Validate that indexes were created."""
        
        results = {}
        
        for collection_name in self.mapping['collections'].keys():
            try:
                mongo_collection = self.mongo_db[collection_name]
                indexes = list(mongo_collection.list_indexes())
                
                results[collection_name] = {
                    'indexes': [{
                        'name': idx.get('name'),
                        'key': idx.get('key'),
                        'unique': idx.get('unique', False)
                    } for idx in indexes]
                }
                
            except Exception as e:
                results[collection_name] = {
                    'error': str(e)
                }
        
        return results
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report."""
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'validation_results': {
                'counts': self.validate_counts(),
                'data_integrity': self.validate_data_integrity(),
                'indexes': self.validate_indexes()
            },
            'summary': {
                'total_collections': len(self.mapping['collections']),
                'successful_migrations': 0,
                'failed_migrations': 0,
                'integrity_issues': 0
            }
        }
        
        # Calculate summary
        for collection_name, count_result in report['validation_results']['counts'].items():
            if 'error' in count_result:
                report['summary']['failed_migrations'] += 1
            elif count_result.get('match', False):
                report['summary']['successful_migrations'] += 1
            else:
                report['summary']['failed_migrations'] += 1
        
        for collection_name, integrity_result in report['validation_results']['data_integrity'].items():
            if 'issues_count' in integrity_result:
                report['summary']['integrity_issues'] += integrity_result['issues_count']
        
        return report
    
    def close(self):
        """Close database connections."""
        self.pg_conn.close()
        self.mongo_client.close()

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python validate_migration.py <mapping.json>", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Load mapping
        with open(sys.argv[1], 'r') as f:
            mapping = json.load(f)
        
        # Database parameters
        postgres_params = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': int(os.getenv('POSTGRES_PORT', 5432)),
            'database': os.getenv('POSTGRES_DB', 'remotehive'),
            'user': os.getenv('POSTGRES_USER', 'postgres'),
            'password': os.getenv('POSTGRES_PASSWORD', '')
        }
        
        mongo_host = os.getenv('MONGO_HOST', 'localhost')
        mongo_port = int(os.getenv('MONGO_PORT', 27017))
        mongo_db = os.getenv('MONGO_DB', 'remotehive')
        mongo_user = os.getenv('MONGO_USER', '')
        mongo_password = os.getenv('MONGO_PASSWORD', '')
        
        if mongo_user and mongo_password:
            mongo_uri = f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}/{mongo_db}"
        else:
            mongo_uri = f"mongodb://{mongo_host}:{mongo_port}"
        
        mongo_params = {
            'host': mongo_uri,
            'database': mongo_db
        }
        
        # Create validator
        validator = MigrationValidator(postgres_params, mongo_params, mapping)
        
        # Generate report
        report = validator.generate_report()
        
        # Output report
        print(json.dumps(report, indent=2))
        
        # Cleanup
        validator.close()
        
        # Exit with appropriate code
        if report['summary']['failed_migrations'] == 0 and report['summary']['integrity_issues'] == 0:
            sys.exit(0)
        else:
            sys.exit(1)
            
    except Exception as e:
        print(f"Validation error: {e}", file=sys.stderr)
        sys.exit(1)
EOF

    # Run validation
    if python3 "$MIGRATION_DIR/validate_migration.py" "$mapping_file" > "$validation_report" 2>/dev/null; then
        log "SUCCESS" "Migration validation completed"
        
        # Show summary
        local successful=$(jq '.summary.successful_migrations' "$validation_report")
        local failed=$(jq '.summary.failed_migrations' "$validation_report")
        local issues=$(jq '.summary.integrity_issues' "$validation_report")
        
        log "INFO" "Validation summary: $successful successful, $failed failed, $issues integrity issues"
        
        if [[ "$failed" == "0" && "$issues" == "0" ]]; then
            return 0
        else
            log "WARN" "Migration validation found issues. Check $validation_report for details"
            return 1
        fi
    else
        log "ERROR" "Migration validation failed"
        return 1
    fi
}

# =============================================================================
# Main Functions
# =============================================================================

# Install required dependencies
install_dependencies() {
    log "INFO" "Installing required dependencies..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would install dependencies"
        return 0
    fi
    
    # Check if pip is available
    if ! command -v pip3 >/dev/null 2>&1; then
        log "ERROR" "pip3 not found. Please install Python 3 and pip"
        return 1
    fi
    
    # Install Python packages
    local packages=("psycopg2-binary" "pymongo" "python-dotenv")
    
    for package in "${packages[@]}"; do
        if pip3 show "$package" >/dev/null 2>&1; then
            log "DEBUG" "Package $package already installed"
        else
            log "INFO" "Installing $package..."
            if pip3 install "$package" >/dev/null 2>&1; then
                log "SUCCESS" "Package $package installed"
            else
                log "ERROR" "Failed to install $package"
                return 1
            fi
        fi
    done
    
    # Check database clients
    if ! command -v psql >/dev/null 2>&1; then
        log "WARN" "PostgreSQL client (psql) not found. Some features may not work"
    fi
    
    if ! command -v mongosh >/dev/null 2>&1 && ! command -v mongo >/dev/null 2>&1; then
        log "WARN" "MongoDB client not found. Some features may not work"
    fi
    
    log "SUCCESS" "Dependencies installation completed"
}

# Run complete migration
run_migration() {
    log "INFO" "Starting complete database migration..."
    
    local steps=(
        "install_dependencies"
        "test_postgres_connection"
        "test_mongo_connection"
        "analyze_postgres_schema"
        "generate_mongo_mapping"
        "create_backup"
        "migrate_data"
        "validate_migration"
    )
    
    local total_steps=${#steps[@]}
    local current_step=0
    
    for step in "${steps[@]}"; do
        current_step=$((current_step + 1))
        show_progress "$current_step" "$total_steps" "$step"
        
        if ! "$step"; then
            log "ERROR" "Migration failed at step: $step"
            return 1
        fi
        
        sleep 1  # Brief pause between steps
    done
    
    log "SUCCESS" "Database migration completed successfully"
}

# Show usage information
show_usage() {
    cat << EOF
RemoteHive Database Migration Script

Usage: $0 [OPTIONS] COMMAND

COMMANDS:
    migrate                   Run complete migration
    analyze                   Analyze source schema only
    backup                    Create backup only
    validate                  Validate existing migration
    test-connections          Test database connections

OPTIONS:
    -e, --environment <env>   Environment (development|staging|production)
    -b, --batch-size <size>   Batch size for data migration (default: 1000)
    -v, --verbose             Enable verbose output
    -d, --dry-run             Show what would be done without making changes
    -f, --force               Force operation without confirmation
    -h, --help                Show this help message

ENVIRONMENT VARIABLES:
    PostgreSQL:
        POSTGRES_HOST         PostgreSQL host (default: localhost)
        POSTGRES_PORT         PostgreSQL port (default: 5432)
        POSTGRES_DB           PostgreSQL database name
        POSTGRES_USER         PostgreSQL username
        POSTGRES_PASSWORD     PostgreSQL password
    
    MongoDB:
        MONGO_HOST            MongoDB host (default: localhost)
        MONGO_PORT            MongoDB port (default: 27017)
        MONGO_DB              MongoDB database name
        MONGO_USER            MongoDB username (optional)
        MONGO_PASSWORD        MongoDB password (optional)
    
    Supabase:
        SUPABASE_URL          Supabase project URL
        SUPABASE_ANON_KEY     Supabase anonymous key
        SUPABASE_SERVICE_KEY  Supabase service key

EXAMPLES:
    $0 migrate                        Run complete migration
    $0 analyze --verbose              Analyze schema with verbose output
    $0 test-connections               Test database connections
    $0 migrate --batch-size 500       Migrate with smaller batch size

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -b|--batch-size)
                BATCH_SIZE="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            migrate|analyze|backup|validate|test-connections)
                COMMAND="$1"
                shift
                break
                ;;
            -*)
                log "ERROR" "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                log "ERROR" "Unknown command: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Main function
main() {
    log "INFO" "RemoteHive Database Migration started"
    log "DEBUG" "Environment: $ENVIRONMENT"
    log "DEBUG" "Batch size: $BATCH_SIZE"
    
    # Create necessary directories
    mkdir -p "$MIGRATION_DIR" "$BACKUP_DIR" "$PROJECT_ROOT/tmp"
    
    # Execute command
    case "${COMMAND:-migrate}" in
        "migrate")
            run_migration
            ;;
        "analyze")
            install_dependencies
            test_postgres_connection
            analyze_postgres_schema
            generate_mongo_mapping
            ;;
        "backup")
            install_dependencies
            test_postgres_connection
            create_backup
            ;;
        "validate")
            install_dependencies
            test_postgres_connection
            test_mongo_connection
            validate_migration
            ;;
        "test-connections")
            install_dependencies
            test_postgres_connection
            test_mongo_connection
            test_supabase_connection
            ;;
        *)
            log "ERROR" "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
    
    log "SUCCESS" "Database migration script completed successfully"
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Parse arguments and run main function
    parse_arguments "$@"
    main
fi