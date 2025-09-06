import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const supabaseAdmin = createAdminClient();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get all leads
    const { data: allLeads, error: allLeadsError } = await supabaseAdmin
      .from('leads')
      .select('id, type, status, created_at');

    if (allLeadsError) {
      console.error('Error fetching leads for stats:', allLeadsError);
      return NextResponse.json(
        { error: 'Failed to fetch lead statistics' },
        { status: 500 }
      );
    }

    // Get leads within the specified period
    const { data: periodLeads, error: periodLeadsError } = await supabaseAdmin
      .from('leads')
      .select('id, type, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (periodLeadsError) {
      console.error('Error fetching period leads:', periodLeadsError);
      return NextResponse.json(
        { error: 'Failed to fetch period lead statistics' },
        { status: 500 }
      );
    }

    // Calculate overall statistics
    const totalLeads = allLeads?.length || 0;
    const newLeads = allLeads?.filter(lead => lead.status === 'new').length || 0;
    const contactedLeads = allLeads?.filter(lead => lead.status === 'contacted').length || 0;
    const qualifiedLeads = allLeads?.filter(lead => lead.status === 'qualified').length || 0;
    const convertedLeads = allLeads?.filter(lead => lead.status === 'converted').length || 0;
    const lostLeads = allLeads?.filter(lead => lead.status === 'lost').length || 0;
    const employerLeads = allLeads?.filter(lead => lead.type === 'employer').length || 0;
    const jobseekerLeads = allLeads?.filter(lead => lead.type === 'jobseeker').length || 0;

    // Calculate period statistics
    const periodTotal = periodLeads?.length || 0;
    const periodEmployers = periodLeads?.filter(lead => lead.type === 'employer').length || 0;
    const periodJobseekers = periodLeads?.filter(lead => lead.type === 'jobseeker').length || 0;

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Calculate daily breakdown for the period
    const dailyBreakdown = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLeads = periodLeads?.filter(lead => {
        const leadDate = new Date(lead.created_at).toISOString().split('T')[0];
        return leadDate === dateStr;
      }) || [];

      dailyBreakdown.push({
        date: dateStr,
        total: dayLeads.length,
        employers: dayLeads.filter(lead => lead.type === 'employer').length,
        jobseekers: dayLeads.filter(lead => lead.type === 'jobseeker').length
      });
    }

    // Calculate status distribution
    const statusDistribution = {
      new: newLeads,
      contacted: contactedLeads,
      qualified: qualifiedLeads,
      converted: convertedLeads,
      lost: lostLeads
    };

    // Calculate type distribution
    const typeDistribution = {
      employer: employerLeads,
      jobseeker: jobseekerLeads
    };

    // Get recent activity (last 10 leads)
    const { data: recentLeads, error: recentLeadsError } = await supabaseAdmin
      .from('leads')
      .select(`
        id,
        name,
        email,
        type,
        status,
        created_at,
        company_name
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentLeadsError) {
      console.error('Error fetching recent leads:', recentLeadsError);
    }

    const stats = {
      overview: {
        total: totalLeads,
        new: newLeads,
        contacted: contactedLeads,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        lost: lostLeads,
        employerLeads,
        jobseekerLeads,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      period: {
        days: parseInt(period),
        total: periodTotal,
        employers: periodEmployers,
        jobseekers: periodJobseekers,
        dailyBreakdown
      },
      distribution: {
        status: statusDistribution,
        type: typeDistribution
      },
      recentActivity: recentLeads || []
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error in leads stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}