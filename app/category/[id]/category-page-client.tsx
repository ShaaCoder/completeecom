"use client";

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { CategoryFilter } from '@/components/category-filter';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { useCategories } from '@/hooks/use-categories';
import { useProducts } from '@/hooks/use-products';

interface CategoryPageClientProps {
  id: string;
}

export default function CategoryPageClient({ id }: CategoryPageClientProps) {
  const [filters, setFilters] = useState({
    subcategory: '',
    brand: [] as string[],
    minPrice: 0,
    maxPrice: 100000, // Increased to show all products including expensive ones
    sort: 'featured'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(6); // Changed to 6 to show pagination

  const { categories, loading: categoriesLoading } = useCategories();
  
  // Try multiple ways to find the category:
  // 1. Exact slug match
  // 2. ID match  
  // 3. Slug that starts with the param (for timestamped slugs like 'electronics-234100')
  // 4. Case-insensitive slug match
  // 5. Name-based matching
  const category = categories.find(c => {
    const matches = [
      c.slug === id,                                                    // electronics-234100 === electronics-234100
      c.id === id,                                                      // exact ID match
      c.slug.startsWith(id + '-'),                                      // electronics-234100.startsWith('electronics-')
      c.slug.toLowerCase() === id.toLowerCase(),                        // case insensitive
      c.name.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase(),  // 'Electronics' -> 'electronics'
      c.slug.split('-')[0] === id,                                      // 'electronics-234100'.split('-')[0] === 'electronics'
      c.slug.split('-')[0].toLowerCase() === id.toLowerCase()           // case insensitive version
    ];
    return matches.some(Boolean);
  });
  
  // Use the found category ID if available, otherwise use provided id (slug)
  const categoryParam = category?.id || id;
  
  const { products: categoryProducts, loading, error, pagination } = useProducts({
    category: categoryParam, // Use category ID if found, otherwise slug
    subcategory: filters.subcategory || undefined,
    brand: filters.brand.length > 0 ? filters.brand : undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    page: currentPage,
    limit: productsPerPage
  });
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, id]);
  
  if (categoriesLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </main>
    );
  }
  
  if (!categoriesLoading && !category) {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category?.name ?? "Category"}</h1>
        <p className="text-gray-600">
          Explore our collection of {(category?.name?.toLowerCase() ?? "category")} products ({pagination?.total || categoryProducts.length} items)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <CategoryFilter 
            category={category} 
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Products grid */}
        <div className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{pagination?.total || categoryProducts.length} Products</span>
              <select 
                value={productsPerPage}
                onChange={(e) => {
                  setProductsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value={6}>6 per page</option>
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
              </select>
            </div>
            <select 
              className="border rounded-lg px-3 py-2 text-sm"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Best Rated</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load products: {error}</p>
            </div>
          ) : categoryProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No products found in this category.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* Custom Pagination Controls */}
              {(() => {
                const totalItems = pagination?.total || categoryProducts.length;
                const correctTotalPages = Math.ceil(totalItems / productsPerPage);
                
                return correctTotalPages > 1 ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, totalItems)} of {totalItems} products
                    </div>
                    
                    <CustomPagination
                      currentPage={currentPage}
                      totalPages={correctTotalPages}
                      onPageChange={setCurrentPage}
                      showFirstLast={true}
                    />
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
