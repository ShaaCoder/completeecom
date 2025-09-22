'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { useCategories } from '@/hooks/use-categories';
import type { CreateProductRequest } from '@/types/product';

interface ProductFormData extends Omit<CreateProductRequest, 'category'> {
  category: string; // Keep as string for form handling
}

interface EnhancedProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export function EnhancedProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  errors = {}
}: EnhancedProductFormProps) {
  const { categories } = useCategories();
  const [formData, setFormData] = useState<ProductFormData>({
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
    // Initialize arrays as empty
    allergens: [],
    dietaryInfo: [],
    skinType: [],
    hairType: [],
    careInstructions: [],
    certifications: [],
    keywords: [],
    variants: [],
    ...initialData
  });

  const [activeSection, setActiveSection] = useState('basic');
  
  // Sync incoming initialData when dialog opens/changes (pre-populate form)
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Normalize arrays to avoid uncontrolled issues
        images: initialData.images ?? prev.images ?? [''],
        tags: initialData.tags ?? prev.tags ?? [],
        features: initialData.features ?? prev.features ?? [],
        ingredients: initialData.ingredients ?? prev.ingredients ?? [],
        allergens: initialData.allergens ?? prev.allergens ?? [],
        dietaryInfo: initialData.dietaryInfo ?? prev.dietaryInfo ?? [],
        skinType: initialData.skinType ?? prev.skinType ?? [],
        hairType: initialData.hairType ?? prev.hairType ?? [],
        careInstructions: initialData.careInstructions ?? prev.careInstructions ?? [],
        certifications: initialData.certifications ?? prev.certifications ?? [],
        keywords: initialData.keywords ?? prev.keywords ?? [],
        variants: initialData.variants ?? prev.variants ?? [],
      }));
    }
  }, [initialData]);
  
  // Get category info for conditional rendering
  const selectedCategory = categories.find(c => c.id === formData.category);
  const categoryName = selectedCategory?.name?.toLowerCase() || '';
  
  // Helper functions
  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addToArray = (field: keyof ProductFormData, value: string) => {
    const current = formData[field] as string[] || [];
    if (value && !current.includes(value)) {
      updateFormData({ [field]: [...current, value] });
    }
  };

  const removeFromArray = (field: keyof ProductFormData, index: number) => {
    const current = formData[field] as string[] || [];
    updateFormData({ [field]: current.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Dynamic sections based on category
  const isFood = categoryName.includes('food') || categoryName.includes('fragrance') || categoryName.includes('beverage');
  const isFashion = categoryName.includes('clothing') || categoryName.includes('fashion') || categoryName.includes('apparel');
  const isElectronics = categoryName.includes('electronics') || categoryName.includes('tech');
  const isBeauty = categoryName.includes('beauty') || categoryName.includes('makeup') || categoryName.includes('skincare') || categoryName.includes('haircare');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
        {['basic', 'details', 'variants', 'category', 'seo', 'advanced'].map((section) => (
          <Button
            key={section}
            type="button"
            variant={activeSection === section ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection(section)}
            className={activeSection === section ? 'bg-rose-600 hover:bg-rose-700' : ''}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </Button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        {activeSection === 'basic' && (
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package2 className="w-5 h-5" />
              Basic Information
            </h3>
            
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
            
            {/* Product Images */}
            <div>
              <ImageUpload
                value={formData.images.filter(img => img.trim() !== '')}
                onChange={(images) => updateFormData({ images })}
                uploadType="products"
                multiple={true}
                maxImages={8}
                className={errors.images ? 'border-red-500' : ''}
              />
              {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
            </div>
          </div>
        )}

        {/* Product Details */}
        {activeSection === 'details' && (
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <Input 
                  value={formData.sku || ''} 
                  onChange={(e) => updateFormData({ sku: e.target.value })}
                  placeholder="Product SKU"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <Input 
                  value={formData.color || ''} 
                  onChange={(e) => updateFormData({ color: e.target.value })}
                  placeholder="Product color"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <Input 
                  value={formData.size || ''} 
                  onChange={(e) => updateFormData({ size: e.target.value })}
                  placeholder="Product size"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                <Input 
                  value={formData.manufacturer || ''} 
                  onChange={(e) => updateFormData({ manufacturer: e.target.value })}
                  placeholder="Manufacturer name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
                <Input 
                  value={formData.countryOfOrigin || ''} 
                  onChange={(e) => updateFormData({ countryOfOrigin: e.target.value })}
                  placeholder="Country of origin"
                />
              </div>
              
              {isFashion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <Input 
                    value={formData.material || ''} 
                    onChange={(e) => updateFormData({ material: e.target.value })}
                    placeholder="Material composition"
                  />
                </div>
              )}
              
              {isBeauty && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scent</label>
                  <Input 
                    value={formData.scent || ''} 
                    onChange={(e) => updateFormData({ scent: e.target.value })}
                    placeholder="Fragrance/scent"
                  />
                </div>
              )}
            </div>
            
            {/* Weight and Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Weight</h4>
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weight?.value || ''} 
                    onChange={(e) => updateFormData({ 
                      weight: { 
                        ...formData.weight, 
                        value: e.target.value ? Number(e.target.value) : undefined 
                      } 
                    })}
                    placeholder="Weight"
                  />
                  <select 
                    value={formData.weight?.unit || 'g'}
                    onChange={(e) => updateFormData({ 
                      weight: { 
                        ...formData.weight, 
                        unit: e.target.value as any
                      } 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                  </select>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Dimensions</h4>
                <div className="grid grid-cols-4 gap-2">
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.dimensions?.length || ''} 
                    onChange={(e) => updateFormData({ 
                      dimensions: { 
                        ...formData.dimensions, 
                        length: e.target.value ? Number(e.target.value) : undefined 
                      } 
                    })}
                    placeholder="L"
                  />
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.dimensions?.width || ''} 
                    onChange={(e) => updateFormData({ 
                      dimensions: { 
                        ...formData.dimensions, 
                        width: e.target.value ? Number(e.target.value) : undefined 
                      } 
                    })}
                    placeholder="W"
                  />
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.dimensions?.height || ''} 
                    onChange={(e) => updateFormData({ 
                      dimensions: { 
                        ...formData.dimensions, 
                        height: e.target.value ? Number(e.target.value) : undefined 
                      } 
                    })}
                    placeholder="H"
                  />
                  <select 
                    value={formData.dimensions?.unit || 'cm'}
                    onChange={(e) => updateFormData({ 
                      dimensions: { 
                        ...formData.dimensions, 
                        unit: e.target.value as any 
                      } 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                    <option value="m">m</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Variants */}
        {activeSection === 'variants' && (
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const newVariant = { color: '', size: '', price: formData.price, stock: 0 };
                  updateFormData({ variants: [...(formData.variants || []), newVariant] });
                }}
                className="bg-rose-600 hover:bg-rose-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Variant
              </Button>
            </div>
            
            {formData.variants && formData.variants.length > 0 ? (
              <div className="space-y-4">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border rounded-lg">
                    <Input
                      placeholder="Color"
                      value={variant.color || ''}
                      onChange={(e) => {
                        const newVariants = [...(formData.variants || [])];
                        newVariants[index] = { ...variant, color: e.target.value };
                        updateFormData({ variants: newVariants });
                      }}
                    />
                    <Input
                      placeholder="Size"
                      value={variant.size || ''}
                      onChange={(e) => {
                        const newVariants = [...(formData.variants || [])];
                        newVariants[index] = { ...variant, size: e.target.value };
                        updateFormData({ variants: newVariants });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      value={variant.price || ''}
                      onChange={(e) => {
                        const newVariants = [...(formData.variants || [])];
                        newVariants[index] = { ...variant, price: Number(e.target.value) };
                        updateFormData({ variants: newVariants });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Stock"
                      min="0"
                      value={variant.stock || ''}
                      onChange={(e) => {
                        const newVariants = [...(formData.variants || [])];
                        newVariants[index] = { ...variant, stock: Number(e.target.value) };
                        updateFormData({ variants: newVariants });
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newVariants = formData.variants?.filter((_, i) => i !== index) || [];
                        updateFormData({ variants: newVariants });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No variants added yet. Click "Add Variant" to get started.</p>
            )}
          </div>
        )}

        {/* Category-Specific Fields */}
        {activeSection === 'category' && (
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Category-Specific Information</h3>
            
            {/* Food & Beverages */}
            {isFood && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Nutritional Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.nutritionalInfo?.calories || ''}
                      onChange={(e) => updateFormData({
                        nutritionalInfo: {
                          ...formData.nutritionalInfo,
                          calories: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.nutritionalInfo?.protein || ''}
                      onChange={(e) => updateFormData({
                        nutritionalInfo: {
                          ...formData.nutritionalInfo,
                          protein: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.nutritionalInfo?.carbs || ''}
                      onChange={(e) => updateFormData({
                        nutritionalInfo: {
                          ...formData.nutritionalInfo,
                          carbs: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.nutritionalInfo?.fat || ''}
                      onChange={(e) => updateFormData({
                        nutritionalInfo: {
                          ...formData.nutritionalInfo,
                          fat: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                      placeholder="0.0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergens</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.allergens?.map((allergen, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {allergen}
                        <button
                          type="button"
                          onClick={() => removeFromArray('allergens', index)}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add allergen"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('allergens', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Electronics */}
            {isElectronics && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Technical Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
                    <Input
                      value={formData.technicalSpecs?.model || ''}
                      onChange={(e) => updateFormData({
                        technicalSpecs: {
                          ...formData.technicalSpecs,
                          model: e.target.value
                        }
                      })}
                      placeholder="Model number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Power Requirements</label>
                    <Input
                      value={formData.technicalSpecs?.powerRequirements || ''}
                      onChange={(e) => updateFormData({
                        technicalSpecs: {
                          ...formData.technicalSpecs,
                          powerRequirements: e.target.value
                        }
                      })}
                      placeholder="e.g., 110-240V, 50-60Hz"
                    />
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium mb-3">Warranty</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Duration"
                      value={formData.technicalSpecs?.warranty?.duration || ''}
                      onChange={(e) => updateFormData({
                        technicalSpecs: {
                          ...formData.technicalSpecs,
                          warranty: {
                            ...formData.technicalSpecs?.warranty,
                            duration: e.target.value ? Number(e.target.value) : undefined
                          }
                        }
                      })}
                    />
                    <select
                      value={formData.technicalSpecs?.warranty?.unit || 'months'}
                      onChange={(e) => updateFormData({
                        technicalSpecs: {
                          ...formData.technicalSpecs,
                          warranty: {
                            ...formData.technicalSpecs?.warranty,
                            unit: e.target.value as any
                          }
                        }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                    <select
                      value={formData.technicalSpecs?.warranty?.type || 'manufacturer'}
                      onChange={(e) => updateFormData({
                        technicalSpecs: {
                          ...formData.technicalSpecs,
                          warranty: {
                            ...formData.technicalSpecs?.warranty,
                            type: e.target.value as any
                          }
                        }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="manufacturer">Manufacturer</option>
                      <option value="seller">Seller</option>
                      <option value="extended">Extended</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Beauty */}
            {isBeauty && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SPF</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.spf || ''}
                      onChange={(e) => updateFormData({ spf: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="SPF value"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skin Type</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.skinType?.map((type, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {type}
                          <button
                            type="button"
                            onClick={() => removeFromArray('skinType', index)}
                            className="ml-2 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add skin type"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('skinType', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEO & Marketing */}
        {activeSection === 'seo' && (
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">SEO & Marketing</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <Input
                  value={formData.metaTitle || ''}
                  onChange={(e) => updateFormData({ metaTitle: e.target.value })}
                  placeholder="SEO title for search engines"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.metaTitle?.length || 0}/60 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea
                  value={formData.metaDescription || ''}
                  onChange={(e) => updateFormData({ metaDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  rows={3}
                  placeholder="SEO description for search engines"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.metaDescription?.length || 0}/160 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SEO Keywords</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.keywords?.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeFromArray('keywords', index)}
                        className="ml-2 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add SEO keyword"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('keywords', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Product Status</h4>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isNewProduct}
                    onChange={(e) => updateFormData({ isNewProduct: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">New Product</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isBestseller}
                    onChange={(e) => updateFormData({ isBestseller: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Bestseller</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => updateFormData({ isFeatured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Featured Product</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Advanced */}
        {activeSection === 'advanced' && (
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Inventory Control</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.minOrderQuantity || ''}
                      onChange={(e) => updateFormData({ minOrderQuantity: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Order Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.maxOrderQuantity || ''}
                      onChange={(e) => updateFormData({ maxOrderQuantity: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Additional Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <Input
                      value={formData.barcode || ''}
                      onChange={(e) => updateFormData({ barcode: e.target.value })}
                      placeholder="Product barcode"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                    <select
                      value={formData.season || ''}
                      onChange={(e) => updateFormData({ season: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">Select Season</option>
                      <option value="spring">Spring</option>
                      <option value="summer">Summer</option>
                      <option value="fall">Fall</option>
                      <option value="winter">Winter</option>
                      <option value="all-season">All Season</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Product Arrays</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(formData.tags || []).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeFromArray('tags', index)}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('tags', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(formData.features || []).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFromArray('features', index)}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add feature"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('features', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(formData.ingredients || []).map((ingredient, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {ingredient}
                        <button
                          type="button"
                          onClick={() => removeFromArray('ingredients', index)}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add ingredient"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('ingredients', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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