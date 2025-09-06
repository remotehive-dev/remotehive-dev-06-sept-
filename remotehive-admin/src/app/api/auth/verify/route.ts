import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'No token found' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Extract role from roles array (JWT token has roles: ['admin'])
      const role = decoded.roles && decoded.roles.length > 0 ? decoded.roles[0] : 'user';
      
      return NextResponse.json(
        {
          authenticated: true,
          user: {
            email: decoded.email,
            role: role,
            userId: decoded.userId || decoded.sub
          }
        },
        { status: 200 }
      );
    } catch (jwtError) {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}