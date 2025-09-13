import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Forward authentication request to FastAPI backend
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Authentication failed' },
        { status: response.status }
      );
    }

    const authData = await response.json();
    
    const nextResponse = NextResponse.json(authData, { status: 200 });

    // Set HTTP-only cookie if token is provided
    if (authData.access_token) {
      nextResponse.cookies.set('access_token', authData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 // 24 hours
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}