'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Product } from '@/types';

interface UseProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: string;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalItems: number; // Add totalItems for compatibility
    pages: number;
  } | null;
  refetch: () => void;
}

export function useProducts(params: UseProductsParams = {}): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalItems: number;
    pages: number;
  } | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean up undefined values
      const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'brand' && Array.isArray(value) && value.length === 0) {
            // Skip empty brand arrays
            return acc;
          }
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      const response = await apiClient.getProducts(cleanParams);
      
      if (response.success) {
        setProducts(response.data || []);
        // Map pagination response to include totalItems for compatibility
        if (response.pagination) {
          // Handle different pagination response structures
          const apiPagination = response.pagination as any;
          setPagination({
            page: apiPagination.currentPage || apiPagination.page || 1,
            limit: apiPagination.itemsPerPage || apiPagination.limit || 24,
            total: apiPagination.totalItems || apiPagination.total || 0,
            totalItems: apiPagination.totalItems || apiPagination.total || 0,
            pages: apiPagination.totalPages || apiPagination.pages || 0
          });
        } else {
          setPagination(null);
        }
      } else {
        setError(response.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('💥 Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    params.page,
    params.limit,
    params.category,
    params.subcategory,
    JSON.stringify(params.brand), // Convert array to string for comparison
    params.minPrice,
    params.maxPrice,
    params.search,
    params.sort
  ]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
  };
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.getFeaturedProducts();
        
        if (response.success) {
          setProducts(response.data || []);
        } else {
          setError(response.message || 'Failed to fetch featured products');
        }
      } catch (err) {
        console.error('💥 Error fetching featured products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch featured products');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return { products, loading, error };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.getProductBySlug(slug);
        
        if (response.success) {
          setProduct(response.data);
        } else {
          setError(response.message || 'Product not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  return { product, loading, error };
}