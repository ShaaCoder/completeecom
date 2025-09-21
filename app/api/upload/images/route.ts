import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import formidable from 'formidable';
import { generateUniqueFileName, DEFAULT_IMAGE_CONFIG } from '@/lib/image-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const uploadType = formData.get('type') as string || 'products'; // 'products' or 'categories'
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const uploadedImages: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', uploadType);

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      // Validate file size
      const maxSizeInBytes = DEFAULT_IMAGE_CONFIG.maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is ${DEFAULT_IMAGE_CONFIG.maxSizeInMB}MB` },
          { status: 400 }
        );
      }

      // Validate file type
      if (!DEFAULT_IMAGE_CONFIG.allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} has invalid type. Allowed types: ${DEFAULT_IMAGE_CONFIG.allowedTypes.join(', ')}` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const uniqueFileName = generateUniqueFileName(file.name);
      const filePath = path.join(uploadDir, uniqueFileName);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      await writeFile(filePath, buffer);
      
      // Store relative path for database/frontend use
      const relativePath = `uploads/${uploadType}/${uniqueFileName}`;
      uploadedImages.push(relativePath);
    }

    return NextResponse.json({ 
      success: true, 
      images: uploadedImages,
      message: `Successfully uploaded ${uploadedImages.length} image(s)`
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}