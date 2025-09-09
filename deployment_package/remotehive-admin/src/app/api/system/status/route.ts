import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const startTime = Date.now();
    const supabaseAdmin = createAdminClient();
    
    // Test database connectivity
    const dbTest = await supabaseAdmin.from('users').select('id').limit(1);
    const dbResponseTime = Date.now() - startTime;
    
    // Check scraper queue status
    const scraperStatus = await supabaseAdmin
      .from('scraper_queue')
      .select('status')
      .eq('status', 'running')
      .limit(1);
    
    const result = {
      database: {
        status: dbTest.error ? 'error' : 'healthy',
        responseTime: dbResponseTime
      },
      scraperQueue: {
        status: scraperStatus.data && scraperStatus.data.length > 0 ? 'processing' : 'idle'
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