import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();
    
    const [usersCount, jobsCount, applicationsCount, activeJobsCount] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('job_posts').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('job_applications').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('job_posts').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ]);

    const stats = {
      totalUsers: usersCount.count || 0,
      totalJobs: jobsCount.count || 0,
      totalApplications: applicationsCount.count || 0,
      activeJobs: activeJobsCount.count || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}