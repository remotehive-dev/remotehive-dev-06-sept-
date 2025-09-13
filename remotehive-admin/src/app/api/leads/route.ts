import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';

    // Build filters for FastAPI
    const filters: any = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company_name: { $regex: search, $options: 'i' } }
      ];
    }
    if (type !== 'all') {
      filters.type = type;
    }
    if (status !== 'all') {
      filters.status = status;
    }

    const response = await apiClient.getItems('leads', {
      filters,
      sort: { created_at: -1 },
      limit,
      skip: (page - 1) * limit,
      populate: ['assigned_to']
    });

    if (response.error) {
      console.error('Error fetching leads:', response.error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    const data = response.data || [];
    const count = response.total || 0;

    // Transform data to include assigned employee name
    const transformedData = data.map(lead => ({
      ...lead,
      assigned_to_name: lead.assigned_to?.full_name || null
    }));

    return NextResponse.json({ data: transformedData, count });
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

    // Check if lead already exists for this email
    const existingResponse = await apiClient.getItems('leads', {
      filters: { email },
      limit: 1
    });

    if (existingResponse.data && existingResponse.data.length > 0) {
      return NextResponse.json(
        { error: 'Lead already exists for this email' },
        { status: 409 }
      );
    }

    // Create new lead
    const leadData = {
      name,
      email,
      phone,
      company_name,
      address,
      source,
      type,
      status: 'new',
      user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    const response = await apiClient.createItem('leads', leadData);

    if (response.error) {
      console.error('Error creating lead:', response.error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    const data = response.data;

    // Create notification for new lead
    await apiClient.createItem('notifications', {
      message: `New ${type} lead: ${name}${company_name ? ` from ${company_name}` : ''}`,
      type: 'new_lead',
      data: { lead_id: data.id },
      created_at: new Date().toISOString(),
      read: false
    });

    return NextResponse.json({ data }, { status: 201 });
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

    // Get current lead data
    const currentResponse = await apiClient.getItems('leads', {
      filters: { _id: id },
      limit: 1
    });

    if (!currentResponse.data || currentResponse.data.length === 0) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const currentLead = currentResponse.data[0];

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (notes !== undefined) updateData.notes = notes;

    // Update lead
    const response = await apiClient.updateItem('leads', id, updateData);

    if (response.error) {
      console.error('Error updating lead:', response.error);
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    const data = response.data;

    // Create notification for assignment change
    if (assigned_to && assigned_to !== currentLead.assigned_to) {
      const employeeResponse = await apiClient.getItems('users', {
        filters: { _id: assigned_to },
        limit: 1
      });

      if (employeeResponse.data && employeeResponse.data.length > 0) {
        const employee = employeeResponse.data[0];
        await apiClient.createItem('notifications', {
          message: `Lead ${currentLead.name} assigned to ${employee.full_name}`,
          type: 'lead_assigned',
          data: { lead_id: id, assigned_to },
          created_at: new Date().toISOString(),
          read: false
        });
      }
    }

    // Get updated lead with populated assigned_to
    const updatedResponse = await apiClient.getItems('leads', {
      filters: { _id: id },
      limit: 1,
      populate: ['assigned_to']
    });

    const updatedLead = updatedResponse.data?.[0] || data;

    // Transform data to include assigned employee name
    const transformedData = {
      ...updatedLead,
      assigned_to_name: updatedLead.assigned_to?.full_name || null
    };

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('Error in leads PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}