import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8001';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/csv/template`, {
      method: 'GET',
      headers: {
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to download template' },
        { status: response.status }
      );
    }

    // Get the CSV content and headers from the backend response
    const csvContent = await response.text();
    const contentDisposition = response.headers.get('content-disposition');
    
    // Create response with proper headers for file download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': contentDisposition || 'attachment; filename="csv_import_template.csv"'
      }
    });

  } catch (error) {
    console.error('Error downloading CSV template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}