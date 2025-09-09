import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8001';

export async function POST(
  request: NextRequest,
  { params }: { params: { importId: string } }
) {
  try {
    const { importId } = params;

    if (!importId) {
      return NextResponse.json(
        { error: 'Import ID is required' },
        { status: 400 }
      );
    }

    // Forward the request to the FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/csv/${importId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to cancel import' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to cancel import' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error canceling import:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}