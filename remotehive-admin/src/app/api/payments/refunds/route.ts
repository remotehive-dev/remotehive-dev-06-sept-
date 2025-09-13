import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    
    const filters: any = {};
    if (status && status !== 'all') {
      filters.status = status;
    }
    
    const response = await apiClient.getItems('refunds', {
      page,
      limit,
      filters,
      sort: '-created_at',
      populate: ['transaction']
    });
    
    if (response.error) {
      console.error('Error fetching refunds:', response.error);
      return NextResponse.json(
        { error: 'Failed to fetch refunds' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      data: response.data || [], 
      count: response.total || 0 
    });
  } catch (error) {
    console.error('Error in refunds API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id, amount, reason } = body;
    
    // First, get the transaction details
    const transactionResponse = await apiClient.getItems('transactions', {
      filters: { id: transaction_id },
      limit: 1
    });
    
    if (transactionResponse.error || !transactionResponse.data || transactionResponse.data.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    const transaction = transactionResponse.data[0];
    
    // Check if transaction is eligible for refund
    if (transaction.status !== 'completed' && transaction.status !== 'success') {
      return NextResponse.json(
        { error: 'Transaction is not eligible for refund' },
        { status: 400 }
      );
    }
    
    // Check if refund amount is valid
    if (amount > transaction.amount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed transaction amount' },
        { status: 400 }
      );
    }
    
    // Create refund record
    const refundData = {
      transaction_id,
      amount,
      currency: transaction.currency,
      reason,
      status: 'pending'
    };
    
    const refundResponse = await apiClient.createItem('refunds', refundData);
    
    if (refundResponse.error) {
      console.error('Error creating refund:', refundResponse.error);
      return NextResponse.json(
        { error: 'Failed to create refund' },
        { status: 500 }
      );
    }
    
    // Here you would typically integrate with the payment gateway to process the actual refund
    // For now, we'll just mark it as pending
    
    return NextResponse.json({ data: refundResponse.data });
  } catch (error) {
    console.error('Error in refund creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}