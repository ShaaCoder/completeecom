import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured');
  const category = searchParams.get('category');

  // Mock brands data - you would fetch this from your database
  const allBrands = [
    {
      id: '1',
      name: 'Premium Nutrition',
      slug: 'premium-nutrition',
      description: 'High-quality protein supplements',
      logo: '/uploads/brand-premium-nutrition.jpg',
      featured: true,
      categories: ['protein', 'supplements'],
      productCount: 25
    },
    {
      id: '2',
      name: 'FitLife',
      slug: 'fitlife',
      description: 'Complete fitness nutrition solutions',
      logo: '/uploads/brand-fitlife.jpg',
      featured: true,
      categories: ['protein', 'fitness', 'vitamins'],
      productCount: 18
    },
    {
      id: '3',
      name: 'MuscleTech',
      slug: 'muscletech',
      description: 'Professional bodybuilding supplements',
      logo: '/uploads/brand-muscletech.jpg',
      featured: false,
      categories: ['protein', 'creatine', 'pre-workout'],
      productCount: 32
    },
    {
      id: '4',
      name: 'Nature\'s Best',
      slug: 'natures-best',
      description: 'Natural and organic supplements',
      logo: '/uploads/brand-natures-best.jpg',
      featured: true,
      categories: ['vitamins', 'organic'],
      productCount: 15
    }
  ];

  let brands = allBrands;

  // Filter by featured if requested
  if (featured === 'true') {
    brands = brands.filter(brand => brand.featured);
  }

  // Filter by category if requested
  if (category) {
    brands = brands.filter(brand => 
      brand.categories.includes(category.toLowerCase())
    );
  }

  return NextResponse.json({
    brands,
    total: brands.length,
    featured: brands.filter(b => b.featured).length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, logo, categories, featured = false } = body;

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Here you would typically save to database
    const newBrand = {
      id: Date.now().toString(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      logo: logo || '/placeholder-image.svg',
      featured,
      categories: categories || [],
      productCount: 0,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Brand created successfully',
      brand: newBrand
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}