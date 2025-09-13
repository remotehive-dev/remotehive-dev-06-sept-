import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/users/${userId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const errorText = await response.text();
      console.error('Error fetching user profile:', errorText);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}