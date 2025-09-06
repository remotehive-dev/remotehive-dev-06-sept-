import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Make request to the backend API to get Slack configuration
    const backendUrl = `http://localhost:8001/api/v1/admin/slack/config`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Slack configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Slack configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { webhook_url, channel_name, bot_name, enabled, notifications } = body;

    // Validate required fields
    if (!webhook_url && enabled) {
      return NextResponse.json(
        { error: 'Webhook URL is required when Slack is enabled' },
        { status: 400 }
      );
    }

    // Make request to the backend API to save Slack configuration
    const backendUrl = `http://localhost:8001/api/v1/admin/slack/config`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        webhook_url,
        channel_name,
        bot_name,
        enabled,
        notifications
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving Slack configuration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save Slack configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Make request to the backend API to update Slack configuration
    const backendUrl = `http://localhost:8001/api/v1/admin/slack/config`;
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating Slack configuration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update Slack configuration' },
      { status: 500 }
    );
  }
}