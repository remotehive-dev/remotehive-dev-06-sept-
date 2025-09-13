import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const type = searchParams.get('type'); // 'new_lead', 'lead_assigned', 'lead_updated'

    // Build filters
    const filters: any = {};
    if (unreadOnly) {
      filters.read = false;
    }
    if (type) {
      filters.type = type;
    }

    const response = await apiClient.getItems('notifications', {
      select: ['*'],
      filters,
      sort: [{ field: 'created_at', direction: 'desc' }],
      limit,
      offset: (page - 1) * limit
    });

    if (response.error) {
      console.error('Error fetching notifications:', response.error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    const data = response.data || [];
    const count = response.total || 0;

    return NextResponse.json({ data, count });
  } catch (error) {
    console.error('Error in notifications API:', error);
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
      message,
      type, // 'new_lead', 'lead_assigned', 'lead_updated'
      data: notificationData,
      recipient_id // Optional: specific user to notify
    } = body;

    // Validate required fields
    if (!message || !type) {
      return NextResponse.json(
        { error: 'Message and type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['new_lead', 'lead_assigned', 'lead_updated', 'system'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create notification
    const response = await apiClient.createItem('notifications', {
      message,
      type,
      data: notificationData || {},
      recipient_id,
      created_at: new Date().toISOString(),
      read: false
    });

    if (response.error) {
      console.error('Error creating notification:', response.error);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: response.data }, { status: 201 });
  } catch (error) {
    console.error('Error in notifications POST API:', error);
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
      ids, // Array of notification IDs to update
      read = true // Mark as read/unread
    } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    // Update notifications
    const response = await apiClient.updateItems('notifications', {
      filters: { id: { $in: ids } },
      updates: {
        read,
        updated_at: new Date().toISOString()
      }
    });

    if (response.error) {
      console.error('Error updating notifications:', response.error);
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: response.data });
  } catch (error) {
    console.error('Error in notifications PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const olderThan = searchParams.get('older_than'); // ISO date string

    if (id) {
      // Delete specific notification
      const response = await apiClient.deleteItem('notifications', id);

      if (response.error) {
        console.error('Error deleting notification:', response.error);
        return NextResponse.json(
          { error: 'Failed to delete notification' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Notification deleted successfully' });
    } else if (olderThan) {
      // Delete notifications older than specified date
      const response = await apiClient.deleteItems('notifications', {
        created_at: { $lt: olderThan }
      });

      if (response.error) {
        console.error('Error deleting old notifications:', response.error);
        return NextResponse.json(
          { error: 'Failed to delete old notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Old notifications deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Either id or older_than parameter is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in notifications DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}