import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';

    const supabaseAdmin = createAdminClient();
    
    let query = supabaseAdmin
      .from('leads')
      .select(`
        *,
        assigned_employee:assigned_to(
          id,
          full_name,
          email,
          role
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    if (type !== 'all') {
      query = query.eq('type', type);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // Transform data to include assigned employee name
    const transformedData = data?.map(lead => ({
      ...lead,
      assigned_to_name: lead.assigned_employee?.full_name || null
    })) || [];

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

    const supabaseAdmin = createAdminClient();

    // Check if lead already exists for this email
    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('email', email)
      .single();

    if (existingLead) {
      return NextResponse.json(
        { error: 'Lead already exists for this email' },
        { status: 409 }
      );
    }

    // Create new lead
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Create notification for new lead
    await supabaseAdmin
      .from('notifications')
      .insert({
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

    const supabaseAdmin = createAdminClient();

    // Get current lead data
    const { data: currentLead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (notes !== undefined) updateData.notes = notes;

    // Update lead
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assigned_employee:assigned_to(
          id,
          full_name,
          email,
          role
        )
      `)
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    // Create notification for assignment change
    if (assigned_to && assigned_to !== currentLead.assigned_to) {
      const { data: employee } = await supabaseAdmin
        .from('users')
        .select('full_name')
        .eq('id', assigned_to)
        .single();

      if (employee) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            message: `Lead ${currentLead.name} assigned to ${employee.full_name}`,
            type: 'lead_assigned',
            data: { lead_id: id, assigned_to },
            created_at: new Date().toISOString(),
            read: false
          });
      }
    }

    // Transform data to include assigned employee name
    const transformedData = {
      ...data,
      assigned_to_name: data.assigned_employee?.full_name || null
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