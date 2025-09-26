'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '@/hooks/use-categories';
import { getImageUrl } from '@/lib/image-utils';

const categoryImages = {
  'makeup': 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg',
  'skincare': 'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg',
  'haircare': 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg',
  'fragrance': 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg',
  'bodycare': 'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg'
};

export function CategoryShowcase() {
  const { categories, loading, error } = useCategories();

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our curated collection across all beauty categories
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="aspect-square mb-4 rounded-full bg-gray-200"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-red-600">Failed to load categories: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our curated collection across all beauty categories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id}
              href={`/category/${category.slug.split('-')[0]}`}  
              className="group"
            >
              <div className="text-center">
                <div className="relative aspect-square mb-4 overflow-hidden rounded-full bg-gradient-to-br from-rose-100 to-pink-100">
                  <Image
                    src={getImageUrl(
                      category.image || (categoryImages[category.slug as keyof typeof categoryImages] as string) || '/placeholder-image.svg'
                    )}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.svg';
                    }}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">
                  {category.name}
                </h3>
                {category.productCount && (
                  <p className="text-sm text-gray-500 mt-1">
                    {category.productCount} products
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}