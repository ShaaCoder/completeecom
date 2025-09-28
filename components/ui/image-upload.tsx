'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Progress } from './progress';
import { Badge } from './badge';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { 
  validateImageFile, 
  createImagePreview, 
  formatFileSize, 
  DEFAULT_IMAGE_CONFIG,
  ImageUploadConfig,
  UploadProgress
} from '@/lib/image-utils';

interface ImageUploadProps {
  value: string[];
  onChange: (images: string[]) => void;
  uploadType?: 'products' | 'categories';
  multiple?: boolean;
  maxImages?: number;
  config?: Partial<ImageUploadConfig>;
  className?: string;
  disabled?: boolean;
}

interface FileWithPreview extends File {
  preview: string;
  id: string;
}

export function ImageUpload({
  value = [],
  onChange,
  uploadType = 'products',
  multiple = true,
  maxImages = 10,
  config = {},
  className = '',
  disabled = false
}: ImageUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadConfig = { ...DEFAULT_IMAGE_CONFIG, ...config };

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithPreview[] = [];
    const totalImages = value.length + files.length + selectedFiles.length;

    if (totalImages > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const validation = validateImageFile(file, uploadConfig);

      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      try {
        const preview = await createImagePreview(file);
        const fileWithPreview = Object.assign(file, {
          preview,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        newFiles.push(fileWithPreview);
      } catch (err) {
        setError('Failed to create image preview');
        return;
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, [files.length, value.length, maxImages, uploadConfig]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const removeExistingImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const uploadImages = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      formData.append('type', uploadType);
      formData.append('optimization', 'balanced'); // Use balanced optimization for good speed/quality

      // Use fetch with progress simulation for better UX
      const xhr = new XMLHttpRequest();

      // Enhanced progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          setUploadProgress(progress);
        }
      };

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve(new Response(xhr.response));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.ontimeout = () => reject(new Error('Upload timeout'));
        xhr.timeout = 60000; // 60 second timeout
        xhr.open('POST', '/api/upload/images');
        xhr.send(formData);
      });

      const result = await response.json();
      const totalTime = Date.now() - startTime;

      if (result.success) {
        // Show success message with stats
        console.log(`✨ Upload completed in ${totalTime}ms:`, result.stats);
        
        // Add uploaded images to existing ones - use only main optimized images for display
        const mainImages = result.images.filter((img: string) => 
          !img.includes('_thumb') && !img.includes('_medium') && !img.includes('_large')
        );
        const newImages = [...value, ...mainImages];
        onChange(newImages);
        setFiles([]); // Clear selected files
        setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
      } else {
        throw new Error(result.message || result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('😱 Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const canAddMore = value.length + files.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Existing Images */}
      {value.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Images ({value.length})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {value.map((imagePath, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={`/${imagePath}`}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.png';
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  disabled={disabled}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Selection Area */}
      {canAddMore && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {value.length > 0 ? 'Add More Images' : 'Upload Images'}
          </label>
          
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${disabled 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                : 'border-gray-300 hover:border-rose-400 cursor-pointer'
              }
              ${error ? 'border-red-400 bg-red-50' : ''}
            `}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={uploadConfig.allowedTypes.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={disabled}
            />
            
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  {uploadConfig.allowedTypes.map(type => type.split('/')[1]).join(', ')} up to {uploadConfig.maxSizeInMB}MB
                </p>
                <p className="text-xs text-gray-500">
                  Maximum {maxImages} images
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {files.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Files ({files.length})
          </label>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {files.map((file) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  disabled={uploading}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    {formatFileSize(file.size)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={uploadImages}
              disabled={uploading || files.length === 0}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {files.length} image{files.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>

            {uploading && (
              <div className="flex-1">
                <Progress value={uploadProgress.percentage} className="w-full" />
                <p className="text-xs text-gray-500 mt-1">
                  {uploadProgress.percentage}% ({formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)})
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Help Text */}
      {!error && (
        <p className="text-xs text-gray-500">
          {value.length}/{maxImages} images uploaded.
          {canAddMore && ` You can upload ${maxImages - value.length - files.length} more.`}
        </p>
      )}
    </div>
  );
}