import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

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

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/analytics/dashboard/activity?limit=${limit}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching dashboard activity:', errorText);
      return NextResponse.json({ error: 'Failed to fetch dashboard activity' }, { status: 500 });
    }

    const activities = await response.json();
    
    // Format time ago for each activity
    const result = activities.map(activity => ({
      ...activity,
      time: formatTimeAgo(activity.created_at)
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}