-- =============================================================================
-- SUPABASE DATABASE BACKUP AND ROLLBACK PROCEDURES
-- =============================================================================

-- 1. CREATE BACKUP SCHEMA
CREATE SCHEMA IF NOT EXISTS backup_schema;

-- 2. BACKUP ALL TABLES FUNCTION
CREATE OR REPLACE FUNCTION create_full_backup(backup_suffix TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    table_record RECORD;
    backup_name TEXT;
    result_message TEXT := '';
BEGIN
    -- Generate backup suffix if not provided
    IF backup_suffix IS NULL THEN
        backup_suffix := to_char(now(), 'YYYY_MM_DD_HH24_MI_SS');
    END IF;
    
    -- Loop through all public tables
    FOR table_record IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        backup_name := 'backup_' || table_record.tablename || '_' || backup_suffix;
        
        -- Create backup table
        EXECUTE format('CREATE TABLE backup_schema.%I AS SELECT * FROM public.%I', 
                      backup_name, table_record.tablename);
        
        result_message := result_message || 'Backed up: ' || table_record.tablename || ' -> ' || backup_name || E'\n';
    END LOOP;
    
    RETURN 'Backup completed successfully:' || E'\n' || result_message;
END;
$$ LANGUAGE plpgsql;

-- 3. RESTORE FROM BACKUP FUNCTION
CREATE OR REPLACE FUNCTION restore_from_backup(backup_suffix TEXT)
RETURNS TEXT AS $$
DECLARE
    table_record RECORD;
    backup_name TEXT;
    result_message TEXT := '';
BEGIN
    -- Disable RLS temporarily for restore
    SET row_security = off;
    
    -- Loop through all backup tables
    FOR table_record IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'backup_schema' 
        AND tablename LIKE 'backup_%_' || backup_suffix
    LOOP
        -- Extract original table name
        backup_name := table_record.tablename;
        
        -- Get original table name by removing backup prefix and suffix
        DECLARE
            original_table TEXT;
        BEGIN
            original_table := regexp_replace(backup_name, '^backup_(.+)_' || backup_suffix || '$', '\1');
            
            -- Truncate original table
            EXECUTE format('TRUNCATE TABLE public.%I CASCADE', original_table);
            
            -- Restore data
            EXECUTE format('INSERT INTO public.%I SELECT * FROM backup_schema.%I', 
                          original_table, backup_name);
            
            result_message := result_message || 'Restored: ' || backup_name || ' -> ' || original_table || E'\n';
        END;
    END LOOP;
    
    -- Re-enable RLS
    SET row_security = on;
    
    RETURN 'Restore completed successfully:' || E'\n' || result_message;
END;
$$ LANGUAGE plpgsql;

-- 4. LIST AVAILABLE BACKUPS
CREATE OR REPLACE FUNCTION list_backups()
RETURNS TABLE(backup_suffix TEXT, table_count BIGINT, created_date TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        regexp_replace(tablename, '^backup_.+_(.+)$', '\1') as backup_suffix,
        COUNT(*) as table_count,
        to_char(pg_stat_file('base/' || oid || '/' || relfilenode)::timestamp, 'YYYY-MM-DD HH24:MI:SS') as created_date
    FROM pg_tables pt
    JOIN pg_class pc ON pc.relname = pt.tablename
    WHERE pt.schemaname = 'backup_schema'
    AND pt.tablename LIKE 'backup_%'
    GROUP BY backup_suffix, created_date
    ORDER BY created_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. DELETE OLD BACKUPS
CREATE OR REPLACE FUNCTION cleanup_old_backups(days_to_keep INTEGER DEFAULT 30)
RETURNS TEXT AS $$
DECLARE
    table_record RECORD;
    result_message TEXT := '';
BEGIN
    FOR table_record IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'backup_schema'
        AND tablename LIKE 'backup_%'
        AND pg_stat_file('base/' || (SELECT oid FROM pg_class WHERE relname = tablename))::timestamp < (now() - interval '1 day' * days_to_keep)
    LOOP
        EXECUTE format('DROP TABLE backup_schema.%I', table_record.tablename);
        result_message := result_message || 'Deleted old backup: ' || table_record.tablename || E'\n';
    END LOOP;
    
    IF result_message = '' THEN
        result_message := 'No old backups found to delete.';
    END IF;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- USAGE EXAMPLES
-- =============================================================================

-- Create a backup:
-- SELECT create_full_backup();
-- SELECT create_full_backup('pre_migration');

-- List available backups:
-- SELECT * FROM list_backups();

-- Restore from backup:
-- SELECT restore_from_backup('2024_01_20_14_30_00');

-- Cleanup old backups (older than 30 days):
-- SELECT cleanup_old_backups(30);

-- =============================================================================
-- EMERGENCY ROLLBACK PROCEDURE
-- =============================================================================

-- In case of emergency, use this procedure:
-- 1. Identify the backup to restore from: SELECT * FROM list_backups();
-- 2. Restore: SELECT restore_from_backup('your_backup_suffix');
-- 3. Verify data integrity after restore
-- 4. Update application configuration if needed