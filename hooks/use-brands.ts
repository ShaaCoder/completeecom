'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface UseBrandsReturn {
  brands: string[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBrands(): UseBrandsReturn {
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch products to extract unique brands
      const response = await apiClient.getProducts({ limit: 1000 }); // Get more products to have better brand coverage
      
      if (response.success && response.data) {
        // Extract unique brands from products
        const uniqueBrands = Array.from(new Set(
          response.data
            .map((product: any) => product.brand)
            .filter((brand: string) => brand && brand.trim() !== '')
        )).sort();
        
        setBrands(uniqueBrands);
      } else {
        setError(response.message || 'Failed to fetch brands');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return {
    brands,
    loading,
    error,
    refetch: fetchBrands,
  };
}
