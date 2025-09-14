from dotenv import load_dotenv
load_dotenv()

import os
from pymongo import MongoClient

# Connect to Atlas
client = MongoClient(os.getenv('MONGODB_URL'))

# Check the remotehive_main database (where the actual data is)
print('=== RemoteHive Main Database (Actual Data) ===')
db = client['remotehive_main']
collections = db.list_collection_names()
print(f'Collections in remotehive_main: {len(collections)}')

total_docs = 0
for col in sorted(collections):
    count = db[col].count_documents({})
    total_docs += count
    print(f'{col}: {count} documents')
    
    # Show sample document for collections with data
    if count > 0:
        sample = db[col].find_one()
        if sample:
            # Show just the keys to understand structure
            keys = list(sample.keys())
            print(f'  Sample keys: {keys[:5]}...' if len(keys) > 5 else f'  Sample keys: {keys}')
            
            # For users, show more details
            if col == 'users':
                print(f'  Sample user: {sample.get("email", "N/A")} - Role: {sample.get("role", "N/A")}')

print(f'\nTotal documents in remotehive_main: {total_docs}')

# Also check other databases
print('\n=== Other Databases Summary ===')
for db_name in ['remotehive', 'remotehive_autoscraper', 'remotehive_jobs']:
    db = client[db_name]
    collections = db.list_collection_names()
    total_docs_db = sum(db[col].count_documents({}) for col in collections)
    print(f'{db_name}: {len(collections)} collections, {total_docs_db} total documents')

client.close()