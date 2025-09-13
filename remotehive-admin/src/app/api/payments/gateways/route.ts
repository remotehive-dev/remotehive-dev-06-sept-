import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';

export async function GET() {
  try {
    const response = await apiClient.getItems('payment_gateways', {
      sort: 'name'
    });
    
    if (response.error) {
      console.error('Error fetching payment gateways:', response.error);
      return NextResponse.json(
        { error: 'Failed to fetch payment gateways' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: response.data || [] });
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
    
    const response = await apiClient.createItem('payment_gateways', body);
    
    if (response.error) {
      console.error('Error creating payment gateway:', response.error);
      return NextResponse.json(
        { error: 'Failed to create payment gateway' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: response.data });
  } catch (error) {
    console.error('Error in gateway creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}