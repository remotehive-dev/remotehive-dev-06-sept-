import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

/**
 * This API endpoint is called when a new user registers on the public website
 * It creates a real-time notification for admin panel users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      email,
      full_name,
      role, // 'employer' or 'job_seeker'
      registration_source = 'website_registration'
    } = body;

    // Validate required fields
    if (!user_id || !email || !full_name || !role) {
      return NextResponse.json(
        { error: 'user_id, email, full_name, and role are required' },
        { status: 400 }
      );
    }

    // Create notification via FastAPI backend
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/notifications/new-user-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        email,
        full_name,
        role,
        registration_source
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating notification:', errorText);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      message: 'Notification created successfully',
      data: result
    }, { status: 201 });

  } catch (error) {
    console.error('Error in new user registration notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}