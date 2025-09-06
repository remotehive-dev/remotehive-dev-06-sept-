// MongoDB initialization script for RemoteHive
// This script runs when MongoDB container starts for the first time

// Switch to the remotehive database
db = db.getSiblingDB('remotehive');

// Create application user with read/write permissions
db.createUser({
  user: 'remotehive_user',
  pwd: 'remotehive_password',
  roles: [
    {
      role: 'readWrite',
      db: 'remotehive'
    }
  ]
});

// Create collections with validation schemas

// Users collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'created_at'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        role: {
          enum: ['job_seeker', 'employer', 'admin']
        },
        is_active: {
          bsonType: 'bool'
        },
        created_at: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Job posts collection
db.createCollection('job_posts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'company', 'created_at'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 1
        },
        company: {
          bsonType: 'string',
          minLength: 1
        },
        status: {
          enum: ['active', 'inactive', 'expired', 'filled']
        },
        job_type: {
          enum: ['full_time', 'part_time', 'contract', 'freelance', 'internship']
        },
        remote_type: {
          enum: ['remote', 'hybrid', 'onsite']
        },
        created_at: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Employers collection
db.createCollection('employers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['company_name', 'created_at'],
      properties: {
        company_name: {
          bsonType: 'string',
          minLength: 1
        },
        is_verified: {
          bsonType: 'bool'
        },
        created_at: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Job applications collection
db.createCollection('job_applications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['job_id', 'user_id', 'created_at'],
      properties: {
        status: {
          enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired']
        },
        created_at: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Create indexes for better performance

// Users indexes
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'role': 1 });
db.users.createIndex({ 'is_active': 1 });
db.users.createIndex({ 'created_at': -1 });

// Job posts indexes
db.job_posts.createIndex({ 'title': 'text', 'description': 'text', 'company': 'text' });
db.job_posts.createIndex({ 'company': 1 });
db.job_posts.createIndex({ 'status': 1 });
db.job_posts.createIndex({ 'job_type': 1 });
db.job_posts.createIndex({ 'remote_type': 1 });
db.job_posts.createIndex({ 'location': 1 });
db.job_posts.createIndex({ 'created_at': -1 });
db.job_posts.createIndex({ 'salary_min': 1, 'salary_max': 1 });
db.job_posts.createIndex({ 'employer_id': 1 });

// Employers indexes
db.employers.createIndex({ 'company_name': 1 });
db.employers.createIndex({ 'user_id': 1 }, { unique: true });
db.employers.createIndex({ 'is_verified': 1 });
db.employers.createIndex({ 'created_at': -1 });

// Job applications indexes
db.job_applications.createIndex({ 'job_id': 1, 'user_id': 1 }, { unique: true });
db.job_applications.createIndex({ 'user_id': 1 });
db.job_applications.createIndex({ 'job_id': 1 });
db.job_applications.createIndex({ 'status': 1 });
db.job_applications.createIndex({ 'created_at': -1 });

// Job seeker profiles indexes
db.job_seeker_profiles.createIndex({ 'user_id': 1 }, { unique: true });
db.job_seeker_profiles.createIndex({ 'skills': 1 });
db.job_seeker_profiles.createIndex({ 'experience_level': 1 });
db.job_seeker_profiles.createIndex({ 'location': 1 });

// Saved jobs indexes
db.saved_jobs.createIndex({ 'user_id': 1, 'job_id': 1 }, { unique: true });
db.saved_jobs.createIndex({ 'user_id': 1 });
db.saved_jobs.createIndex({ 'created_at': -1 });

// Job alerts indexes
db.job_alerts.createIndex({ 'user_id': 1 });
db.job_alerts.createIndex({ 'is_active': 1 });
db.job_alerts.createIndex({ 'keywords': 1 });
db.job_alerts.createIndex({ 'location': 1 });

// Create default admin user
db.users.insertOne({
  email: 'admin@remotehive.in',
  password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/...',  // Ranjeet11$
  role: 'admin',
  is_active: true,
  is_verified: true,
  first_name: 'Admin',
  last_name: 'User',
  created_at: new Date(),
  updated_at: new Date()
});

print('RemoteHive database initialized successfully!');
print('Created collections: users, job_posts, employers, job_applications');
print('Created indexes for optimal performance');
print('Created default admin user: admin@remotehive.in');
print('Database setup complete!');