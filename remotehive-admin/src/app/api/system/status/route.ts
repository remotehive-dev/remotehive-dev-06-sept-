import { NextResponse } from 'next/server';
import { apiService } from '@/lib/api';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test database connectivity
    const dbTest = await apiService.get('/admin/users?limit=1');
    const dbResponseTime = Date.now() - startTime;
    
    // Check scraper queue status (using autoscraper service)
    let scraperStatus;
    try {
      scraperStatus = await fetch('http://localhost:8001/api/v1/scraper/status');
    } catch (error) {
      scraperStatus = { ok: false };
    }
    
    const result = {
      database: {
        status: dbTest ? 'healthy' : 'error',
        responseTime: dbResponseTime
      },
      scraperQueue: {
        status: scraperStatus.ok ? 'operational' : 'error'
      },
      api: {
        status: 'operational'
      },
      email: {
        status: 'active'
      }
    };

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