import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching payment gateways:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment gateways' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
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
    
    const { data, error } = await supabase
      .from('payment_gateways')
      .insert([body])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating payment gateway:', error);
      return NextResponse.json(
        { error: 'Failed to create payment gateway' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in gateway creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}