import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeRoles = searchParams.get('include_roles')?.split(',') || ['admin', 'super_admin'];
    const active_only = searchParams.get('active_only') !== 'false'; // default to true

    // Build filters for FastAPI
    const filters: any = {
      role: { $in: includeRoles }
    };

    // Filter by active status if requested
    if (active_only) {
      filters.is_active = true;
    }

    const response = await apiClient.getItems('users', {
      filters,
      sort: { full_name: 1 }
    });

    if (response.error) {
      console.error('Error fetching employees:', response.error);
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
        { status: 500 }
      );
    }

    const data = response.data || [];

    // Transform data to include display information
    const employees = data?.map(user => ({
      id: user.id,
      name: user.full_name || user.email,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      display_name: `${user.full_name || user.email} (${user.role})`,
      last_login: user.last_login
    })) || [];

    return NextResponse.json({ data: employees });
  } catch (error) {
    console.error('Error in employees API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      full_name,
      role = 'admin',
      password,
      send_invitation = true
    } = body;

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingResponse = await apiClient.getItems('users', {
      filters: { email },
      limit: 1
    });

    if (existingResponse.error) {
      console.error('Error checking existing user:', existingResponse.error);
      return NextResponse.json(
        { error: 'Failed to check existing user' },
        { status: 500 }
      );
    }

    if (existingResponse.data && existingResponse.data.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user record in database
    const userResponse = await apiClient.createItem('users', {
      email,
      full_name,
      role,
      is_active: true,
      password: password || generateRandomPassword(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (userResponse.error) {
      console.error('Error creating user:', userResponse.error);
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      );
    }

    const dbUser = userResponse.data;

    // Send invitation email if requested
    if (send_invitation && !password) {
      try {
        // Note: Email invitation functionality would need to be implemented in the backend
        console.log(`Invitation email should be sent to: ${email}`);
      } catch (inviteError) {
        console.error('Error sending invitation:', inviteError);
        // Don't fail the request if invitation fails
      }
    }

    // Create notification for new employee
    await apiClient.createItem('notifications', {
      message: `New ${role} user created: ${full_name}`,
      type: 'system',
      data: { user_id: dbUser.id, action: 'user_created' },
      created_at: new Date().toISOString(),
      read: false
    });

    const responseData = {
      id: dbUser.id,
      name: dbUser.full_name,
      email: dbUser.email,
      role: dbUser.role,
      is_active: dbUser.is_active,
      invitation_sent: send_invitation && !password
    };

    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (error) {
    console.error('Error in employees POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate random password
function generateRandomPassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}