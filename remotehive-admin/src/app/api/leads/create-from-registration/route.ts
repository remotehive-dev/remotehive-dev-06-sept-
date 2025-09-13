import { NextRequest, NextResponse } from 'next/server';
import { apiService } from '@/lib/api';

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

    // Construct address from components
    let address = '';
    if (company_address) {
      address = company_address;
    } else {
      const addressParts = [city, state, country].filter(Boolean);
      address = addressParts.join(', ');
    }

    // Create new lead via FastAPI backend
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
      notes: `Auto-generated from ${leadType} registration`
    };

    const response = await apiService.post('/admin/leads/create-from-registration', leadData);
    
    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 409) {
        // Lead already exists
        return NextResponse.json(
          { message: 'Lead already exists for this user', lead_id: errorData.lead_id },
          { status: 200 }
        );
      }
      console.error('Error creating lead:', errorData);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }
    
    const result = await response.json();
    const newLead = result.data;

    return NextResponse.json({
      message: 'Lead created successfully',
      data: {
        lead_id: newLead.id,
        type: leadType,
        status: 'new'
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

    // Get registration statistics from FastAPI backend
    const response = await apiService.get(`/admin/leads/registration-stats?days=${days}`);
    
    if (!response.ok) {
      console.error('Error fetching registration stats');
      return NextResponse.json(
        { error: 'Failed to fetch registration statistics' },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in registration stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}