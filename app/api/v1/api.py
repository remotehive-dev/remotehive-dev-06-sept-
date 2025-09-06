from fastapi import APIRouter
from app.api.v1.endpoints import users, jobs, employers, job_seekers, applications, admin, notifications, payments, cms, contact, contact_info, location, auth_endpoints, companies, job_workflow, advanced_job_workflow, clerk_auth_endpoints, support_endpoints, email_management, email_users, health, csv_upload, website_management, ml_intelligence, memory_loader, websocket, slack_admin, scraper_configs
from app.autoscraper import endpoints as autoscraper_endpoints

api_router = APIRouter()

# RBAC Authentication routes (unified system)
api_router.include_router(auth_endpoints.router, prefix="/auth", tags=["authentication"])

# Clerk Authentication routes
api_router.include_router(clerk_auth_endpoints.router, prefix="/clerk", tags=["clerk-auth"])

# User management routes
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Employer routes
api_router.include_router(employers.router, prefix="/employers", tags=["employers"])

# Company routes (public)
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])

# Job seeker routes
api_router.include_router(job_seekers.router, prefix="/job-seekers", tags=["job-seekers"])

# Job posting routes
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])

# Job workflow routes
api_router.include_router(job_workflow.router, prefix="/jobs", tags=["job-workflow"])

# Job application routes
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])

# Admin routes
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

# Advanced workflow routes
api_router.include_router(advanced_job_workflow.router, prefix="/admin/workflow", tags=["advanced-workflow"])

# Scraper configuration routes
api_router.include_router(scraper_configs.router, prefix="/scraper", tags=["scraper-configs"])

# AutoScraper routes
api_router.include_router(autoscraper_endpoints.router, prefix="/autoscraper", tags=["autoscraper"])

# Notification routes
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

# Payment routes
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])

# CMS routes
api_router.include_router(cms.router, prefix="/cms", tags=["cms"])

# Contact routes
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])

# Contact information routes
api_router.include_router(contact_info.router, prefix="/admin", tags=["contact-info"])

# Location services routes
api_router.include_router(location.router, prefix="/location", tags=["location"])

# Support routes
api_router.include_router(support_endpoints.router, prefix="/support", tags=["support"])

# Email management routes
api_router.include_router(email_management.router, prefix="/admin/email", tags=["email-management"])

# Email users management routes
api_router.include_router(email_users.router, prefix="/admin/email-users", tags=["email-users"])

# Health check and monitoring routes
api_router.include_router(health.router, prefix="/health", tags=["health"])

# CSV upload and import routes
api_router.include_router(csv_upload.router, prefix="/admin/csv", tags=["csv-import"])



# Website management routes
api_router.include_router(website_management.router, prefix="/admin/websites", tags=["website-management"])

# ML Intelligence routes
api_router.include_router(ml_intelligence.router, prefix="/ml", tags=["ml-intelligence"])

# Memory Loader routes
api_router.include_router(memory_loader.router, prefix="/memory", tags=["memory-loader"])

# Scraper Orchestrator and Session Manager routes removed during N8N cleanup

# WebSocket routes
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
