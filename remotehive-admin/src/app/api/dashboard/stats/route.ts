import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';

export async function GET() {
  try {
    const [usersCount, jobsCount, applicationsCount, activeJobsCount] = await Promise.all([
      apiClient.getCount('users'),
      apiClient.getCount('job_posts'),
      apiClient.getCount('job_applications'),
      apiClient.getCount('job_posts', { status: 'active' })
    ]);

    // Check for errors in responses
    const responses = [usersCount, jobsCount, applicationsCount, activeJobsCount];
    const errorResponse = responses.find(response => response.error);
    if (errorResponse) {
      throw new Error(errorResponse.error);
    }

    const stats = {
      totalUsers: usersCount.data?.count || 0,
      totalJobs: jobsCount.data?.count || 0,
      totalApplications: applicationsCount.data?.count || 0,
      activeJobs: activeJobsCount.data?.count || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}