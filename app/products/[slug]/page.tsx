import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Star, Heart, Share2, ShoppingCart, Shield, Truck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductGallery } from '@/components/product-gallery';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { getCategoryName, getCategoryLink } from '@/lib/category-utils';
import { generateProductMetadata, generateProductStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo-utils';
import ProductPageClient from './product-page-client';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    // Fetch product data for metadata generation
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products/${params.slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      return {
        title: 'Product Not Found | BeautyMart',
        description: 'The requested product could not be found.'
      };
    }
    
    const { data: product } = await response.json();
    
    if (!product) {
      return {
        title: 'Product Not Found | BeautyMart',
        description: 'The requested product could not be found.'
      };
    }

    // Generate comprehensive metadata using our SEO utils
    return generateProductMetadata(product);
  } catch (error) {
    return {
      title: 'BeautyMart - Premium Beauty Products',
      description: 'Discover premium beauty products at BeautyMart.'
    };
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Client-side product page component */}
      <ProductPageClient slug={params.slug} />
      
      <Footer />
    </div>
  );
}
