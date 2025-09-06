#!/usr/bin/env python3

import sys
sys.path.append('.')

from app.schemas.errors import ErrorResponseFactory, FieldError

try:
    # Try to create a ValidationErrorResponse using the factory method
    field_error = FieldError(
        field="test_field",
        message="Test error message",
        code="TEST_ERROR"
    )
    
    validation_error = ErrorResponseFactory.create_validation_error(
        field_errors=[field_error],
        message="Test validation error"
    )
    
    print("✅ ValidationErrorResponse created successfully via factory")
    print(f"Error code: {validation_error.error_code}")
    print(f"Total errors: {validation_error.total_errors}")
    
except Exception as e:
    print(f"❌ Error creating ValidationErrorResponse via factory: {e}")
    import traceback
    traceback.print_exc()