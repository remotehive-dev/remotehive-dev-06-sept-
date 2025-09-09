import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''

    // Build query parameters for FastAPI backend
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })

    if (search) {
      queryParams.append('search', search)
    }

    const response = await fetch(`${API_BASE_URL}/api/employers?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
    })

    if (!response.ok) {
      console.error('FastAPI error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch employers' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      data: data.employers || [],
      total: data.total || 0,
      limit: data.limit || limit,
      offset: data.offset || offset
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_name, company_email, industry, location, company_size, company_description, company_website } = body

    // Validate required fields
    if (!company_name || !company_email) {
      return NextResponse.json(
        { error: 'Company name and email are required' },
        { status: 400 }
      )
    }

    // Send request to FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/employers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
      body: JSON.stringify({
        company_name,
        company_email,
        company_website: company_website || null,
        industry: industry || null,
        location: location || null,
        company_size: company_size || null,
        company_description: company_description || null
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('FastAPI error:', response.status, errorData)
      
      // Handle specific error cases
      if (response.status === 409) {
        return NextResponse.json(
          { error: 'Company with this email already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: errorData.detail || 'Failed to create employer' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}