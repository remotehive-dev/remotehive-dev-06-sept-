import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Calculate offset for FastAPI backend
    const offset = (page - 1) * limit;

    // Build query parameters for FastAPI backend
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (search) {
      queryParams.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/api/jobs?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('FastAPI error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch job posts' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform data for frontend compatibility
    const transformedData = data.jobs?.map((job: any) => ({
      ...job,
      company: job.company_name || 'Unknown Company',
      location: job.location || 'Remote'
    })) || [];

    return NextResponse.json({ 
      data: transformedData, 
      count: data.total || 0 
    });
  } catch (error) {
    console.error('Error in jobs API:', error);
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
      title,
      company,
      location,
      employment_type,
      salary_min,
      salary_max,
      description,
      requirements,
      benefits,
      remote_friendly = false,
      urgent = false,
      employer_id
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Check if we have employer_id or company name
    if (!employer_id && !company) {
      return NextResponse.json(
        { error: 'Either employer_id or company name is required' },
        { status: 400 }
      );
    }

    // Send request to FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        requirements: requirements || null,
        benefits: benefits || null,
        employment_type: employment_type || 'full-time',
        salary_min: salary_min ? parseInt(salary_min) : null,
        salary_max: salary_max ? parseInt(salary_max) : null,
        location: location || null,
        remote_friendly,
        urgent,
        employer_id: employer_id || null,
        company_name: company || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('FastAPI error:', response.status, errorData);
      
      return NextResponse.json(
        { error: errorData.detail || 'Failed to create job post' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in jobs POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}