import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    support: {
      email: 'support@yourecommerce.com',
      phone: '+1-800-123-4567',
      hours: 'Mon-Fri 9AM-6PM EST',
      liveChatAvailable: true
    },
    faq: [
      {
        question: 'How can I track my order?',
        answer: 'You can track your order using the tracking number sent to your email or by visiting the track order page.'
      },
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for unused items in original packaging.'
      },
      {
        question: 'How long does shipping take?',
        answer: 'Standard shipping takes 3-5 business days, expedited shipping takes 1-2 business days.'
      }
    ]
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, orderId } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Here you would typically save to database and/or send email
    console.log('Customer care inquiry received:', {
      name,
      email,
      subject,
      message,
      orderId: orderId || 'N/A',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been submitted successfully. We will get back to you within 24 hours.',
      ticketId: `TICKET-${Date.now()}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}