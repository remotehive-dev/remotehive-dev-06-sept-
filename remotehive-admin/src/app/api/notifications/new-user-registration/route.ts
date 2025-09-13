import { NextRequest, NextResponse } from 'next/server';
import { apiService } from '@/lib/api';

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

    // Create notification message based on role
    const notificationTitle = role === 'employer' 
      ? 'New Employer Registration'
      : 'New Job Seeker Registration';
    
    const notificationMessage = role === 'employer'
      ? `New employer ${full_name} has registered and is now available in the system`
      : `New job seeker ${full_name} has registered and is now available in the system`;

    // Create notification for admin users via FastAPI backend
    const notificationData = {
      title: notificationTitle,
      message: notificationMessage,
      type: 'new_user_registration',
      priority: role === 'employer' ? 'high' : 'medium',
      data: {
        user_id,
        email,
        full_name,
        role,
        registration_source,
        action_url: `/admin/users?search=${email}`
      },
      read: false,
      target_audience: 'admin'
    };

    const notification = await apiService.post('/admin/notifications', notificationData);

    if (!notification) {
      console.error('Error creating notification');
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    // Log the notification creation for analytics via FastAPI backend
    try {
      await apiService.post('/admin/activity-logs', {
        action: 'notification_created',
        target_table: 'notifications',
        target_id: notification.id,
        details: {
          type: 'new_user_registration',
          user_role: role,
          source: registration_source
        }
      });
    } catch (analyticsError) {
      console.error('Error logging analytics:', analyticsError);
      // Don't fail the request if analytics logging fails
    }

    return NextResponse.json({
      message: 'Notification created successfully',
      data: {
        notification_id: notification.id,
        type: 'new_user_registration',
        role: role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in new user registration notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}