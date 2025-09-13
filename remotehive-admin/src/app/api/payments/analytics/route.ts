import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // If no date range provided, use last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get overall statistics
    const response = await apiClient.getItems('transactions', {
      filters: {
        created_at: {
          $gte: start.toISOString(),
          $lte: end.toISOString()
        }
      }
    });
    
    if (response.error) {
      console.error('Error fetching transactions for analytics:', response.error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    const transactions = response.data || [];
    
    // Calculate analytics
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(t => t.status === 'completed' || t.status === 'success').length;
    const failedTransactions = transactions.filter(t => t.status === 'failed' || t.status === 'error').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending' || t.status === 'processing').length;
    
    const totalRevenue = transactions
      .filter(t => t.status === 'completed' || t.status === 'success')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
    
    // Gateway breakdown
    const gatewayBreakdown = transactions.reduce((acc, t) => {
      const gateway = t.gateway_name || 'unknown';
      if (!acc[gateway]) {
        acc[gateway] = { count: 0, amount: 0, success: 0 };
      }
      acc[gateway].count++;
      acc[gateway].amount += t.amount || 0;
      if (t.status === 'completed' || t.status === 'success') {
        acc[gateway].success++;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Plan breakdown
    const planBreakdown = transactions.reduce((acc, t) => {
      const plan = t.plan_name || 'unknown';
      if (!acc[plan]) {
        acc[plan] = { count: 0, amount: 0 };
      }
      acc[plan].count++;
      acc[plan].amount += t.amount || 0;
      return acc;
    }, {} as Record<string, any>);
    
    // Get fraud detection count (assuming we have some basic fraud detection)
    const fraudDetected = transactions.filter(t => 
      t.failure_reason?.toLowerCase().includes('fraud') || 
      t.failure_reason?.toLowerCase().includes('suspicious')
    ).length;
    
    const analytics = {
      total_revenue: totalRevenue,
      total_transactions: totalTransactions,
      successful_transactions: successfulTransactions,
      failed_transactions: failedTransactions,
      pending_transactions: pendingTransactions,
      success_rate: Math.round(successRate * 100) / 100,
      fraud_detected: fraudDetected,
      gateway_breakdown: gatewayBreakdown,
      plan_breakdown: planBreakdown,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };
    
    return NextResponse.json({ data: analytics });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}