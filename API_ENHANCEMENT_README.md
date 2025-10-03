# RemoteHive API Enhancement Documentation

## Overview

This document describes the comprehensive API enhancements implemented for the RemoteHive platform. The enhancements include API versioning, advanced validation, security improvements, standardized schemas, enhanced documentation, and comprehensive monitoring.

## 🚀 Key Features

### 1. API Versioning System
- **Multi-version Support**: Supports V1 and V2 APIs simultaneously
- **Flexible Version Detection**: Extracts version from headers, URL path, or query parameters
- **Backward Compatibility**: Maintains compatibility between API versions
- **Version-specific Documentation**: Separate documentation for each API version

### 2. Enhanced Validation Framework
- **Input Sanitization**: XSS, SQL injection, and path traversal protection
- **Request Size Limits**: Configurable limits for request size and JSON depth
- **Content Type Validation**: Strict content type checking
- **Security Pattern Detection**: Advanced threat detection patterns

### 3. Standardized Schema System
- **Base Schemas**: Common base classes with built-in validation
- **Request/Response Models**: Standardized request and response formats
- **Error Handling**: Comprehensive error response schemas
- **Validation Patterns**: Reusable validation patterns for common fields

### 4. Security Enhancements
- **Security Headers**: Comprehensive security headers on all responses
- **Rate Limiting**: Built-in rate limiting with configurable thresholds
- **Input Validation**: Advanced input validation and sanitization
- **Threat Detection**: Real-time security threat detection

### 5. Enhanced Documentation
- **Interactive API Docs**: Enhanced Swagger UI and ReDoc interfaces
- **Schema Validation**: Real-time schema validation and reporting
- **API Metadata**: Comprehensive API metadata and versioning info
- **Custom Documentation Routes**: Additional documentation endpoints

### 6. Monitoring and Metrics
- **Health Checks**: Detailed health checks for all system components
- **Performance Metrics**: Real-time performance and usage metrics
- **Error Tracking**: Comprehensive error tracking and reporting
- **System Monitoring**: CPU, memory, and connection monitoring

## 📁 File Structure

```
backend/
├── api/
│   ├── documentation.py      # Enhanced API documentation
│   ├── integration.py         # Comprehensive API integration
│   └── versioning.py         # API versioning system
├── middleware/
│   ├── enhanced_middleware.py # Enhanced request/response middleware
│   └── validation.py         # Validation middleware
├── schemas/
│   ├── base.py              # Base schema classes
│   ├── errors.py            # Error response schemas
│   ├── requests.py          # Request schemas
│   ├── responses.py         # Response schemas
│   └── validation.py        # Validation schemas
└── tests/
    └── test_api_integration.py # Comprehensive API tests
```

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
API_VERSION=v2
API_RATE_LIMIT=1000
API_MAX_REQUEST_SIZE=10485760  # 10MB

# Security Configuration
SECURITY_SCAN_ENABLED=true
SECURITY_BLOCK_THREATS=true

# Validation Configuration
VALIDATION_MAX_JSON_DEPTH=10
VALIDATION_MAX_FIELD_LENGTH=1000
VALIDATION_MAX_ARRAY_LENGTH=1000

# Documentation Configuration
DOCS_ENHANCED=true
DOCS_INCLUDE_SCHEMAS=true
```

### Validation Configuration

```python
from app.middleware.validation import ValidationConfig

config = ValidationConfig(
    max_request_size=10 * 1024 * 1024,  # 10MB
    max_json_depth=10,
    max_field_length=1000,
    max_array_length=1000,
    rate_limit_requests=1000,
    rate_limit_window=3600  # 1 hour
)
```

## 🚀 Usage Examples

### 1. API Versioning

```python
# Client specifies version via header
headers = {"X-API-Version": "v2"}
response = requests.get("/api/users", headers=headers)

# Or via URL path
response = requests.get("/api/v2/users")

# Or via query parameter
response = requests.get("/api/users?version=v2")
```

### 2. Standardized Request/Response

```python
from app.schemas.requests import SearchRequest
from app.schemas.responses import ListResponse

# Search request with validation
search_request = SearchRequest(
    query="remote developer",
    filters=[
        FilterCondition(field="location", operator="eq", value="remote")
    ],
    sort=[
        SortCondition(field="created_at", order="desc")
    ],
    pagination=PaginationRequest(page=1, size=20)
)

# Standardized response
response = ListResponse[
    data=jobs,
    pagination=PaginationMetadata(
        page=1, size=20, total_items=100, total_pages=5
    ),
    metadata=ResponseMetadata(
        request_id="req_123",
        api_version="v2",
        processing_time=150.5
    )
]
```

### 3. Error Handling

```python
from app.schemas.errors import ErrorResponseFactory

# Create standardized error responses
error_factory = ErrorResponseFactory()

# Validation error
validation_error = error_factory.create_validation_error_response(
    message="Invalid input data",
    field_errors=[
        FieldError(field="email", message="Invalid email format")
    ]
)

# Security error
security_error = error_factory.create_security_error_response(
    message="Security threat detected",
    threat_type="xss_attempt"
)
```

### 4. Health Checks

```python
# Basic health check
GET /health
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z"
}

# Detailed health check
GET /api/health/detailed
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "components": {
        "database": {"status": "healthy", "response_time": "<50ms"},
        "redis": {"status": "healthy", "response_time": "<10ms"},
        "external_apis": {"status": "healthy", "services": ["clerk", "stripe"]}
    },
    "uptime": "24h 30m",
    "version": "v2"
}
```

### 5. Metrics

```python
# API metrics
GET /api/metrics
{
    "metrics": {
        "total_requests": 10000,
        "average_response_time": 150.5,
        "error_rate": 2.1,
        "active_connections": 45,
        "memory_usage": 65.2,
        "cpu_usage": 23.8
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "time_range": "last_24h"
}
```

## 🔒 Security Features

### Security Headers
All responses include comprehensive security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Input Validation
- XSS protection with pattern detection
- SQL injection prevention
- Path traversal protection
- Command injection detection
- NoSQL injection protection

### Rate Limiting
- Configurable rate limits per IP
- Sliding window algorithm
- Graceful degradation
- Rate limit headers in responses

## 📊 Monitoring

### Health Check Endpoints
- `/health` - Basic health status
- `/api/health/detailed` - Comprehensive health check
- `/api/metrics` - Performance metrics
- `/api/schema` - API schema and validation rules

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking
- Performance monitoring
- Security event logging

## 🧪 Testing

### Running Tests

```bash
# Run all API integration tests
pytest backend/tests/test_api_integration.py -v

# Run specific test categories
pytest backend/tests/test_api_integration.py::TestAPIVersioning -v
pytest backend/tests/test_api_integration.py::TestAPIValidation -v
pytest backend/tests/test_api_integration.py::TestAPISecurityHeaders -v

# Run with coverage
pytest backend/tests/test_api_integration.py --cov=app.api --cov=app.middleware --cov=app.schemas
```

### Test Categories
- **API Integration**: Complete integration testing
- **Versioning**: API version handling and compatibility
- **Validation**: Input validation and security
- **Documentation**: API documentation generation
- **Error Handling**: Error response formatting
- **Health Checks**: System health monitoring
- **Metrics**: Performance metrics collection
- **Security**: Security headers and threat detection
- **Performance**: Response time and concurrency

## 🔄 Migration Guide

### From V1 to V2

1. **Update Client Headers**:
   ```python
   # Add version header to requests
   headers = {"X-API-Version": "v2"}
   ```

2. **Use Standardized Schemas**:
   ```python
   # Replace custom request/response formats
   from app.schemas.requests import SearchRequest
   from app.schemas.responses import ListResponse
   ```

3. **Handle New Error Format**:
   ```python
   # Update error handling for new format
   if response.status_code >= 400:
       error_data = response.json()
       error_message = error_data.get("message")
       request_id = error_data.get("request_id")
   ```

4. **Update Health Check Calls**:
   ```python
   # Use new detailed health check endpoint
   health_response = requests.get("/api/health/detailed")
   ```

## 🛠️ Development

### Adding New Endpoints

```python
from app.api.integration import APIIntegration
from app.schemas.base import BaseResponse

# Create standardized route
integration = APIIntegration(app)
route = integration.create_standardized_route(
    path="/api/v2/users",
    methods=["GET"],
    response_model=ListResponse[UserResponse],
    request_model=SearchRequest
)
```

### Custom Validation

```python
from app.schemas.validation import SecurityValidationMixin

class CustomValidator(SecurityValidationMixin):
    def validate_custom_field(self, value: str) -> bool:
        # Add custom validation logic
        return self.is_safe_text(value)
```

### Custom Error Responses

```python
from app.schemas.errors import ErrorResponseFactory

error_factory = ErrorResponseFactory()
custom_error = error_factory.create_business_logic_error_response(
    message="Custom business rule violation",
    error_code="CUSTOM_001"
)
```

## 📈 Performance Considerations

### Optimization Tips
1. **Use Pagination**: Always use pagination for list endpoints
2. **Implement Caching**: Cache frequently accessed data
3. **Optimize Queries**: Use efficient database queries
4. **Monitor Metrics**: Regularly check performance metrics
5. **Rate Limiting**: Implement appropriate rate limits

### Scaling
- Horizontal scaling with load balancers
- Database connection pooling
- Redis for caching and rate limiting
- Async request processing
- Background task queues

## 🔍 Troubleshooting

### Common Issues

1. **Version Mismatch**:
   - Check `X-API-Version` header
   - Verify supported versions at `/api/schema`

2. **Validation Errors**:
   - Check request format against schemas
   - Review validation error details

3. **Rate Limiting**:
   - Check rate limit headers
   - Implement exponential backoff

4. **Security Blocks**:
   - Review security logs
   - Check input for suspicious patterns

### Debug Endpoints
- `/api/schema` - API schema and rules
- `/api/health/detailed` - System health
- `/api/metrics` - Performance metrics
- `/docs` - Interactive API documentation

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://pydantic-docs.helpmanual.io/)
- [API Security Best Practices](https://owasp.org/www-project-api-security/)
- [OpenAPI Specification](https://swagger.io/specification/)

## 🤝 Contributing

1. Follow the established schema patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure security best practices
5. Maintain backward compatibility when possible

## 📄 License

This API enhancement is part of the RemoteHive platform and follows the same licensing terms.