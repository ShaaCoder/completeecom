"use client";

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Star, Heart, Share2, Shield, Truck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductGallery } from '@/components/product-gallery';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { getCategoryName, getCategoryLink } from '@/lib/category-utils';
import { generateProductStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo-utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  category: any;
  subcategory?: string;
  brand: string;
  stock: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  features: string[];
  ingredients?: string[];
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  sku?: string;
  color?: string;
  size?: string;
  weight?: any;
  material?: string;
  scent?: string;
  gender?: string;
  ageGroup?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  allergens?: string[];
  dietaryInfo?: string[];
  skinType?: string[];
  hairType?: string[];
  variants?: any[];
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  seo?: any;
}

interface ProductPageClientProps {
  slug: string;
}

export default function ProductPageClient({ slug }: ProductPageClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Set hydrated to true on client-side
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${slug}`);
        const data = await response.json();
        
        if (data.success) {
          setProduct(data.data);
          
          // Inject structured data for SEO after product loads
          const structuredDataScript = document.createElement('script');
          structuredDataScript.type = 'application/ld+json';
          structuredDataScript.innerHTML = JSON.stringify(generateProductStructuredData(data.data));
          document.head.appendChild(structuredDataScript);
          
          if (data.data.breadcrumbs) {
            const breadcrumbScript = document.createElement('script');
            breadcrumbScript.type = 'application/ld+json';
            breadcrumbScript.innerHTML = JSON.stringify(generateBreadcrumbStructuredData(data.data.breadcrumbs));
            document.head.appendChild(breadcrumbScript);
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, isHydrated]);

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return null;
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    notFound();
  }

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      {product.breadcrumbs && (
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {product.breadcrumbs.map((crumb, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && (
                  <svg className="w-6 h-6 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <a
                  href={crumb.url}
                  className={`inline-flex items-center text-sm font-medium ${
                    index === product.breadcrumbs!.length - 1
                      ? 'text-gray-500 cursor-default'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {crumb.name}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Product Images */}
          <div className="relative bg-gray-50 p-8">
            <ProductGallery images={product.images} alt={product.name} />
          </div>

          {/* Product Info */}
          <div className="p-8 space-y-6">
            {/* Brand and Category */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-900">{product.brand}</span>
              <span className="text-gray-400">•</span>
              <a 
                href={getCategoryLink(product)} 
                className="text-rose-600 hover:text-rose-700 hover:underline font-medium"
              >
                {getCategoryName(product)}
              </a>
            </div>
            
            {/* Product Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.rating) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'fill-gray-200 text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl lg:text-4xl font-bold text-gray-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-gray-500 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <Badge className="bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1">
                    {discount}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3 pt-4">
              <AddToCartButton 
                product={product} 
                className="flex-1 h-12 text-base font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                disabled={product.stock === 0}
              />
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-lg border-gray-300">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-lg border-gray-300">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-6 py-8 border-t border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm font-medium text-gray-900">100% Authentic</div>
                <div className="text-xs text-gray-500 mt-1">Verified Products</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-gray-900">Free Delivery</div>
                <div className="text-xs text-gray-500 mt-1">Above ₹499</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <RotateCcw className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-sm font-medium text-gray-900">Easy Returns</div>
                <div className="text-xs text-gray-500 mt-1">30-Day Policy</div>
              </div>
            </div>

            {/* Product Badges */}
            {(product.isNew || product.isBestseller || product.isFeatured) && (
              <div className="flex gap-2 pt-4">
                {product.isNew && <Badge className="bg-green-500 hover:bg-green-600 text-white">New</Badge>}
                {product.isBestseller && <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Bestseller</Badge>}
                {product.isFeatured && <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Featured</Badge>}
              </div>
            )}
          </div>
        </div>
        
        {/* Product Details Tabs */}
        <div className="border-t border-gray-100 p-8">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-50 p-1 rounded-lg">
              <TabsTrigger 
                value="description" 
                className="font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="features" 
                className="font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Features
              </TabsTrigger>
              <TabsTrigger 
                value="ingredients" 
                className="font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Ingredients
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-8">
              <div className="prose max-w-none">
                <p className="text-gray-700 text-base leading-relaxed">{product.description}</p>
                
                {/* Additional product details */}
                {(product.brand || product.manufacturer) && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    {product.brand && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Brand</dt>
                        <dd className="mt-1 text-sm text-gray-900">{product.brand}</dd>
                      </div>
                    )}
                    {product.manufacturer && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                        <dd className="mt-1 text-sm text-gray-900">{product.manufacturer}</dd>
                      </div>
                    )}
                    {product.countryOfOrigin && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Country of Origin</dt>
                        <dd className="mt-1 text-sm text-gray-900">{product.countryOfOrigin}</dd>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="mt-8">
              {product.features && product.features.length > 0 ? (
                <div className="grid gap-3">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-800 leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No features information available for this product.</p>
              )}
            </TabsContent>
            
            <TabsContent value="ingredients" className="mt-8">
              {product.ingredients && product.ingredients.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Allergen Information */}
                  {product.allergens && product.allergens.length > 0 && (
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Allergen Information</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.allergens.map((allergen, index) => (
                          <Badge key={index} className="bg-orange-200 text-orange-800 hover:bg-orange-300">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No ingredient information available for this product.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}