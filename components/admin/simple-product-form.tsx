'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package2 } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';

interface SimpleProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand: string;
  stock: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  features: string[];
  ingredients: string[];
  isNewProduct: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  // Optional extended fields
  allergens?: string[];
  dietaryInfo?: string[];
  skinType?: string[];
  hairType?: string[];
  careInstructions?: string[];
  certifications?: string[];
  keywords?: string[];
}

interface SimpleProductFormProps {
  initialData?: Partial<SimpleProductFormData>;
  onSubmit: (data: SimpleProductFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export function SimpleProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  errors = {}
}: SimpleProductFormProps) {
  const { categories } = useCategories();
  const [formData, setFormData] = useState<SimpleProductFormData>({
    name: '',
    description: '',
    price: 0,
    originalPrice: undefined,
    images: [''],
    category: '',
    subcategory: '',
    brand: '',
    stock: 0,
    rating: 0,
    reviewCount: 0,
    tags: [],
    features: [],
    ingredients: [],
    isNewProduct: false,
    isBestseller: false,
    isFeatured: false,
    ...initialData
  });

  const updateFormData = (updates: Partial<SimpleProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addToArray = (field: keyof SimpleProductFormData, value: string) => {
    const current = formData[field] as string[] || [];
    if (value && !current.includes(value)) {
      updateFormData({ [field]: [...current, value] });
    }
  };

  const removeFromArray = (field: keyof SimpleProductFormData, index: number) => {
    const current = formData[field] as string[] || [];
    updateFormData({ [field]: current.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Package2 className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Product' : 'Create New Product'}
          </h2>
          <p className="text-gray-600">Fill in the essential product information below</p>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <Input 
                value={formData.name} 
                onChange={(e) => updateFormData({ name: e.target.value })}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
              <Input 
                value={formData.brand} 
                onChange={(e) => updateFormData({ brand: e.target.value })}
                className={errors.brand ? 'border-red-500' : ''}
                placeholder="Enter brand name"
              />
              {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select 
                value={formData.category} 
                onChange={(e) => updateFormData({ category: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
              <Input 
                value={formData.subcategory || ''} 
                onChange={(e) => updateFormData({ subcategory: e.target.value })}
                placeholder="Enter subcategory (optional)"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.description ? 'border-red-500' : ''}`}
              rows={4}
              placeholder="Enter detailed product description"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Pricing & Stock</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                value={formData.price} 
                onChange={(e) => updateFormData({ price: Number(e.target.value) })}
                className={errors.price ? 'border-red-500' : ''}
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                value={formData.originalPrice || ''} 
                onChange={(e) => updateFormData({ originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
              <Input 
                type="number" 
                min="0"
                value={formData.stock} 
                onChange={(e) => updateFormData({ stock: Number(e.target.value) })}
                className={errors.stock ? 'border-red-500' : ''}
                placeholder="0"
              />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <Input 
                type="number" 
                min="0" 
                max="5"
                step="0.1"
                value={formData.rating || ''} 
                onChange={(e) => updateFormData({ rating: e.target.value ? Number(e.target.value) : 0 })}
                placeholder="0.0"
              />
              <p className="text-xs text-gray-500 mt-1">Rating out of 5.0</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Count</label>
              <Input 
                type="number" 
                min="0"
                value={formData.reviewCount || ''} 
                onChange={(e) => updateFormData({ reviewCount: e.target.value ? Number(e.target.value) : 0 })}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Total number of reviews</p>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
          <div className="space-y-3">
            {formData.images.map((image: string, index: number) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    value={image}
                    onChange={(e) => {
                      const newImages = [...formData.images];
                      newImages[index] = e.target.value;
                      updateFormData({ images: newImages });
                    }}
                    placeholder="https://example.com/image.jpg"
                    className={errors.images ? 'border-red-500' : ''}
                  />
                </div>
                {formData.images && formData.images.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newImages = formData.images.filter((_, i) => i !== index);
                      updateFormData({ images: newImages });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const newImages = [...formData.images, ''];
                updateFormData({ images: newImages });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
            {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {formData.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeFromArray('tags', index)}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add a tag and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = e.currentTarget.value.trim();
                    if (value) {
                      addToArray('tags', value);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Key Features</label>
            <div className="space-y-2">
              {formData.features.map((feature: string, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...formData.features];
                      newFeatures[index] = e.target.value;
                      updateFormData({ features: newFeatures });
                    }}
                    placeholder="Enter product feature"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeFromArray('features', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newFeatures = [...formData.features, ''];
                  updateFormData({ features: newFeatures });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients (Optional)</label>
            <div className="space-y-2">
              {formData.ingredients.map((ingredient: string, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={ingredient}
                    onChange={(e) => {
                      const newIngredients = [...formData.ingredients];
                      newIngredients[index] = e.target.value;
                      updateFormData({ ingredients: newIngredients });
                    }}
                    placeholder="Enter ingredient"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeFromArray('ingredients', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newIngredients = [...formData.ingredients, ''];
                  updateFormData({ ingredients: newIngredients });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Ingredient
              </Button>
            </div>
          </div>
        </div>

        {/* Product Status */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isNewProduct" 
                checked={formData.isNewProduct} 
                onChange={(e) => updateFormData({ isNewProduct: e.target.checked })} 
                className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="isNewProduct" className="text-sm font-medium text-gray-700">New Product</label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isBestseller" 
                checked={formData.isBestseller} 
                onChange={(e) => updateFormData({ isBestseller: e.target.checked })} 
                className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="isBestseller" className="text-sm font-medium text-gray-700">Bestseller</label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isFeatured" 
                checked={formData.isFeatured} 
                onChange={(e) => updateFormData({ isFeatured: e.target.checked })} 
                className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">Featured Product</label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 p-4 bg-gray-50 rounded-lg">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {isLoading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}