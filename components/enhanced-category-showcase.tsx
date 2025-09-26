'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/use-categories';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getImageUrl } from '@/lib/image-utils';

interface CategoryStats {
  totalProducts: number;
  activeCategories: number;
  featuredCategories: number;
}

export function EnhancedCategoryShowcase() {
  const { categories, loading, error, refetch } = useCategories();
  const [stats, setStats] = useState<CategoryStats>({
    totalProducts: 0,
    activeCategories: 0,
    featuredCategories: 0
  });

  // Calculate statistics
  useEffect(() => {
    if (categories.length > 0) {
      const totalProducts = categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
      const activeCategories = categories.filter(cat => cat.isActive).length;
      const featuredCategories = categories.filter(cat => cat.isFeatured).length;

      setStats({
        totalProducts,
        activeCategories,
        featuredCategories
      });
    }
  }, [categories]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (loading) {
    return <CategoryShowcaseSkeleton />;
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Categories</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={refetch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  const featuredCategories = categories.filter(cat => cat.isFeatured && cat.isActive);
  const regularCategories = categories.filter(cat => !cat.isFeatured && cat.isActive);

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Statistics */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Explore our curated collection across all beauty categories
          </p>
          
          {/* Live Statistics */}
          <div className="flex justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{stats.totalProducts} Products Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{stats.activeCategories} Active Categories</span>
            </div>
            {stats.featuredCategories > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{stats.featuredCategories} Featured</span>
              </div>
            )}
          </div>
        </div>

        {/* Featured Categories */}
        {featuredCategories.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Featured Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              {featuredCategories.map((category) => (
                <CategoryCard key={category.id} category={category} featured />
              ))}
            </div>
          </div>
        )}

        {/* All Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {regularCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
            <p className="text-gray-600">Categories will appear here once they are added to your store.</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Individual Category Card Component
function CategoryCard({ category, featured = false }: { category: any; featured?: boolean }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <Link 
      href={`/category/${category.slug}`}  
      className="group relative"
    >
      <div className="text-center">
        <div className={`
          relative aspect-square mb-4 overflow-hidden rounded-full 
          bg-gradient-to-br from-rose-100 to-pink-100 
          ${featured ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''}
          group-hover:shadow-lg transition-all duration-300
        `}>
          {/* Featured Badge */}
          {featured && (
            <Badge className="absolute -top-2 -right-2 z-10 bg-yellow-500 text-yellow-900">
              Featured
            </Badge>
          )}

          {/* Category Image */}
          {!imageError && category.image ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                </div>
              )}
              <Image
                src={getImageUrl(category.image)}
                alt={category.name}
                fill
                className={`
                  object-cover group-hover:scale-110 transition-transform duration-300
                  ${imageLoading ? 'opacity-0' : 'opacity-100'}
                `}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17l2.5-3.1L14 17H9z"/>
              </svg>
            </div>
          )}

          {/* New Badge for recently added categories */}
          {isNewCategory(category.createdAt) && (
            <Badge className="absolute -top-2 -left-2 z-10 bg-green-500">
              New
            </Badge>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 group-hover:text-rose-600 transition-colors mb-1">
          {category.name}
        </h3>

        {/* Product Count with Real-time Updates */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          {category.productCount ? (
            <>
              <span className="font-medium text-gray-700">{category.productCount}</span>
              <span>products</span>
            </>
          ) : (
            <span className="text-gray-400">Coming soon</span>
          )}
        </div>

        {/* Description Preview */}
        {category.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {category.description}
          </p>
        )}
      </div>
    </Link>
  );
}

// Loading Skeleton Component
function CategoryShowcaseSkeleton() {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-6" />
          <div className="flex justify-center gap-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="aspect-square mb-4 rounded-full" />
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Helper function to check if category is new (within last 7 days)
function isNewCategory(createdAt: string): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}