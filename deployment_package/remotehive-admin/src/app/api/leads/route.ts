import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(type !== 'all' && { type }),
      ...(status !== 'all' && { status })
    });

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/leads?${queryParams}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching leads:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in leads API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      company_name,
      address,
      type, // 'employer' or 'jobseeker'
      source = 'website_registration',
      user_id // ID from the users table
    } = body;

    // Validate required fields
    if (!name || !email || !type) {
      return NextResponse.json(
        { error: 'Name, email, and type are required' },
        { status: 400 }
      );
    }

    if (!['employer', 'jobseeker'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "employer" or "jobseeker"' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        company_name,
        address,
        source,
        type,
        user_id
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating lead:', errorText);
      
      if (response.status === 409) {
        return NextResponse.json(
          { error: 'Lead already exists for this email' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in leads POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      assigned_to,
      notes
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/leads/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        assigned_to,
        notes
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error updating lead:', errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in leads PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}