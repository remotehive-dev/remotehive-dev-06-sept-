// MongoDB initialization script for testing environment
// This script creates the test database and sets up initial collections

print('Starting MongoDB test database initialization...');

// Switch to the test database
db = db.getSiblingDB('remotehive_test');

// Create admin user for the test database
db.createUser({
  user: 'admin',
  pwd: 'password123',
  roles: [
    {
      role: 'readWrite',
      db: 'remotehive_test'
    },
    {
      role: 'dbAdmin',
      db: 'remotehive_test'
    }
  ]
});

print('Test database admin user created successfully.');

// Create collections with initial indexes
print('Creating collections and indexes...');

// Users collection
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "created_at": 1 });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "is_active": 1 });

// Jobs collection
db.createCollection('jobs');
db.jobs.createIndex({ "title": "text", "description": "text", "company": "text" });
db.jobs.createIndex({ "company": 1 });
db.jobs.createIndex({ "location": 1 });
db.jobs.createIndex({ "job_type": 1 });
db.jobs.createIndex({ "salary_min": 1, "salary_max": 1 });
db.jobs.createIndex({ "created_at": 1 });
db.jobs.createIndex({ "updated_at": 1 });
db.jobs.createIndex({ "is_active": 1 });
db.jobs.createIndex({ "remote_type": 1 });
db.jobs.createIndex({ "experience_level": 1 });
db.jobs.createIndex({ "skills": 1 });

// Companies collection
db.createCollection('companies');
db.companies.createIndex({ "name": 1 }, { unique: true });
db.companies.createIndex({ "slug": 1 }, { unique: true });
db.companies.createIndex({ "industry": 1 });
db.companies.createIndex({ "size": 1 });
db.companies.createIndex({ "location": 1 });
db.companies.createIndex({ "created_at": 1 });

// Applications collection
db.createCollection('applications');
db.applications.createIndex({ "user_id": 1, "job_id": 1 }, { unique: true });
db.applications.createIndex({ "user_id": 1 });
db.applications.createIndex({ "job_id": 1 });
db.applications.createIndex({ "status": 1 });
db.applications.createIndex({ "created_at": 1 });
db.applications.createIndex({ "updated_at": 1 });

// Saved jobs collection
db.createCollection('saved_jobs');
db.saved_jobs.createIndex({ "user_id": 1, "job_id": 1 }, { unique: true });
db.saved_jobs.createIndex({ "user_id": 1 });
db.saved_jobs.createIndex({ "created_at": 1 });

// User profiles collection
db.createCollection('user_profiles');
db.user_profiles.createIndex({ "user_id": 1 }, { unique: true });
db.user_profiles.createIndex({ "skills": 1 });
db.user_profiles.createIndex({ "experience_level": 1 });
db.user_profiles.createIndex({ "location": 1 });
db.user_profiles.createIndex({ "job_preferences.remote_type": 1 });
db.user_profiles.createIndex({ "job_preferences.job_type": 1 });

// Notifications collection
db.createCollection('notifications');
db.notifications.createIndex({ "user_id": 1 });
db.notifications.createIndex({ "is_read": 1 });
db.notifications.createIndex({ "created_at": 1 });
db.notifications.createIndex({ "type": 1 });

// Job alerts collection
db.createCollection('job_alerts');
db.job_alerts.createIndex({ "user_id": 1 });
db.job_alerts.createIndex({ "is_active": 1 });
db.job_alerts.createIndex({ "created_at": 1 });
db.job_alerts.createIndex({ "criteria.keywords": 1 });
db.job_alerts.createIndex({ "criteria.location": 1 });

// Analytics collection
db.createCollection('analytics');
db.analytics.createIndex({ "event_type": 1 });
db.analytics.createIndex({ "timestamp": 1 });
db.analytics.createIndex({ "user_id": 1 });
db.analytics.createIndex({ "job_id": 1 });

// Sessions collection
db.createCollection('sessions');
db.sessions.createIndex({ "session_id": 1 }, { unique: true });
db.sessions.createIndex({ "user_id": 1 });
db.sessions.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 });

// API keys collection
db.createCollection('api_keys');
db.api_keys.createIndex({ "key_hash": 1 }, { unique: true });
db.api_keys.createIndex({ "user_id": 1 });
db.api_keys.createIndex({ "is_active": 1 });
db.api_keys.createIndex({ "created_at": 1 });

print('Collections and indexes created successfully.');

// Insert test data
print('Inserting test data...');

// Test admin user
db.users.insertOne({
  _id: ObjectId(),
  email: 'admin@remotehive.in',
  username: 'admin',
  password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5/Qe2', // Ranjeet11$
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  is_active: true,
  is_verified: true,
  created_at: new Date(),
  updated_at: new Date()
});

// Test regular user
db.users.insertOne({
  _id: ObjectId(),
  email: 'testuser@example.com',
  username: 'testuser',
  password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5/Qe2', // password123
  first_name: 'Test',
  last_name: 'User',
  role: 'user',
  is_active: true,
  is_verified: true,
  created_at: new Date(),
  updated_at: new Date()
});

// Test employer user
db.users.insertOne({
  _id: ObjectId(),
  email: 'employer@example.com',
  username: 'testemployer',
  password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5/Qe2', // password123
  first_name: 'Test',
  last_name: 'Employer',
  role: 'employer',
  is_active: true,
  is_verified: true,
  created_at: new Date(),
  updated_at: new Date()
});

// Test company
var testCompanyId = ObjectId();
db.companies.insertOne({
  _id: testCompanyId,
  name: 'Test Company Inc.',
  slug: 'test-company-inc',
  description: 'A test company for integration testing',
  website: 'https://testcompany.com',
  industry: 'Technology',
  size: '51-200',
  location: 'San Francisco, CA',
  logo_url: 'https://example.com/logo.png',
  is_verified: true,
  created_at: new Date(),
  updated_at: new Date()
});

// Test job
db.jobs.insertOne({
  _id: ObjectId(),
  title: 'Senior Software Engineer',
  description: 'We are looking for a senior software engineer to join our team.',
  company: 'Test Company Inc.',
  company_id: testCompanyId,
  location: 'San Francisco, CA',
  remote_type: 'fully_remote',
  job_type: 'full_time',
  experience_level: 'senior',
  salary_min: 120000,
  salary_max: 180000,
  currency: 'USD',
  skills: ['Python', 'FastAPI', 'MongoDB', 'Docker', 'Kubernetes'],
  requirements: [
    '5+ years of software development experience',
    'Experience with Python and FastAPI',
    'Knowledge of containerization technologies'
  ],
  benefits: [
    'Health insurance',
    'Remote work',
    'Flexible hours',
    'Stock options'
  ],
  is_active: true,
  featured: false,
  views_count: 0,
  applications_count: 0,
  created_at: new Date(),
  updated_at: new Date(),
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
});

// Test job 2
db.jobs.insertOne({
  _id: ObjectId(),
  title: 'Frontend Developer',
  description: 'Join our team as a frontend developer working with React and TypeScript.',
  company: 'Test Company Inc.',
  company_id: testCompanyId,
  location: 'Remote',
  remote_type: 'fully_remote',
  job_type: 'full_time',
  experience_level: 'mid',
  salary_min: 80000,
  salary_max: 120000,
  currency: 'USD',
  skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
  requirements: [
    '3+ years of frontend development experience',
    'Strong knowledge of React and TypeScript',
    'Experience with modern frontend tooling'
  ],
  benefits: [
    'Health insurance',
    'Remote work',
    'Professional development budget'
  ],
  is_active: true,
  featured: true,
  views_count: 0,
  applications_count: 0,
  created_at: new Date(),
  updated_at: new Date(),
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
});

print('Test data inserted successfully.');

// Create compound indexes for better query performance
print('Creating compound indexes...');

db.jobs.createIndex({ "is_active": 1, "created_at": -1 });
db.jobs.createIndex({ "remote_type": 1, "job_type": 1, "is_active": 1 });
db.jobs.createIndex({ "experience_level": 1, "is_active": 1, "created_at": -1 });
db.jobs.createIndex({ "company_id": 1, "is_active": 1 });
db.jobs.createIndex({ "featured": 1, "is_active": 1, "created_at": -1 });

db.applications.createIndex({ "user_id": 1, "status": 1, "created_at": -1 });
db.applications.createIndex({ "job_id": 1, "status": 1, "created_at": -1 });

db.notifications.createIndex({ "user_id": 1, "is_read": 1, "created_at": -1 });

print('Compound indexes created successfully.');

// Set up TTL indexes for cleanup
print('Setting up TTL indexes...');

// Sessions expire automatically
db.sessions.createIndex({ "created_at": 1 }, { expireAfterSeconds: 86400 }); // 24 hours

// Analytics data cleanup (keep for 90 days)
db.analytics.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Notifications cleanup (keep for 30 days)
db.notifications.createIndex({ "created_at": 1 }, { expireAfterSeconds: 2592000 }); // 30 days

print('TTL indexes created successfully.');

// Create views for common queries
print('Creating database views...');

// Active jobs view
db.createView('active_jobs', 'jobs', [
  {
    $match: {
      is_active: true,
      expires_at: { $gt: new Date() }
    }
  },
  {
    $lookup: {
      from: 'companies',
      localField: 'company_id',
      foreignField: '_id',
      as: 'company_info'
    }
  },
  {
    $unwind: '$company_info'
  },
  {
    $project: {
      title: 1,
      description: 1,
      location: 1,
      remote_type: 1,
      job_type: 1,
      experience_level: 1,
      salary_min: 1,
      salary_max: 1,
      currency: 1,
      skills: 1,
      featured: 1,
      created_at: 1,
      expires_at: 1,
      'company_info.name': 1,
      'company_info.logo_url': 1,
      'company_info.location': 1
    }
  }
]);

// Recent applications view
db.createView('recent_applications', 'applications', [
  {
    $match: {
      created_at: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    }
  },
  {
    $lookup: {
      from: 'jobs',
      localField: 'job_id',
      foreignField: '_id',
      as: 'job_info'
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'user_id',
      foreignField: '_id',
      as: 'user_info'
    }
  },
  {
    $unwind: '$job_info'
  },
  {
    $unwind: '$user_info'
  },
  {
    $project: {
      status: 1,
      created_at: 1,
      'job_info.title': 1,
      'job_info.company': 1,
      'user_info.email': 1,
      'user_info.first_name': 1,
      'user_info.last_name': 1
    }
  }
]);

print('Database views created successfully.');

print('MongoDB test database initialization completed successfully!');
print('Database: remotehive_test');
print('Admin user: admin / password123');
print('Test users created: admin@remotehive.in, testuser@example.com, employer@example.com');
print('Sample jobs and company data inserted.');
print('All indexes and views created.');