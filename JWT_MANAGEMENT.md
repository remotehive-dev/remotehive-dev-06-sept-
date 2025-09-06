# JWT Secret Key Management

## Overview

This document outlines the proper management of JWT secret keys across the RemoteHive microservices architecture. Consistent JWT secret keys are critical for cross-service authentication.

## Current Implementation

As of the latest update, all services share a single JWT secret key for token validation:

- Main Service
- Autoscraper Service
- Admin Service

## Key Management Rules

1. **Single Source of Truth**: The main service's `.env` file contains the master JWT secret key.

2. **Key Synchronization**: When updating the JWT secret key, it MUST be updated in ALL services simultaneously.

3. **Environment-Specific Keys**: 
   - Production: Use the secure key in all production environment files
   - Staging: Use staging-specific keys
   - Development: Use development-specific keys

4. **Key Rotation**: 
   - Rotate keys every 90 days
   - Generate new keys using a secure method (see below)
   - Update all services during a maintenance window

## Generating New JWT Secret Keys

Use the following command to generate a secure random key:

```bash
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```

## Files to Update When Rotating Keys

1. Main Service:
   - `.env`
   - `.env.production` (if exists)
   - `.env.staging` (if exists)
   - `.env.development` (if exists)

2. Autoscraper Service:
   - `.env`
   - `.env.production`
   - `.env.staging`
   - `.env.development`

3. Admin Service:
   - `.env` (if exists)
   - Any other environment-specific files

## Troubleshooting Authentication Issues

If authentication fails between services:

1. Verify JWT secret keys match across all services
2. Check JWT algorithm settings (should be HS256)
3. Verify token expiration settings are appropriate
4. Ensure clock synchronization between services

## Security Best Practices

1. Never commit JWT secret keys to version control
2. Use environment variables or secure secret management services
3. Limit access to production environment files
4. Monitor for unauthorized token usage

---

Last Updated: JWT keys synchronized across all services with a new secure key