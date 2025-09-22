import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');
  const type = searchParams.get('type');

  // Mock offers data - you would fetch this from your database
  const currentDate = new Date();
  const futureDate = new Date();
  futureDate.setDate(currentDate.getDate() + 30);

  const allOffers = [
    {
      id: '1',
      title: '20% Off All Protein Supplements',
      description: 'Get 20% discount on all protein powders and bars',
      code: 'PROTEIN20',
      type: 'percentage',
      value: 20,
      minAmount: 50,
      active: true,
      startDate: currentDate.toISOString(),
      endDate: futureDate.toISOString(),
      categories: ['protein'],
      usageLimit: 1000,
      usageCount: 234
    },
    {
      id: '2',
      title: 'Free Shipping on Orders Over $75',
      description: 'Enjoy free shipping on all orders above $75',
      code: 'FREESHIP75',
      type: 'shipping',
      value: 0,
      minAmount: 75,
      active: true,
      startDate: currentDate.toISOString(),
      endDate: futureDate.toISOString(),
      categories: [],
      usageLimit: null,
      usageCount: 892
    },
    {
      id: '3',
      title: '$10 Off First Order',
      description: 'New customer? Get $10 off your first purchase',
      code: 'WELCOME10',
      type: 'fixed',
      value: 10,
      minAmount: 25,
      active: true,
      startDate: currentDate.toISOString(),
      endDate: futureDate.toISOString(),
      categories: [],
      usageLimit: 1,
      usageCount: 156,
      newCustomerOnly: true
    },
    {
      id: '4',
      title: 'Buy 2 Get 1 Free Vitamins',
      description: 'Buy any 2 vitamin products and get 1 free',
      code: 'B2G1VITAMINS',
      type: 'bogo',
      value: 0,
      minAmount: 0,
      active: true,
      startDate: currentDate.toISOString(),
      endDate: futureDate.toISOString(),
      categories: ['vitamins'],
      usageLimit: 500,
      usageCount: 78
    },
    {
      id: '5',
      title: 'Black Friday 50% Off (Expired)',
      description: 'Massive Black Friday discount',
      code: 'BLACKFRIDAY50',
      type: 'percentage',
      value: 50,
      minAmount: 100,
      active: false,
      startDate: '2023-11-24T00:00:00Z',
      endDate: '2023-11-27T23:59:59Z',
      categories: [],
      usageLimit: 10000,
      usageCount: 9876
    }
  ];

  let offers = allOffers;

  // Filter by active status if requested
  if (active === 'true') {
    offers = offers.filter(offer => offer.active);
  } else if (active === 'false') {
    offers = offers.filter(offer => !offer.active);
  }

  // Filter by type if requested
  if (type) {
    offers = offers.filter(offer => offer.type === type);
  }

  return NextResponse.json({
    offers,
    total: offers.length,
    active: offers.filter(o => o.active).length,
    expired: offers.filter(o => !o.active).length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      code, 
      type, 
      value, 
      minAmount, 
      startDate, 
      endDate, 
      categories = [],
      usageLimit 
    } = body;

    // Validate required fields
    if (!title || !description || !code || !type || value === undefined) {
      return NextResponse.json(
        { error: 'Title, description, code, type, and value are required' },
        { status: 400 }
      );
    }

    // Validate offer type
    const validTypes = ['percentage', 'fixed', 'shipping', 'bogo'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid offer type. Must be: percentage, fixed, shipping, or bogo' },
        { status: 400 }
      );
    }

    // Here you would typically save to database
    const newOffer = {
      id: Date.now().toString(),
      title,
      description,
      code: code.toUpperCase(),
      type,
      value,
      minAmount: minAmount || 0,
      active: true,
      startDate: startDate || new Date().toISOString(),
      endDate,
      categories,
      usageLimit,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Offer created successfully',
      offer: newOffer
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// Validate offer code
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal = 0 } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Offer code is required' },
        { status: 400 }
      );
    }

    // Mock validation - you would check against database
    const mockOffers = [
      { code: 'PROTEIN20', type: 'percentage', value: 20, minAmount: 50, active: true },
      { code: 'FREESHIP75', type: 'shipping', value: 0, minAmount: 75, active: true },
      { code: 'WELCOME10', type: 'fixed', value: 10, minAmount: 25, active: true }
    ];

    const offer = mockOffers.find(o => o.code === code.toUpperCase());

    if (!offer) {
      return NextResponse.json(
        { error: 'Invalid offer code' },
        { status: 404 }
      );
    }

    if (!offer.active) {
      return NextResponse.json(
        { error: 'This offer has expired' },
        { status: 400 }
      );
    }

    if (cartTotal < offer.minAmount) {
      return NextResponse.json(
        { error: `Minimum order amount is $${offer.minAmount}` },
        { status: 400 }
      );
    }

    let discount = 0;
    if (offer.type === 'percentage') {
      discount = (cartTotal * offer.value) / 100;
    } else if (offer.type === 'fixed') {
      discount = offer.value;
    }

    return NextResponse.json({
      success: true,
      offer,
      discount,
      message: 'Offer code applied successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}