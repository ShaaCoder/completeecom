import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';

export async function GET() {
  const results = {
    platform: process.env.VERCEL ? 'vercel' : 
               process.env.NETLIFY ? 'netlify' : 
               process.env.RAILWAY_ENVIRONMENT ? 'railway' :
               process.env.RENDER ? 'render' : 'other',
    cwd: process.cwd(),
    directories: {},
    writeTest: null,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
      MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
      ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
      // Add any platform-specific variables
      VERCEL: !!process.env.VERCEL,
      NETLIFY: !!process.env.NETLIFY,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RENDER: !!process.env.RENDER,
    },
    timestamp: new Date().toISOString()
  };

  // Check directories
  const testDirs = ['public/uploads', 'public/uploads/products', 'public/uploads/categories'];
  
  for (const dir of testDirs) {
    const fullPath = path.join(process.cwd(), dir);
    results.directories[dir] = {
      exists: existsSync(fullPath),
      path: fullPath
    };
  }

  // Test write permissions
  try {
    const testDir = path.join(process.cwd(), 'public/uploads/products');
    
    // Try to create directory if it doesn't exist
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
      results.directories['public/uploads/products'].created = true;
    }
    
    const testFile = path.join(testDir, '.write-test');
    await writeFile(testFile, 'test');
    await unlink(testFile);
    results.writeTest = 'SUCCESS';
  } catch (error) {
    results.writeTest = {
      error: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      path: error.path
    };
  }

  return NextResponse.json(results, { status: 200 });
}