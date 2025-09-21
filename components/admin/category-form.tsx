'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FolderPlus } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  image: string;
  images: string[]; // Support for multiple images
  subcategories: string[];
  isActive: boolean;
}

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  errors = {}
}: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    image: '',
    images: [],
    subcategories: [],
    isActive: true,
    ...initialData
  });

  const [newSubcategory, setNewSubcategory] = useState('');

  const updateFormData = (updates: Partial<CategoryFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addSubcategory = () => {
    if (newSubcategory.trim() && !formData.subcategories.includes(newSubcategory.trim())) {
      updateFormData({
        subcategories: [...formData.subcategories, newSubcategory.trim()]
      });
      setNewSubcategory('');
    }
  };

  const removeSubcategory = (index: number) => {
    updateFormData({
      subcategories: formData.subcategories.filter((_, i) => i !== index)
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <FolderPlus className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Category' : 'Create New Category'}
          </h2>
          <p className="text-gray-600">
            {initialData ? 'Update category information' : 'Add a new product category to organize your products'}
          </p>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  updateFormData({
                    name,
                    slug: generateSlug(name)
                  });
                }}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Enter category name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug *
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => updateFormData({ slug: e.target.value })}
                className={errors.slug ? 'border-red-500' : ''}
                placeholder="category-slug"
              />
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
              <p className="text-xs text-gray-500 mt-1">URL-friendly version of the name</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
              placeholder="Enter category description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Category Images
            </label>
            <ImageUpload
              value={formData.images || []}
              onChange={(images) => {
                updateFormData({ 
                  images,
                  // Keep the first image as the main image for backward compatibility
                  image: images.length > 0 ? images[0] : ''
                });
              }}
              uploadType="categories"
              multiple={true}
              maxImages={5}
            />
            <p className="text-xs text-gray-500 mt-1">Upload images for the category (first image will be used as the main image)</p>
          </div>
        </div>

        {/* Subcategories */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subcategories</h3>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 min-h-[2rem]">
              {formData.subcategories.length > 0 ? (
                formData.subcategories.map((sub, index) => (
                  <Badge key={index} variant="secondary" className="text-sm flex items-center gap-2">
                    {sub}
                    <button
                      type="button"
                      onClick={() => removeSubcategory(index)}
                      className="text-gray-500 hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No subcategories added yet</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                placeholder="Add a subcategory"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubcategory();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSubcategory}
                disabled={!newSubcategory.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">Press Enter or click + to add each subcategory</p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => updateFormData({ isActive: e.target.checked })}
              className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active Category
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Inactive categories won't appear on the website
          </p>
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
            {isLoading ? 'Saving...' : 'Save Category'}
          </Button>
        </div>
      </form>
    </div>
  );
}