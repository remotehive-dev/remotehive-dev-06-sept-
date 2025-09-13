import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/services/api/constants';

export async function GET() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/payments/gateways`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Error fetching payment gateways:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch payment gateways' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in gateways API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/payments/gateways`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Error creating payment gateway:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to create payment gateway' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in gateway creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}