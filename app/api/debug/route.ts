import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const categories = await Category.find({}).lean();
    const products = await Product.find({}).populate('category', 'name slug').lean();
    
    const debug = {
      categories: categories.map(c => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        isActive: c.isActive
      })),
      products: products.map(p => ({
        id: p._id.toString(),
        name: p.name,
        category: p.category ? {
          id: (p.category as any)._id?.toString() || p.category.toString(),
          name: (p.category as any).name || 'Unknown',
          slug: (p.category as any).slug || 'unknown'
        } : null,
        isActive: p.isActive
      })),
      summary: {
        totalCategories: categories.length,
        totalProducts: products.length,
        activeCategories: categories.filter(c => c.isActive).length,
        activeProducts: products.filter(p => p.isActive).length,
        productsByCategory: categories.map(cat => ({
          category: cat.name,
          count: products.filter(p => 
            p.category && 
            ((p.category as any)._id?.toString() === cat._id.toString() || 
             p.category.toString() === cat._id.toString())
          ).length
        }))
      }
    };
    
    return NextResponse.json(debug, { status: 200 });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug data' }, { status: 500 });
  }
}