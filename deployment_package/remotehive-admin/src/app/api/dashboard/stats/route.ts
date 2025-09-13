import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

export async function GET() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/analytics/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const stats = await response.json();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}