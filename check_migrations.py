#!/usr/bin/env python3
from app.database.migrations import MigrationManager

mm = MigrationManager()
print('Current revision:', mm.get_current_revision())
print('\nMigration History:')
history = mm.get_migration_history()
for h in history:
    print(f'{h.get("revision", "N/A")}: {h.get("message", "N/A")}')