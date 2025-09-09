import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '8b0aceeaa899e15c513ea9b6f9de82edef07bd6ba6d36c30007856f7a3db5f77';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Admin authentication with specified credentials only
    if (email === 'admin@remotehive.in' && password === 'Ranjeet11$') {
      // Create JWT token with fields expected by autoscraper service
      const token = jwt.sign(
        { 
          sub: 'admin-user-id',  // subject (user ID)
          email,
          roles: ['admin'],  // roles as array expected by autoscraper service
          userId: 'admin-user-id',
          type: 'access',
          iss: 'RemoteHive',  // issuer
          aud: 'RemoteHive-Services'  // audience
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = NextResponse.json(
        { 
          success: true,
          access_token: token,
          user: {
            email,
            role: 'admin',
            name: 'Admin User'
          }
        },
        { status: 200 }
      );

      // Set HTTP-only cookie with name expected by autoscraper service
      response.cookies.set('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 // 24 hours
      });

      return response;
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}