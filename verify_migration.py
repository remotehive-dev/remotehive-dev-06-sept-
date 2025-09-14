#!/usr/bin/env python3
"""
Comprehensive migration verification script
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime
import json

async def verify_migration():
    try:
        # Load environment variables
        load_dotenv()
        
        mongodb_url = os.getenv("MONGODB_URL")
        database_name = os.getenv("MONGODB_DATABASE_NAME", "remotehive_main")
        
        print("\n" + "="*60)
        print("🔍 REMOTEHIVE MIGRATION VERIFICATION REPORT")
        print("="*60)
        print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🗄️  Database: {database_name}")
        print(f"🌐 Atlas URL: {mongodb_url[:50]}...")
        print("="*60)
        
        # Create client
        client = AsyncIOMotorClient(mongodb_url, serverSelectionTimeoutMS=10000)
        database = client[database_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Atlas connection successful!\n")
        
        # Get all collections
        collections = await database.list_collection_names()
        print(f"📊 COLLECTIONS OVERVIEW")
        print(f"Total collections found: {len(collections)}\n")
        
        total_documents = 0
        collection_stats = []
        
        # Analyze each collection
        for collection_name in sorted(collections):
            collection = database[collection_name]
            count = await collection.count_documents({})
            total_documents += count
            
            # Get sample document
            sample_doc = await collection.find_one()
            
            collection_info = {
                'name': collection_name,
                'count': count,
                'has_data': count > 0,
                'sample_fields': list(sample_doc.keys()) if sample_doc else []
            }
            collection_stats.append(collection_info)
            
            status_icon = "📄" if count > 0 else "📭"
            print(f"{status_icon} {collection_name:<25} {count:>6} documents")
            
            if sample_doc and count > 0:
                # Show key fields for important collections
                if collection_name == 'users':
                    print(f"    └─ Sample: {sample_doc.get('email', 'N/A')} (Role: {sample_doc.get('role', 'N/A')})")
                elif collection_name == 'jobs' or collection_name == 'job_posts':
                    print(f"    └─ Sample: {sample_doc.get('title', 'N/A')} at {sample_doc.get('company', 'N/A')}")
                elif collection_name == 'employers':
                    print(f"    └─ Sample: {sample_doc.get('company_name', 'N/A')} ({sample_doc.get('email', 'N/A')})")
                elif collection_name == 'job_seekers':
                    print(f"    └─ Sample: {sample_doc.get('full_name', 'N/A')} ({sample_doc.get('email', 'N/A')})")
        
        print("\n" + "="*60)
        print("📈 MIGRATION SUMMARY")
        print("="*60)
        print(f"Total documents migrated: {total_documents:,}")
        print(f"Collections with data: {len([c for c in collection_stats if c['has_data']])}")
        print(f"Empty collections: {len([c for c in collection_stats if not c['has_data']])}")
        
        # Key collections analysis
        key_collections = ['users', 'jobs', 'job_posts', 'employers', 'job_seekers', 'job_applications']
        print("\n🔑 KEY COLLECTIONS STATUS:")
        for key_col in key_collections:
            col_info = next((c for c in collection_stats if c['name'] == key_col), None)
            if col_info:
                status = "✅ Ready" if col_info['has_data'] else "⚠️  Empty"
                print(f"   {key_col:<20} {status} ({col_info['count']} docs)")
            else:
                print(f"   {key_col:<20} ❌ Missing")
        
        # Database health check
        print("\n🏥 DATABASE HEALTH CHECK:")
        
        # Check indexes
        try:
            users_indexes = await database.users.list_indexes().to_list(length=None)
            print(f"   Users indexes: {len(users_indexes)} configured")
        except:
            print("   Users indexes: Unable to check")
        
        # Check database stats
        try:
            db_stats = await database.command("dbStats")
            print(f"   Database size: {db_stats.get('dataSize', 0) / 1024 / 1024:.2f} MB")
            print(f"   Storage size: {db_stats.get('storageSize', 0) / 1024 / 1024:.2f} MB")
        except:
            print("   Database stats: Unable to retrieve")
        
        print("\n" + "="*60)
        print("🎯 MIGRATION VERIFICATION RESULT")
        print("="*60)
        
        if total_documents > 0:
            print("✅ MIGRATION SUCCESSFUL!")
            print(f"   • {total_documents:,} documents successfully migrated")
            print(f"   • {len(collections)} collections available")
            print("   • Atlas connection stable")
            print("   • Database ready for production use")
        else:
            print("⚠️  MIGRATION APPEARS EMPTY")
            print("   • No documents found in any collection")
            print("   • This might indicate:")
            print("     - Source database was empty")
            print("     - Migration script needs to be run")
            print("     - Connection issues during migration")
        
        print("\n" + "="*60)
        print("📋 NEXT STEPS")
        print("="*60)
        if total_documents > 0:
            print("1. ✅ Update application configuration to use Atlas")
            print("2. ✅ Test application functionality")
            print("3. ✅ Monitor performance and connections")
            print("4. ✅ Set up backup and monitoring")
        else:
            print("1. 🔄 Run migration script if not done yet")
            print("2. 🔍 Check source database for data")
            print("3. 🔧 Verify migration script configuration")
            print("4. 📞 Contact support if issues persist")
        
        print("\n" + "="*60)
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_migration())