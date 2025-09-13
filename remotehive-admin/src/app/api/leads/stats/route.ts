import { NextRequest, NextResponse } from 'next/server';
import { apiService } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    // Fetch lead statistics from FastAPI backend
    const response = await apiService.get(`/admin/leads/stats?period=${period}`);
    
    if (!response.ok) {
      console.error('Error fetching lead statistics:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch lead statistics' },
        { status: 500 }
      );
    }

    const stats = await response.json();
    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error in leads stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}