import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeRoles = searchParams.get('include_roles')?.split(',') || ['admin', 'super_admin'];
    const active_only = searchParams.get('active_only') !== 'false'; // default to true

    // Build query parameters
    const queryParams = new URLSearchParams();
    includeRoles.forEach(role => queryParams.append('roles', role));
    if (active_only) {
      queryParams.set('active_only', 'true');
    }
    queryParams.set('order_by', 'full_name');
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/users/employees?${queryParams.toString()}`);

    if (!response.ok) {
      console.error('Error fetching employees:', await response.text());
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
        { status: 500 }
      );
    }

    const data = await response.json();

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

    // Create employee via FastAPI backend
    const createResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/users/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        full_name,
        role,
        password: password || generateRandomPassword(),
        send_invitation,
        is_active: true
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Error creating employee:', errorText);
      
      if (createResponse.status === 409) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create employee' },
        { status: 500 }
      );
    }

    const dbUser = await createResponse.json();

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