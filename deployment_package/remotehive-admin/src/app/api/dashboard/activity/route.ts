import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabaseAdmin = createAdminClient();
    
    const [recentUsers, recentJobs, recentApplications, scraperActivity] = await Promise.all([
      // Recent user registrations
      supabaseAdmin
        .from('users')
        .select('id, email, full_name, created_at, role')
        .order('created_at', { ascending: false })
        .limit(3),
      
      // Recent job posts
      supabaseAdmin
        .from('job_posts')
        .select('id, title, company, created_at, status')
        .order('created_at', { ascending: false })
        .limit(3),
      
      // Recent applications
      supabaseAdmin
        .from('job_applications')
        .select(`
          id, created_at, status,
          job_posts(title, company)
        `)
        .order('created_at', { ascending: false })
        .limit(3),
      
      // Recent scraper activity
      supabaseAdmin
        .from('scraper_queue')
        .select('id, source_name, status, created_at, jobs_found')
        .order('created_at', { ascending: false })
        .limit(2)
    ]);

    const activities = [];

    // Process recent users
    if (recentUsers.data) {
      recentUsers.data.forEach(user => {
        activities.push({
          title: 'New user registration',
          description: `${user.full_name || user.email} joined as ${user.role}`,
          time: formatTimeAgo(user.created_at),
          status: 'success' as const,
          timestamp: new Date(user.created_at)
        });
      });
    }

    // Process recent jobs
    if (recentJobs.data) {
      recentJobs.data.forEach(job => {
        activities.push({
          title: 'New job posted',
          description: `${job.title} at ${job.company}`,
          time: formatTimeAgo(job.created_at),
          status: job.status === 'active' ? 'success' as const : 'warning' as const,
          timestamp: new Date(job.created_at)
        });
      });
    }

    // Process recent applications
    if (recentApplications.data) {
      recentApplications.data.forEach(app => {
        activities.push({
          title: 'Application submitted',
          description: `New application for ${app.job_posts?.title || 'Unknown Job'} at ${app.job_posts?.company || 'Unknown Company'}`,
          time: formatTimeAgo(app.created_at),
          status: app.status === 'pending' ? 'warning' as const : 'success' as const,
          timestamp: new Date(app.created_at)
        });
      });
    }

    // Process scraper activity
    if (scraperActivity.data) {
      scraperActivity.data.forEach(scraper => {
        const statusMap = {
          'completed': 'success' as const,
          'running': 'warning' as const,
          'failed': 'error' as const,
          'pending': 'warning' as const
        };
        
        activities.push({
          title: 'Scraper activity',
          description: `${scraper.source_name} scraper ${scraper.status}${scraper.jobs_found ? ` - ${scraper.jobs_found} jobs found` : ''}`,
          time: formatTimeAgo(scraper.created_at),
          status: statusMap[scraper.status as keyof typeof statusMap] || 'warning' as const,
          timestamp: new Date(scraper.created_at)
        });
      });
    }

    // Sort by timestamp and return limited results
    const result = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
      .map(({ timestamp, ...activity }) => activity);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}