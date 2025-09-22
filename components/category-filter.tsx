'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useBrands } from '@/hooks/use-brands';
import { useCategoryFilterData } from '@/hooks/use-category-filter-data';

interface Category {
  id: string;
  name: string;
  subcategories?: string[]; // make it optional
}

interface Filters {
  subcategory: string;
  brand: string[];
  minPrice: number;
  maxPrice: number;
  sort: string;
}

interface CategoryFilterProps {
  category?: Category; // make it optional to avoid crashes
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function CategoryFilter({ category, filters, onFiltersChange }: CategoryFilterProps) {
  const { brands = [], loading: brandsLoading } = useBrands();
  
  // Get products in this category to show relevant brands only
  // Uses a separate hook to avoid conflicts with main products list
  const { products: categoryProducts } = useCategoryFilterData({
    categoryId: category?.id
  });

  // Fallback subcategories based on category name
  const getFallbackSubcategories = (categoryName: string): string[] => {
    const name = categoryName.toLowerCase();
    if (name.includes('makeup')) {
      return ['Foundation & Concealer', 'Lipsticks', 'Eye Makeup', 'Blush & Bronzer', 'Makeup Tools', 'Face Powder'];
    } else if (name.includes('skincare')) {
      return ['Moisturizers', 'Cleansers', 'Serums & Treatments', 'Sunscreen', 'Face Masks', 'Toners'];
    } else if (name.includes('haircare')) {
      return ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Styling', 'Hair Masks', 'Hair Color'];
    } else if (name.includes('fragrance')) {
      return ['Perfumes', 'Body Spray', 'Eau de Toilette', 'Cologne', 'Fragrance Sets', 'Roll-on'];
    } else if (name.includes('bodycare')) {
      return ['Body Lotion', 'Body Wash', 'Body Scrubs', 'Deodorants', 'Body Oil', 'Hand Care'];
    } else if (name.includes('clothing')) {
      return ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Underwear', 'Accessories'];
    } else if (name.includes('electronics')) {
      return ['Smartphones', 'Laptops', 'Tablets', 'Audio', 'Gaming', 'Accessories'];
    } else if (name.includes('furniture')) {
      return ['Chairs', 'Tables', 'Storage', 'Bedroom', 'Lighting', 'Decor'];
    } else if (name.includes('protein')) {
      return ['Whey Protein', 'Casein Protein', 'Plant Protein', 'Mass Gainers', 'BCAA', 'Creatine'];
    }
    return [];
  };

  // Get subcategories from actual products in this category
  const dynamicSubcategories = categoryProducts.length > 0 
    ? Array.from(new Set(categoryProducts.map(p => p.subcategory))).filter(Boolean).sort()
    : [];
  
  // Use dynamic subcategories if available, otherwise use fallback based on category name
  const safeSubcategories = dynamicSubcategories.length > 0 
    ? dynamicSubcategories 
    : category ? getFallbackSubcategories(category.name) : [];
  
  // Filter brands to show only those available in this category
  const categoryBrands = categoryProducts.length > 0 
    ? Array.from(new Set(categoryProducts.map(p => p.brand))).filter(Boolean).sort()
    : brands;

  const clearFilters = () => {
    onFiltersChange({
      subcategory: '',
      brand: [],
      minPrice: 0,
      maxPrice: 100000,
      sort: 'featured'
    });
  };

  const updateFilters = (updates: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Subcategories */}
      <div>
        <h4 className="font-medium mb-3">Category</h4>
        <div className="space-y-2">
          {safeSubcategories.length > 0 ? (
            safeSubcategories.map((subcategory) => (
              <div key={subcategory} className="flex items-center space-x-2">
                <Checkbox
                  id={subcategory}
                  checked={filters.subcategory === subcategory}
                  onCheckedChange={(checked) => {
                    updateFilters({
                      subcategory: checked ? subcategory : ''
                    });
                  }}
                />
                <Label htmlFor={subcategory} className="text-sm">
                  {subcategory}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No subcategories available</p>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-medium mb-3">Price Range</h4>
        <div className="space-y-4">
          <Slider
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={([min, max]) => updateFilters({ minPrice: min, maxPrice: max })}
            max={100000}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹{filters.minPrice}</span>
            <span>₹{filters.maxPrice}</span>
          </div>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="font-medium mb-3">Brands</h4>
        <div className="space-y-2">
          {brandsLoading ? (
            // Loading skeleton
            [...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            ))
          ) : categoryBrands.length > 0 ? (
            categoryBrands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2 justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={brand}
                    checked={filters.brand.includes(brand)}
                    onCheckedChange={(checked) => {
                      const newBrands = checked
                        ? [...filters.brand, brand]
                        : filters.brand.filter((b) => b !== brand);
                      updateFilters({ brand: newBrands });
                    }}
                  />
                  <Label htmlFor={brand} className="text-sm">{brand}</Label>
                </div>
                <span className="text-xs text-gray-400">
                  ({categoryProducts.filter(p => p.brand === brand).length})
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No brands available</p>
          )}
        </div>
      </div>

      {/* Stock Status */}
      <div>
        <h4 className="font-medium mb-3">Availability</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="inStock" />
              <Label htmlFor="inStock" className="text-sm">In Stock</Label>
            </div>
            <span className="text-xs text-gray-400">
              ({categoryProducts.filter(p => p.stock > 0).length})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="onSale" />
              <Label htmlFor="onSale" className="text-sm">On Sale</Label>
            </div>
            <span className="text-xs text-gray-400">
              ({categoryProducts.filter(p => p.originalPrice && p.originalPrice > p.price).length})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="featured" />
              <Label htmlFor="featured" className="text-sm">Featured</Label>
            </div>
            <span className="text-xs text-gray-400">
              ({categoryProducts.filter(p => (p as any).isFeatured).length})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
