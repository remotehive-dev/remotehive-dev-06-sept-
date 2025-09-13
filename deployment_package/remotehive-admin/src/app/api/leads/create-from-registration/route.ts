import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

/**
 * This API endpoint is called when a new user registers on the public website
 * It automatically creates a lead in the lead management system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      email,
      full_name,
      phone,
      role, // 'employer' or 'job_seeker'
      company_name,
      company_address,
      city,
      state,
      country,
      registration_source = 'website_registration'
    } = body;

    // Validate required fields
    if (!user_id || !email || !full_name || !role) {
      return NextResponse.json(
        { error: 'user_id, email, full_name, and role are required' },
        { status: 400 }
      );
    }

    // Map role to lead type
    let leadType: 'employer' | 'jobseeker';
    if (role === 'employer') {
      leadType = 'employer';
    } else if (role === 'job_seeker') {
      leadType = 'jobseeker';
    } else {
      return NextResponse.json(
        { error: 'Role must be either "employer" or "job_seeker"' },
        { status: 400 }
      );
    }

    // Check if lead already exists for this user
    const checkResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/leads/by-user/${user_id}`);
    
    if (checkResponse.ok) {
      const existingLead = await checkResponse.json();
      return NextResponse.json(
        { message: 'Lead already exists for this user', lead_id: existingLead.id },
        { status: 200 }
      );
    }

    // Construct address from components
    let address = '';
    if (company_address) {
      address = company_address;
    } else {
      const addressParts = [city, state, country].filter(Boolean);
      address = addressParts.join(', ');
    }

    // Create new lead
    const leadData = {
      user_id,
      name: full_name,
      email,
      phone: phone || null,
      company_name: leadType === 'employer' ? company_name : null,
      address: address || null,
      source: registration_source,
      type: leadType,
      status: 'new' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      notes: `Auto-generated from ${leadType} registration`
    };

    const leadResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    if (!leadResponse.ok) {
      console.error('Error creating lead:', await leadResponse.text());
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    const newLead = await leadResponse.json();

    // Create notification for new lead
    const notificationMessage = leadType === 'employer' 
      ? `New employer lead: ${full_name}${company_name ? ` from ${company_name}` : ''}`
      : `New jobseeker lead: ${full_name}`;

    const notificationResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: notificationMessage,
        type: 'new_lead',
        data: { 
          lead_id: newLead.id,
          lead_type: leadType,
          user_id,
          registration_source
        },
        created_at: new Date().toISOString(),
        read: false
      }),
    });

    const notificationError = !notificationResponse.ok;
    if (notificationError) {
      console.error('Error creating notification:', await notificationResponse.text());
      // Don't fail the request if notification creation fails
    }

    // Log the lead creation for analytics
    const analyticsResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/analytics/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        lead_type: leadType,
        source: registration_source,
        created_at: new Date().toISOString()
      }),
    });

    const analyticsError = !analyticsResponse.ok;
    if (analyticsError) {
      console.error('Error logging analytics:', await analyticsResponse.text());
      // Don't fail the request if analytics logging fails
    }

    return NextResponse.json({
      message: 'Lead created successfully',
      data: {
        lead_id: newLead.id,
        type: leadType,
        status: 'new',
        notification_sent: !notificationError
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in create-from-registration API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get registration statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get registration statistics
    const statsUrl = new URL(`${API_CONFIG.BASE_URL}/api/v1/leads/registration-stats`);
    statsUrl.searchParams.set('source', 'website_registration');
    statsUrl.searchParams.set('start_date', startDate.toISOString());
    statsUrl.searchParams.set('end_date', endDate.toISOString());
    
    const statsResponse = await fetch(statsUrl.toString());

    if (!statsResponse.ok) {
      console.error('Error fetching registration stats:', await statsResponse.text());
      return NextResponse.json(
        { error: 'Failed to fetch registration statistics' },
        { status: 500 }
      );
    }

    const registrationStats = await statsResponse.json();

    // Process statistics
    const totalRegistrations = registrationStats?.length || 0;
    const employerRegistrations = registrationStats?.filter(r => r.type === 'employer').length || 0;
    const jobseekerRegistrations = registrationStats?.filter(r => r.type === 'jobseeker').length || 0;

    // Daily breakdown
    const dailyBreakdown = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRegistrations = registrationStats?.filter(r => {
        const regDate = new Date(r.created_at).toISOString().split('T')[0];
        return regDate === dateStr;
      }) || [];

      dailyBreakdown.push({
        date: dateStr,
        total: dayRegistrations.length,
        employers: dayRegistrations.filter(r => r.type === 'employer').length,
        jobseekers: dayRegistrations.filter(r => r.type === 'jobseeker').length
      });
    }

    const stats = {
      period: {
        days,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      },
      totals: {
        total: totalRegistrations,
        employers: employerRegistrations,
        jobseekers: jobseekerRegistrations
      },
      daily_breakdown: dailyBreakdown
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error in registration stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}