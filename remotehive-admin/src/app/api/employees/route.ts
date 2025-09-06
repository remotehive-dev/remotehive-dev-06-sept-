import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeRoles = searchParams.get('include_roles')?.split(',') || ['admin', 'super_admin'];
    const active_only = searchParams.get('active_only') !== 'false'; // default to true

    const supabaseAdmin = createAdminClient();
    
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        last_login
      `)
      .in('role', includeRoles)
      .order('full_name', { ascending: true });

    // Filter by active status if requested
    if (active_only) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching employees:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
        { status: 500 }
      );
    }

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

    const supabaseAdmin = createAdminClient();

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user in auth system
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || generateRandomPassword(),
      email_confirm: true,
      user_metadata: {
        full_name,
        role
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user record in database
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating database user:', dbError);
      // Try to clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      );
    }

    // Send invitation email if requested
    if (send_invitation && !password) {
      try {
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
        });
      } catch (inviteError) {
        console.error('Error sending invitation:', inviteError);
        // Don't fail the request if invitation fails
      }
    }

    // Create notification for new employee
    await supabaseAdmin
      .from('notifications')
      .insert({
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