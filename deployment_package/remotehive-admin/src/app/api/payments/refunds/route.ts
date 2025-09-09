import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('refunds')
      .select(`
        *,
        transaction:transactions(
          id,
          gateway_transaction_id,
          customer_email,
          customer_name,
          amount,
          currency
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching refunds:', error);
      return NextResponse.json(
        { error: 'Failed to fetch refunds' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data, count });
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
    const { data: transaction, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();
    
    if (transError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
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
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert([refundData])
      .select()
      .single();
    
    if (refundError) {
      console.error('Error creating refund:', refundError);
      return NextResponse.json(
        { error: 'Failed to create refund' },
        { status: 500 }
      );
    }
    
    // Here you would typically integrate with the payment gateway to process the actual refund
    // For now, we'll just mark it as pending
    
    return NextResponse.json({ data: refund });
  } catch (error) {
    console.error('Error in refund creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}