'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-utils';

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-lg border">
        <Image
          src={getImageUrl(images[selectedImage])}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-image.svg';
          }}
        />
      </div>

      {/* Thumbnail images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                selectedImage === index 
                  ? 'border-rose-500 ring-2 ring-rose-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={getImageUrl(image)}
                alt={`${alt} ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.svg';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}