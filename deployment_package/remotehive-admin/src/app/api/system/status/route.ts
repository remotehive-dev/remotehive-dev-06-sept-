import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

export async function GET() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/system/status`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching system status:', errorText);
      const errorResult = {
        database: { status: 'error', responseTime: 0 },
        scraperQueue: { status: 'unknown' },
        api: { status: 'error' },
        email: { status: 'unknown' }
      };
      return NextResponse.json(errorResult, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking system status:', error);
    const errorResult = {
      database: { status: 'error', responseTime: 0 },
      scraperQueue: { status: 'unknown' },
      api: { status: 'error' },
      email: { status: 'unknown' }
    };
    return NextResponse.json(errorResult, { status: 500 });
  }
}