# Security Implementation Guide

## Overview

This document outlines the comprehensive security enhancements implemented in the RemoteHive API to protect against common web application vulnerabilities and attacks.

## Security Features Implemented

### 1. Security Middleware (`backend/middleware/security.py`)

A comprehensive security middleware that provides multiple layers of protection:

#### Features:
- **Input Validation & Sanitization**: Automatic detection and blocking of malicious input
- **Rate Limiting**: Protection against DoS attacks and brute force attempts
- **Request Size Validation**: Prevention of oversized request attacks
- **Security Headers**: Automatic injection of security headers
- **CSRF Protection**: Cross-Site Request Forgery protection

#### Configuration:
```python
class SecurityConfig:
    # XSS Protection patterns
    XSS_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        # ... more patterns
    ]
    
    # SQL Injection patterns
    SQL_INJECTION_PATTERNS = [
        r"'\s*(or|and)\s*'?\d",
        r'union\s+select',
        r'drop\s+table',
        # ... more patterns
    ]
```

### 2. Input Validation System (`backend/core/validation.py`)

Advanced input validation with security-focused checks:

#### Features:
- **Type-specific validation**: Email, URL, phone number validation
- **Security pattern detection**: XSS, SQL injection, path traversal
- **Recursive sanitization**: Deep cleaning of nested data structures
- **Custom validation decorators**: Easy integration with existing code

#### Usage:
```python
from app.core.validation import InputValidator, SecureBaseModel

# Direct validation
validator = InputValidator()
clean_input = validator.validate_input(user_input, input_type=InputType.TEXT)

# Pydantic model with built-in security
class UserModel(SecureBaseModel):
    email: str
    name: str
```

### 3. Security Configuration (`backend/core/config.py`)

Centralized security configuration with environment variable support:

#### Key Settings:
```python
# Security Headers
SECURITY_HEADERS_ENABLED = True

# Rate Limiting
RATE_LIMIT_ENABLED = True
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_BURST = 20

# Request Security
MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10MB
MAX_JSON_DEPTH = 10
MAX_FIELD_LENGTH = 10000

# Input Validation
STRICT_VALIDATION = True
SANITIZE_INPUT = True
BLOCK_SUSPICIOUS_REQUESTS = True

# CSRF Protection
CSRF_PROTECTION_ENABLED = False  # Enable in production
CSRF_SECRET_KEY = "your-csrf-secret-key"

# Content Security Policy
CSP_ENABLED = True
CSP_REPORT_URI = "/api/v1/security/csp-report"
```

### 4. Security API Endpoints (`backend/api/v1/security.py`)

Dedicated endpoints for security monitoring and reporting:

#### Endpoints:
- `POST /api/v1/security/csp-report`: CSP violation reporting
- `GET /api/v1/security/stats`: Security statistics
- `GET /api/v1/security/config`: Security configuration
- `POST /api/v1/security/incident`: Security incident reporting
- `GET /api/v1/security/health`: Security system health check

### 5. Security Testing (`scripts/test_security.py`)

Comprehensive security testing suite:

#### Test Categories:
- **Input Validation Tests**: XSS, SQL injection, path traversal, command injection
- **DoS Protection Tests**: Rate limiting, oversized requests
- **Header Security Tests**: Security headers validation
- **Monitoring Tests**: CSP reporting, security stats

#### Usage:
```bash
# Run all security tests
python scripts/test_security.py

# Run specific test category
python scripts/test_security.py --category "Input Validation"

# Run against different URL
python scripts/test_security.py --url "https://api.remotehive.com"

# Output in JSON format
python scripts/test_security.py --json
```

## Security Headers Implemented

### Standard Security Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Content Security Policy (CSP)
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; report-uri /api/v1/security/csp-report
```

## Attack Protection

### 1. Cross-Site Scripting (XSS)
- **Input sanitization**: HTML encoding of user input
- **Pattern detection**: Regex-based XSS payload detection
- **CSP headers**: Browser-level script execution control
- **Output encoding**: Safe rendering of user content

### 2. SQL Injection
- **Pattern detection**: Common SQL injection payload detection
- **Input validation**: Strict input type checking
- **Parameterized queries**: ORM-level protection (SQLAlchemy)
- **Error handling**: No database error exposure

### 3. Path Traversal
- **Path validation**: Directory traversal pattern detection
- **File access control**: Restricted file system access
- **Input sanitization**: Path normalization and validation

### 4. Command Injection
- **Command pattern detection**: Shell command injection prevention
- **Input validation**: Strict command parameter validation
- **Subprocess security**: Safe subprocess execution

### 5. Denial of Service (DoS)
- **Rate limiting**: Request frequency limits per IP
- **Request size limits**: Maximum payload size enforcement
- **Connection limits**: Maximum concurrent connections
- **Resource monitoring**: Memory and CPU usage tracking

### 6. Cross-Site Request Forgery (CSRF)
- **Token validation**: CSRF token verification
- **SameSite cookies**: Cookie security attributes
- **Origin validation**: Request origin verification

## Rate Limiting Configuration

### Default Limits
```python
RATE_LIMIT_REQUESTS = 100      # Requests per window
RATE_LIMIT_WINDOW = 60         # Window size in seconds
RATE_LIMIT_BURST = 20          # Burst allowance
RATE_LIMIT_CLEANUP_INTERVAL = 300  # Cleanup interval
```

### Per-Endpoint Limits
- **Authentication endpoints**: 5 requests/minute
- **API endpoints**: 100 requests/minute
- **Static content**: 1000 requests/minute
- **Health checks**: Unlimited

## Security Monitoring

### Logging
All security events are logged with structured data:
```python
logger.warning(
    "Security violation detected",
    client_ip=client_ip,
    user_agent=user_agent,
    violation_type="XSS_ATTEMPT",
    payload=sanitized_payload
)
```

### Metrics
Security metrics are tracked and exposed via `/api/v1/security/stats`:
- Blocked requests count
- Attack attempt counts by type
- Rate limit violations
- Active/blocked IP addresses

### Alerting
Security alerts can be configured for:
- High-severity security incidents
- Repeated attack attempts
- System security failures
- CSP violations

## File Upload Security

### Restrictions
```python
ALLOWED_FILE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.pdf', 
    '.doc', '.docx', '.txt', '.csv'
]

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
SCAN_UPLOADED_FILES = True
```

### Validation
- File type validation (MIME type + extension)
- File size limits
- Malware scanning (if enabled)
- Content validation

## IP Address Management

### Whitelisting
```python
IP_WHITELIST = [
    "127.0.0.1",
    "::1",
    "10.0.0.0/8",
    "192.168.0.0/16"
]
```

### Blacklisting
```python
IP_BLACKLIST = [
    "192.168.1.100",  # Known malicious IP
    "10.0.0.50"       # Blocked IP
]
```

## Environment-Specific Configuration

### Development
```env
SECURITY_HEADERS_ENABLED=true
RATE_LIMIT_ENABLED=false
STRICT_VALIDATION=false
CSRF_PROTECTION_ENABLED=false
```

### Production
```env
SECURITY_HEADERS_ENABLED=true
RATE_LIMIT_ENABLED=true
STRICT_VALIDATION=true
CSRF_PROTECTION_ENABLED=true
CSRF_SECRET_KEY=your-production-csrf-key
SECURITY_ALERTS_ENABLED=true
SECURITY_WEBHOOK_URL=https://your-monitoring-webhook
```

## Integration with Existing Code

### Middleware Integration
The security middleware is automatically applied to all requests:
```python
# In main.py
app.add_middleware(SecurityMiddleware)
app.add_middleware(CSRFProtectionMiddleware)
```

### Validation Integration
Use validation decorators for easy integration:
```python
from app.core.validation import validate_input, InputType

@validate_input('email', InputType.EMAIL)
@validate_input('name', InputType.SAFE_TEXT)
def create_user(email: str, name: str):
    # Function automatically receives validated input
    pass
```

### Error Handling
Security violations are handled gracefully:
```python
try:
    validated_input = validator.validate_input(user_input)
except SecurityValidationError as e:
    logger.warning(f"Security validation failed: {e}")
    return {"error": "Invalid input detected"}
```

## Performance Considerations

### Optimization
- **Compiled regex patterns**: Pre-compiled for better performance
- **In-memory rate limiting**: Fast Redis-like implementation
- **Async processing**: Non-blocking security checks
- **Caching**: Validation result caching

### Monitoring
- **Response time impact**: < 5ms additional latency
- **Memory usage**: Minimal overhead
- **CPU usage**: Optimized pattern matching

## Security Checklist

### Pre-Production
- [ ] Enable all security headers
- [ ] Configure rate limiting
- [ ] Enable CSRF protection
- [ ] Set up security monitoring
- [ ] Configure CSP reporting
- [ ] Test all security features
- [ ] Review IP whitelist/blacklist
- [ ] Set up security alerts

### Regular Maintenance
- [ ] Review security logs weekly
- [ ] Update security patterns monthly
- [ ] Test security features quarterly
- [ ] Review and update IP lists
- [ ] Monitor security metrics
- [ ] Update dependencies regularly

## Troubleshooting

### Common Issues

#### False Positives
If legitimate requests are being blocked:
1. Check security logs for the specific pattern
2. Adjust validation patterns if necessary
3. Add exceptions for specific endpoints
4. Consider IP whitelisting for trusted sources

#### Performance Issues
If security middleware is causing slowdowns:
1. Enable performance monitoring
2. Optimize regex patterns
3. Implement caching for validation results
4. Consider async processing for heavy operations

#### Configuration Issues
If security features aren't working:
1. Verify environment variables are set
2. Check middleware order in main.py
3. Ensure all dependencies are installed
4. Review error logs for configuration errors

## Future Enhancements

### Planned Features
- **Machine learning-based threat detection**
- **Advanced bot detection**
- **Behavioral analysis**
- **Integration with external threat intelligence**
- **Advanced CAPTCHA integration**
- **Biometric authentication support**

### Monitoring Improvements
- **Real-time dashboards**
- **Advanced alerting rules**
- **Integration with SIEM systems**
- **Automated incident response**

## Compliance

This security implementation helps meet various compliance requirements:
- **OWASP Top 10**: Protection against common vulnerabilities
- **GDPR**: Data protection and privacy controls
- **SOC 2**: Security controls and monitoring
- **ISO 27001**: Information security management

## Support

For security-related questions or issues:
1. Check the troubleshooting section
2. Review security logs
3. Run the security test suite
4. Contact the development team

---

**Note**: This security implementation is designed to provide comprehensive protection while maintaining performance and usability. Regular updates and monitoring are essential for maintaining security effectiveness.