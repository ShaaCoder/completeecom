import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { withAuth } from '@/lib/api-helpers';
import { productValidation } from '@/lib/validations';

interface CSVRow {
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  images: string;
  category: string;
  subcategory?: string;
  brand: string;
  stock: string;
  rating?: string;
  reviewCount?: string;
  tags?: string;
  features?: string;
  ingredients?: string;
  isNewProduct?: string;
  isBestseller?: string;
  isFeatured?: string;
  sku?: string;
  barcode?: string;
  color?: string;
  size?: string;
  material?: string;
  scent?: string;
  gender?: string;
  ageGroup?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  allergens?: string;
  dietaryInfo?: string;
  skinType?: string;
  hairType?: string;
  careInstructions?: string;
  certifications?: string;
  keywords?: string;
  metaTitle?: string;
  metaDescription?: string;
  minOrderQuantity?: string;
  maxOrderQuantity?: string;
  season?: string;
  spf?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

function validateCSVRow(row: CSVRow, rowIndex: number, categories: any[]): ValidationResult {
  const errors: string[] = [];
  const data: any = {};

  // Required fields validation
  if (!row.name?.trim()) {
    errors.push(`Row ${rowIndex}: Product name is required`);
  } else {
    data.name = row.name.trim();
  }

  if (!row.description?.trim()) {
    errors.push(`Row ${rowIndex}: Description is required`);
  } else {
    data.description = row.description.trim();
  }

  if (!row.price?.trim()) {
    errors.push(`Row ${rowIndex}: Price is required`);
  } else {
    const price = parseFloat(row.price);
    if (isNaN(price) || price <= 0) {
      errors.push(`Row ${rowIndex}: Price must be a positive number`);
    } else {
      data.price = price;
    }
  }

  if (!row.brand?.trim()) {
    errors.push(`Row ${rowIndex}: Brand is required`);
  } else {
    data.brand = row.brand.trim();
  }

  if (!row.stock?.trim()) {
    errors.push(`Row ${rowIndex}: Stock is required`);
  } else {
    const stock = parseInt(row.stock);
    if (isNaN(stock) || stock < 0) {
      errors.push(`Row ${rowIndex}: Stock must be a non-negative number`);
    } else {
      data.stock = stock;
    }
  }

  if (!row.category?.trim()) {
    errors.push(`Row ${rowIndex}: Category is required`);
  } else {
    // Find category by name
    const category = categories.find(c => 
      c.name.toLowerCase() === row.category.trim().toLowerCase()
    );
    if (!category) {
      errors.push(`Row ${rowIndex}: Category "${row.category}" not found. Available categories: ${categories.map(c => c.name).join(', ')}`);
    } else {
      data.category = category._id.toString();
    }
  }

  // Images validation and processing
  if (!row.images?.trim()) {
    errors.push(`Row ${rowIndex}: At least one image is required`);
  } else {
    const imageUrls = row.images.split(',').map(url => url.trim()).filter(url => url);
    if (imageUrls.length === 0) {
      errors.push(`Row ${rowIndex}: At least one image URL is required`);
    } else {
      // Validate each image URL
      const invalidImages = imageUrls.filter(url => {
        const isLocalUpload = /^uploads\/(products|categories)\//.test(url);
        const isValidUrl = /^https?:\/\/.+/i.test(url);
        return !isLocalUpload && !isValidUrl;
      });
      
      if (invalidImages.length > 0) {
        errors.push(`Row ${rowIndex}: Invalid image URLs: ${invalidImages.join(', ')}`);
      } else {
        data.images = imageUrls;
      }
    }
  }

  // Optional fields
  if (row.originalPrice?.trim()) {
    const originalPrice = parseFloat(row.originalPrice);
    if (isNaN(originalPrice) || originalPrice <= 0) {
      errors.push(`Row ${rowIndex}: Original price must be a positive number`);
    } else {
      data.originalPrice = originalPrice;
    }
  }

  if (row.subcategory?.trim()) {
    data.subcategory = row.subcategory.trim();
  }

  if (row.rating?.trim()) {
    const rating = parseFloat(row.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.push(`Row ${rowIndex}: Rating must be between 0 and 5`);
    } else {
      data.rating = rating;
    }
  }

  if (row.reviewCount?.trim()) {
    const reviewCount = parseInt(row.reviewCount);
    if (isNaN(reviewCount) || reviewCount < 0) {
      errors.push(`Row ${rowIndex}: Review count must be a non-negative number`);
    } else {
      data.reviewCount = reviewCount;
    }
  }

  // Array fields processing with enum validation
  if (row.allergens?.trim()) {
    const allergens = row.allergens.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
    const validAllergens = ['nuts', 'dairy', 'gluten', 'soy', 'eggs', 'fish', 'shellfish', 'sesame', 'sulfites'];
    const invalidAllergens = allergens.filter(allergen => !validAllergens.includes(allergen));
    if (invalidAllergens.length > 0) {
      errors.push(`Row ${rowIndex}: Invalid allergens: ${invalidAllergens.join(', ')}. Valid values: ${validAllergens.join(', ')}`);
    } else {
      data.allergens = allergens;
    }
  }

  if (row.dietaryInfo?.trim()) {
    const dietaryInfo = row.dietaryInfo.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
    const validDietaryInfo = ['vegetarian', 'vegan', 'gluten-free', 'organic', 'non-gmo', 'keto', 'low-carb', 'sugar-free'];
    const invalidDietaryInfo = dietaryInfo.filter(info => !validDietaryInfo.includes(info));
    if (invalidDietaryInfo.length > 0) {
      errors.push(`Row ${rowIndex}: Invalid dietary info: ${invalidDietaryInfo.join(', ')}. Valid values: ${validDietaryInfo.join(', ')}`);
    } else {
      data.dietaryInfo = dietaryInfo;
    }
  }

  if (row.skinType?.trim()) {
    const skinTypes = row.skinType.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
    const validSkinTypes = ['dry', 'oily', 'combination', 'sensitive', 'normal', 'mature', 'acne-prone'];
    const invalidSkinTypes = skinTypes.filter(type => !validSkinTypes.includes(type));
    if (invalidSkinTypes.length > 0) {
      errors.push(`Row ${rowIndex}: Invalid skin types: ${invalidSkinTypes.join(', ')}. Valid values: ${validSkinTypes.join(', ')}`);
    } else {
      data.skinType = skinTypes;
    }
  }

  if (row.hairType?.trim()) {
    const hairTypes = row.hairType.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
    const validHairTypes = ['straight', 'wavy', 'curly', 'coily', 'fine', 'thick', 'damaged', 'color-treated'];
    const invalidHairTypes = hairTypes.filter(type => !validHairTypes.includes(type));
    if (invalidHairTypes.length > 0) {
      errors.push(`Row ${rowIndex}: Invalid hair types: ${invalidHairTypes.join(', ')}. Valid values: ${validHairTypes.join(', ')}`);
    } else {
      data.hairType = hairTypes;
    }
  }

  // Regular array fields (no enum validation)
  const arrayFields = ['tags', 'features', 'ingredients', 'careInstructions', 'certifications', 'keywords'];
  arrayFields.forEach(field => {
    if (row[field as keyof CSVRow]?.trim()) {
      data[field] = row[field as keyof CSVRow]!.split(',').map((item: string) => item.trim()).filter((item: string) => item);
    }
  });

  // Boolean fields
  const booleanFields = ['isNewProduct', 'isBestseller', 'isFeatured'];
  booleanFields.forEach(field => {
    if (row[field as keyof CSVRow]?.trim()) {
      const value = row[field as keyof CSVRow]!.toLowerCase();
      data[field] = value === 'true' || value === '1' || value === 'yes';
    }
  });

  // String fields with enum validation
  if (row.gender?.trim()) {
    const genderValue = row.gender.trim().toLowerCase();
    const validGenders = ['men', 'women', 'unisex', 'kids', 'baby'];
    if (validGenders.includes(genderValue)) {
      data.gender = genderValue;
    } else {
      errors.push(`Row ${rowIndex}: Gender "${row.gender}" is not valid. Must be one of: ${validGenders.join(', ')}`);
    }
  }

  if (row.ageGroup?.trim()) {
    const ageGroupValue = row.ageGroup.trim().toLowerCase();
    const validAgeGroups = ['infant', 'toddler', 'kids', 'teen', 'adult', 'senior', 'all-ages'];
    if (validAgeGroups.includes(ageGroupValue)) {
      data.ageGroup = ageGroupValue;
    } else {
      errors.push(`Row ${rowIndex}: Age group "${row.ageGroup}" is not valid. Must be one of: ${validAgeGroups.join(', ')}`);
    }
  }

  if (row.season?.trim()) {
    const seasonValue = row.season.trim().toLowerCase();
    const validSeasons = ['spring', 'summer', 'fall', 'winter', 'all-season'];
    if (validSeasons.includes(seasonValue)) {
      data.season = seasonValue;
    } else {
      errors.push(`Row ${rowIndex}: Season "${row.season}" is not valid. Must be one of: ${validSeasons.join(', ')}`);
    }
  }

  // Regular string fields (no enum validation)
  const stringFields = ['sku', 'barcode', 'color', 'size', 'material', 'scent', 'manufacturer', 'countryOfOrigin', 'metaTitle', 'metaDescription'];
  stringFields.forEach(field => {
    if (row[field as keyof CSVRow]?.trim()) {
      data[field] = row[field as keyof CSVRow]!.trim();
    }
  });

  // Number fields
  if (row.minOrderQuantity?.trim()) {
    const minOrder = parseInt(row.minOrderQuantity);
    if (isNaN(minOrder) || minOrder < 1) {
      errors.push(`Row ${rowIndex}: Minimum order quantity must be at least 1`);
    } else {
      data.minOrderQuantity = minOrder;
    }
  }

  if (row.maxOrderQuantity?.trim()) {
    const maxOrder = parseInt(row.maxOrderQuantity);
    if (isNaN(maxOrder) || maxOrder < 1) {
      errors.push(`Row ${rowIndex}: Maximum order quantity must be at least 1`);
    } else {
      data.maxOrderQuantity = maxOrder;
    }
  }

  if (row.spf?.trim()) {
    const spf = parseInt(row.spf);
    if (isNaN(spf) || spf < 0 || spf > 100) {
      errors.push(`Row ${rowIndex}: SPF must be between 0 and 100`);
    } else {
      data.spf = spf;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : undefined
  };
}

export async function POST(request: NextRequest) {
  return withAuth(async (req) => {
    try {
      await connectDB();

      const formData = await req.formData();
      const file = formData.get('csvFile') as File;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No CSV file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/csv') {
        return NextResponse.json(
          { success: false, error: 'File must be a CSV file' },
          { status: 400 }
        );
      }

      // Read file content
      const csvText = await file.text();

      // Parse CSV
      const parseResult = Papa.parse<CSVRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim()
      });

      if (parseResult.errors.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'CSV parsing errors',
            details: parseResult.errors.map(err => err.message)
          },
          { status: 400 }
        );
      }

      const rows = parseResult.data;
      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'CSV file is empty' },
          { status: 400 }
        );
      }

      // Fetch categories for validation
      const categories = await Category.find({ isActive: true });

      // Validate all rows
      const validationResults: ValidationResult[] = [];
      const validRows: any[] = [];
      const allErrors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const result = validateCSVRow(rows[i], i + 2, categories); // +2 because row 1 is header
        validationResults.push(result);
        
        if (result.isValid && result.data) {
          validRows.push(result.data);
        } else {
          allErrors.push(...result.errors);
        }
      }

      // If there are validation errors, return them
      if (allErrors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation errors found',
            details: allErrors,
            validRows: validRows.length,
            totalRows: rows.length
          },
          { status: 400 }
        );
      }

      // Create products
      const createdProducts = [];
      const failedProducts = [];

      for (let i = 0; i < validRows.length; i++) {
        const productData = validRows[i];
        
        try {
          // Generate slug
          const baseSlug = productData.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          const timestamp = Date.now().toString().slice(-6);
          productData.slug = `${baseSlug}-${timestamp}`;

          const product = new Product(productData);
          await product.save();
          await product.populate('category', 'name slug description image');
          
          createdProducts.push({
            name: product.name,
            slug: product.slug,
            id: product._id
          });
        } catch (error: any) {
          failedProducts.push({
            row: i + 2,
            name: productData.name,
            error: error.message
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${createdProducts.length} products`,
        summary: {
          totalRows: rows.length,
          successful: createdProducts.length,
          failed: failedProducts.length,
          createdProducts,
          failedProducts
        }
      });

    } catch (error: any) {
      console.error('Bulk upload error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to process CSV file', details: error.message },
        { status: 500 }
      );
    }
  }, ['admin'])(request);
}

// Export CSV template
export async function GET(request: NextRequest) {
  return withAuth(async (req) => {
  const csvHeaders = [
    'name',
    'description', 
    'price',
    'originalPrice',
    'images',
    'category',
    'subcategory',
    'brand',
    'stock',
    'rating',
    'reviewCount',
    'tags',
    'features',
    'ingredients',
    'isNewProduct',
    'isBestseller',
    'isFeatured',
    'sku',
    'barcode',
    'color',
    'size',
    'material',
    'scent',
    'gender',
    'ageGroup',
    'manufacturer',
    'countryOfOrigin',
    'allergens',
    'dietaryInfo',
    'skinType',
    'hairType',
    'careInstructions',
    'certifications',
    'keywords',
    'metaTitle',
    'metaDescription',
    'minOrderQuantity',
    'maxOrderQuantity',
    'season',
    'spf'
  ];

  const sampleData = [
    'Sample Lipstick',
    'A beautiful matte lipstick with long-lasting formula',
    '599',
    '799',
    'https://example.com/lipstick1.jpg,https://example.com/lipstick2.jpg',
    'Makeup',
    'Lipsticks',
    'BeautyBrand',
    '50',
    '4.5',
    '125',
    'matte,long-lasting,waterproof',
    'Long-lasting formula,Matte finish,Waterproof',
    'Dimethicone,Cyclopentasiloxane',
    'true',
    'false',
    'true',
    'LP001',
    '123456789',
    'Red',
    '3.5g',
    'Silicone',
    'Rose',
    'women',
    'adult',
    'BeautyBrand Inc',
    'India',
    'nuts,dairy',
    'vegan,organic',
    'oily,combination',
    'straight,fine',
    'Store in cool place,Do not freeze',
    'FDA Approved,Cruelty-free',
    'lipstick,makeup,beauty,matte',
    'Best Matte Lipstick - Long Lasting',
    'Premium matte lipstick with 12-hour staying power',
    '1',
    '10',
    'all-season',
    '15'
  ];

  const csvContent = [csvHeaders.join(','), sampleData.join(',')].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="product_template.csv"',
      },
    });
  }, ['admin'])(request);
}
