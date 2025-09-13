import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/services/api/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // If no date range provided, use last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const queryParams = new URLSearchParams({
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    });
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/payments/analytics?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Error fetching analytics data:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}