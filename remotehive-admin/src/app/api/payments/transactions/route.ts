import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const gateway = searchParams.get('gateway');
    const search = searchParams.get('search');
    
    const filters: any = {};
    if (status && status !== 'all') {
      filters.status = status;
    }
    if (gateway && gateway !== 'all') {
      filters.gateway_name = gateway;
    }
    if (search) {
      filters.search = search; // Backend will handle search across multiple fields
    }
    
    const response = await apiClient.getItems('transactions', {
      page,
      limit,
      filters,
      sort: '-created_at'
    });
    
    if (response.error) {
      console.error('Error fetching transactions:', response.error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      data: response.data || [], 
      count: response.total || 0 
    });
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
    
    const response = await apiClient.createItem('transactions', body);
    
    if (response.error) {
      console.error('Error creating transaction:', response.error);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: response.data });
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
    
    const response = await apiClient.updateItem('transactions', id, updates);
    
    if (response.error) {
      console.error('Error updating transaction:', response.error);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: response.data });
  } catch (error) {
    console.error('Error in transaction update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}