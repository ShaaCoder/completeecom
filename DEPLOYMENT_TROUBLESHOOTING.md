# Image Upload Deployment Troubleshooting

## The Problem
You're experiencing "Upload failed with status 500" when trying to upload images in your deployed environment, but it works locally.

## Root Cause Analysis
Based on the code analysis, the most likely causes are:

### 1. **File System Permissions** (Most Common)
Your deployment platform doesn't allow writing to the file system, or the `public/uploads/` directory doesn't exist.

### 2. **Platform Limitations**
Many hosting providers (Vercel, Netlify, Railway, etc.) have read-only file systems in production.

### 3. **Body Size Limits**
The deployment platform may have stricter request body size limits than your local environment.

### 4. **Missing Environment Variables**
Deployment environment might be missing required configuration.

## Solutions by Platform

### **Vercel** (Most Common)
Vercel has a read-only file system, so local file uploads won't work.

**Solution:**
1. **Use Vercel Blob Storage:**
   ```bash
   npm install @vercel/blob
   ```

2. **Update environment variables:**
   ```
   STORAGE_PROVIDER=vercel-blob
   BLOB_READ_WRITE_TOKEN=your_token_here
   ```

3. **Alternative: Use external storage (Cloudinary, S3)**

### **Netlify**
Similar to Vercel, Netlify has read-only deployments.

**Solution:**
1. Use Netlify Functions with external storage
2. Configure environment variables for cloud storage

### **Railway/Render/DigitalOcean**
These platforms usually allow file system writes but may have restrictions.

**Solution:**
1. Ensure directory permissions
2. Check disk space limits
3. Verify environment variables

### **Docker/VPS Deployments**
Full control over file system.

**Solution:**
1. Ensure upload directories exist and have write permissions:
   ```bash
   mkdir -p public/uploads/products public/uploads/categories
   chmod 755 public/uploads/products public/uploads/categories
   ```

2. Run the setup script:
   ```bash
   npm run setup-uploads
   ```

## Immediate Fixes to Try

### 1. **Check Your Deployment Platform**
Run this command to identify your platform:
```bash
node -e "console.log('Platform:', process.env.VERCEL ? 'Vercel' : process.env.NETLIFY ? 'Netlify' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Unknown')"
```

### 2. **Check Upload Directory Status**
Add this debug endpoint to test your deployment:

Create `app/api/debug/storage/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';

export async function GET() {
  const results = {
    platform: process.env.VERCEL ? 'vercel' : process.env.NETLIFY ? 'netlify' : 'other',
    cwd: process.cwd(),
    directories: {},
    writeTest: null,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    }
  };

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
    const testFile = path.join(process.cwd(), 'public/uploads/products/.write-test');
    await writeFile(testFile, 'test');
    await unlink(testFile);
    results.writeTest = 'SUCCESS';
  } catch (error) {
    results.writeTest = error.message;
  }

  return NextResponse.json(results);
}
```

### 3. **Environment Variable Fix**
Add these to your deployment environment:
```
# For cloud storage fallback
STORAGE_PROVIDER=base64
MAX_FILE_SIZE=1048576
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

### 4. **Quick Fallback Solution**
For immediate fix, enable base64 storage by adding this to your `.env`:
```
STORAGE_PROVIDER=base64
```

⚠️ **Warning**: Base64 storage is only for small images (< 1MB) and should be temporary.

## Platform-Specific Environment Variables

### Vercel
```bash
vercel env add STORAGE_PROVIDER
vercel env add BLOB_READ_WRITE_TOKEN  # if using Vercel Blob
```

### Netlify
```bash
netlify env:set STORAGE_PROVIDER "cloudinary"
netlify env:set CLOUDINARY_CLOUD_NAME "your_name"
netlify env:set CLOUDINARY_API_KEY "your_key"
netlify env:set CLOUDINARY_API_SECRET "your_secret"
```

### Railway
```bash
railway variables set STORAGE_PROVIDER=local
```

## Testing Your Fix

1. **Deploy your changes**
2. **Visit your debug endpoint**: `https://yourdomain.com/api/debug/storage`
3. **Check the response** for any file system issues
4. **Test image upload** in your admin panel

## Long-term Solutions

### Option 1: Cloudinary (Recommended)
```bash
npm install cloudinary
```

### Option 2: AWS S3
```bash
npm install @aws-sdk/client-s3
```

### Option 3: Vercel Blob (for Vercel only)
```bash
npm install @vercel/blob
```

## Need Help?

1. **Check server logs** in your deployment platform
2. **Visit the debug endpoint** we created
3. **Try the base64 fallback** as temporary solution
4. **Consider cloud storage** for production use

The code is already enhanced with better error logging, so check your platform's logs for specific error messages.