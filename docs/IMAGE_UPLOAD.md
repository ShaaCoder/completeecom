# Image Upload Functionality

This e-commerce application now supports local image uploads for both products and categories.

## Features

### 🖼️ Local Image Upload
- Upload images directly from your computer
- No need for external image hosting
- Images are stored in the `public/uploads/` directory

### 🔧 Technical Features
- **Drag & Drop**: Simply drag images into the upload area
- **Multiple Upload**: Upload multiple images at once
- **Progress Tracking**: Real-time upload progress indication
- **Image Validation**: Automatic validation of file size and type
- **Image Preview**: See images before uploading
- **Responsive Design**: Works on desktop and mobile devices

### 📁 File Organization
```
public/uploads/
├── products/     # Product images
└── categories/   # Category images
```

### 🛡️ Security & Validation
- **File Size Limit**: Maximum 5MB per image
- **Allowed Types**: JPEG, JPG, PNG, WebP
- **Unique Filenames**: Automatic generation to prevent conflicts
- **Input Sanitization**: Secure file handling

## Usage

### For Products
1. Navigate to Admin → Products → Add/Edit Product
2. In the "Basic Information" section, use the image upload component
3. Click "Upload Images" or drag & drop files
4. Select multiple images (up to 8 images per product)
5. Click "Upload" to save images to the server

### For Categories
1. Navigate to Admin → Categories → Add/Edit Category
2. Use the "Category Images" section
3. Upload up to 5 images per category
4. The first image will be used as the main category image

## Configuration

### Image Upload Settings
You can modify the upload settings in `lib/image-utils.ts`:

```typescript
export const DEFAULT_IMAGE_CONFIG: ImageUploadConfig = {
  maxSizeInMB: 5,                    // Maximum file size
  allowedTypes: [                    // Allowed file types
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ],
  quality: 0.8                       // Image quality (future feature)
};
```

### Upload Limits
- **Products**: Maximum 8 images per product
- **Categories**: Maximum 5 images per category
- **File Size**: Maximum 5MB per image
- **Total Storage**: Depends on server capacity

## API Endpoints

### POST /api/upload/images
Upload one or more images to the server.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `images`: File[] - Array of image files
  - `type`: string - Either "products" or "categories"

**Response:**
```json
{
  "success": true,
  "images": ["uploads/products/1234567890_abc123.jpg"],
  "message": "Successfully uploaded 1 image(s)"
}
```

## Components

### ImageUpload Component
Location: `components/ui/image-upload.tsx`

**Props:**
```typescript
interface ImageUploadProps {
  value: string[];                           // Current image URLs
  onChange: (images: string[]) => void;      // Callback when images change
  uploadType?: 'products' | 'categories';   // Upload destination
  multiple?: boolean;                        // Allow multiple files
  maxImages?: number;                        // Maximum number of images
  config?: Partial<ImageUploadConfig>;       // Upload configuration
  className?: string;                        // Additional CSS classes
  disabled?: boolean;                        // Disable the component
}
```

**Usage:**
```tsx
<ImageUpload
  value={formData.images}
  onChange={(images) => setFormData({...formData, images})}
  uploadType="products"
  multiple={true}
  maxImages={8}
/>
```

## Troubleshooting

### Common Issues

**1. Upload fails with "File too large" error**
- Check file size is under 5MB
- Use image compression tools if needed

**2. Upload fails with "Invalid file type" error**
- Ensure files are JPEG, JPG, PNG, or WebP format
- Avoid uploading GIF, BMP, or other formats

**3. Images don't appear after upload**
- Check browser console for errors
- Verify upload directory permissions
- Ensure images are in the correct `public/uploads/` directory

**4. Slow upload speeds**
- Large images take longer to upload
- Consider resizing images before upload
- Check internet connection speed

### File Permissions
Ensure the upload directories have proper write permissions:
```bash
chmod 755 public/uploads/
chmod 755 public/uploads/products/
chmod 755 public/uploads/categories/
```

### Storage Considerations
- Images are stored in `public/uploads/` and are publicly accessible
- Consider implementing cleanup procedures for unused images
- Monitor disk space usage as images accumulate
- Consider implementing image optimization/compression for production

## Future Enhancements

- [ ] Image compression/optimization
- [ ] Cloud storage integration (AWS S3, Cloudinary)
- [ ] Image cropping/editing tools
- [ ] Bulk image operations
- [ ] Image CDN integration
- [ ] Auto-generated thumbnails
- [ ] Image metadata extraction