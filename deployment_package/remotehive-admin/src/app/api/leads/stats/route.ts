import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/leads/stats?period=${period}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching leads stats:', errorText);
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