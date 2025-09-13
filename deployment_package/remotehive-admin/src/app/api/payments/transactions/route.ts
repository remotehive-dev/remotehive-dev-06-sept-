import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/services/api/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const gateway = searchParams.get('gateway');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && status !== 'all' && { status }),
      ...(gateway && gateway !== 'all' && { gateway }),
      ...(search && { search }),
    });
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/payments/transactions?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Error fetching transactions:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in transactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/payments/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      console.error('Error creating transaction:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in transaction creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/payments/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      console.error('Error updating transaction:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in transaction update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}