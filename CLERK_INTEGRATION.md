# Clerk Authentication Integration

This document explains how to integrate Clerk authentication with the RemoteHive API for both employers and job seekers.

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Clerk Authentication Settings
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_FRONTEND_API_URL=https://api.clerk.dev
CLERK_API_VERSION=v1
```

### 2. Database Migration

Run the database migration to add Clerk support:

```bash
cd app/database
alembic upgrade head
```

## API Endpoints

### Configuration

**GET** `/api/v1/clerk/config`

Returns Clerk configuration for frontend initialization.

**Response:**
```json
{
  "publishable_key": "pk_test_...",
  "frontend_api_url": "https://api.clerk.dev"
}
```

### Employer Signup

**POST** `/api/v1/clerk/employer/signup`

**Request:**
```json
{
  "email": "employer@company.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "company_name": "Tech Corp",
  "company_email": "contact@techcorp.com",
  "company_phone": "+1234567890",
  "company_website": "https://techcorp.com",
  "industry": "Technology",
  "company_size": "50-100",
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "user_id": "user_123",
  "clerk_user_id": "clerk_456",
  "email": "employer@company.com",
  "role": "employer",
  "employer_profile": {
    "id": "emp_789",
    "company_name": "Tech Corp",
    "employer_number": "RH001234"
  }
}
```

### Job Seeker Signup

**POST** `/api/v1/clerk/job-seeker/signup`

**Request:**
```json
{
  "email": "jobseeker@email.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "current_title": "Software Developer",
  "experience_level": "mid",
  "years_of_experience": 5,
  "skills": ["Python", "JavaScript", "React"],
  "preferred_job_types": ["full-time", "remote"],
  "remote_work_preference": true,
  "min_salary": 80000,
  "max_salary": 120000
}
```

**Response:**
```json
{
  "user_id": "user_123",
  "clerk_user_id": "clerk_456",
  "email": "jobseeker@email.com",
  "role": "job_seeker",
  "job_seeker_profile": {
    "id": 1,
    "current_title": "Software Developer",
    "experience_level": "mid"
  }
}
```

### Profile Completion

**POST** `/api/v1/clerk/employer/complete-profile`

**Headers:**
```
Authorization: Bearer <clerk_session_token>
```

**Request:**
```json
{
  "company_description": "We are a leading tech company...",
  "company_logo": "https://example.com/logo.png"
}
```

**POST** `/api/v1/clerk/job-seeker/complete-profile`

**Headers:**
```
Authorization: Bearer <clerk_session_token>
```

**Request:**
```json
{
  "education_level": "Bachelor's",
  "field_of_study": "Computer Science",
  "university": "Stanford University",
  "graduation_year": 2020,
  "resume_url": "https://example.com/resume.pdf",
  "portfolio_url": "https://portfolio.example.com"
}
```

### Get Profile

**GET** `/api/v1/clerk/profile`

**Headers:**
```
Authorization: Bearer <clerk_session_token>
```

**Response (Employer):**
```json
{
  "user": {
    "id": "user_123",
    "email": "employer@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "employer"
  },
  "profile": {
    "id": "emp_789",
    "company_name": "Tech Corp",
    "employer_number": "RH001234",
    "company_email": "contact@techcorp.com",
    "industry": "Technology"
  }
}
```

## Frontend Integration Example

### React with Clerk

```javascript
import { ClerkProvider, SignIn, SignUp, useUser } from '@clerk/nextjs'

// 1. Wrap your app with ClerkProvider
function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <Component {...pageProps} />
    </ClerkProvider>
  )
}

// 2. Create signup component
function EmployerSignup() {
  const { user } = useUser()
  
  const handleSignup = async (formData) => {
    const response = await fetch('/api/v1/clerk/employer/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await user.getToken()}`
      },
      body: JSON.stringify(formData)
    })
    
    const result = await response.json()
    console.log('Signup successful:', result)
  }
  
  return (
    <div>
      <SignUp />
      {/* Your custom signup form */}
    </div>
  )
}

// 3. Protected routes
function ProtectedPage() {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded) return <div>Loading...</div>
  if (!user) return <SignIn />
  
  return <div>Welcome, {user.firstName}!</div>
}
```

### Authentication Flow

1. **Frontend Setup**: Initialize Clerk in your frontend application
2. **User Registration**: User signs up through Clerk UI
3. **Profile Creation**: Call RemoteHive API to create user profile
4. **Authentication**: Use Clerk session tokens for API requests
5. **Profile Management**: Update profiles through RemoteHive API

## Security Notes

- Always validate Clerk session tokens on the backend
- Use HTTPS in production
- Store sensitive data (like Clerk secret key) securely
- Implement proper error handling for authentication failures

## Testing

Use Clerk's test environment for development:

1. Create a Clerk application in test mode
2. Use test publishable and secret keys
3. Test signup/signin flows with test users
4. Verify API integration with valid session tokens

## Production Deployment

1. Switch to Clerk production keys
2. Update environment variables
3. Run database migrations
4. Test authentication flows
5. Monitor authentication metrics