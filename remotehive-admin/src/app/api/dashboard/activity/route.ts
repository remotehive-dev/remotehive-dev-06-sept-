import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';

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

    const [recentUsers, recentJobs, recentApplications, scraperActivity] = await Promise.all([
      // Recent user registrations
      apiClient.getItems('users', {
        select: ['id', 'email', 'full_name', 'created_at', 'role'],
        sort: { created_at: -1 },
        limit: 3
      }),
      
      // Recent job posts
      apiClient.getItems('job_posts', {
        select: ['id', 'title', 'company', 'created_at', 'status'],
        sort: { created_at: -1 },
        limit: 3
      }),
      
      // Recent applications
      apiClient.getItems('job_applications', {
        select: ['id', 'created_at', 'status', 'job_post_id'],
        sort: { created_at: -1 },
        limit: 3
      }),
      
      // Recent scraper activity
      apiClient.getItems('scraper_queue', {
        select: ['id', 'source_name', 'status', 'created_at', 'jobs_found'],
        sort: { created_at: -1 },
        limit: 2
      })
    ]);

    // Check for errors in responses
    const responses = [recentUsers, recentJobs, recentApplications, scraperActivity];
    const errorResponse = responses.find(response => response.error);
    if (errorResponse) {
      throw new Error(errorResponse.error);
    }

    const activities = [];
    const users = recentUsers.data || [];
    const jobs = recentJobs.data || [];
    const applications = recentApplications.data || [];
    const scrapers = scraperActivity.data || [];

    // Process recent users
    users.forEach(user => {
      activities.push({
        title: 'New user registration',
        description: `${user.full_name || user.email} joined as ${user.role}`,
        time: formatTimeAgo(user.created_at),
        status: 'success' as const,
        timestamp: new Date(user.created_at)
      });
    });

    // Process recent jobs
    jobs.forEach(job => {
      activities.push({
        title: 'New job posted',
        description: `${job.title} at ${job.company}`,
        time: formatTimeAgo(job.created_at),
        status: job.status === 'active' ? 'success' as const : 'warning' as const,
        timestamp: new Date(job.created_at)
      });
    });

    // Process recent applications
    applications.forEach(app => {
      activities.push({
        title: 'Application submitted',
        description: `New application for job ID: ${app.job_post_id}`,
        time: formatTimeAgo(app.created_at),
        status: app.status === 'pending' ? 'warning' as const : 'success' as const,
        timestamp: new Date(app.created_at)
      });
    });

    // Process scraper activity
    scrapers.forEach(scraper => {
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