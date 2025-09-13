import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/services/api/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    
    const offset = (page - 1) * limit;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && status !== 'all' && { status }),
    });
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/payments/refunds?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Error fetching refunds:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch refunds' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in refunds API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/payments/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create refund' }));
      console.error('Error creating refund:', response.statusText);
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in refund creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}