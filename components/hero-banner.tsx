'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '@/hooks/use-categories';

export function HeroBanner() {
  const { categories, loading: categoriesLoading } = useCategories();
  
  // Get the first two categories for the hero buttons
  const firstCategory = categories[0];
  const secondCategory = categories[1];

  return (
    <div className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[500px] py-12">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Beauty 
                <span className="text-rose-600"> Redefined</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-md">
                Discover premium beauty products from top brands. Skincare, makeup, and wellness essentials for your perfect routine.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {categoriesLoading ? (
                // Loading skeleton for buttons
                <>
                  <div className="h-12 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-lg w-36 animate-pulse"></div>
                </>
              ) : (
                <>
                  {firstCategory && (
                    <Link href={`/category/${firstCategory.slug}`}>
                      <Button size="lg" className="bg-rose-600 hover:bg-rose-700">
                        Shop {firstCategory.name}
                      </Button>
                    </Link>
                  )}
                  {secondCategory && (
                    <Link href={`/category/${secondCategory.slug}`}>
                      <Button size="lg" variant="outline" className="border-rose-600 text-rose-600 hover:bg-rose-50">
                        Explore {secondCategory.name}
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Free Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Easy Returns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">100% Authentic</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-square max-w-md mx-auto">
              <Image
                src="https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg"
                alt="Beauty Products"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover rounded-2xl shadow-2xl"
              />
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-600">50%</div>
                  <div className="text-xs text-gray-600">OFF</div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">In Stock</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}