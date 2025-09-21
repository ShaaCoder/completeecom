/**
 * Admin API to Fix Category Product Counts
 * 
 * This endpoint recalculates and updates the productCount field for all categories
 * based on the actual number of active products linked to each category.
 * 
 * POST /api/admin/fix-category-counts
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  withAuth
} from '@/lib/api-helpers';

interface CategoryCountResult {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  oldCount: number;
  newCount: number;
  updated: boolean;
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, user) => {
    try {
      await connectDB();

      console.log('🔧 [FIX-COUNTS] Starting category product count fix...');
      
      // Get all categories
      const categories = await Category.find({});
      console.log(`🔧 [FIX-COUNTS] Found ${categories.length} categories to check`);

      const results: CategoryCountResult[] = [];
      let fixedCount = 0;

      for (const category of categories) {
        console.log(`🔧 [FIX-COUNTS] Checking category: ${category.name} (${category.slug})`);
        
        // Count actual products in this category
        const actualCount = await Product.countDocuments({
          category: category._id,
          isActive: true
        });
        
        const storedCount = category.productCount || 0;
        
        console.log(`🔧 [FIX-COUNTS]   Stored: ${storedCount}, Actual: ${actualCount}`);
        
        const result: CategoryCountResult = {
          categoryId: category._id.toString(),
          categoryName: category.name,
          categorySlug: category.slug,
          oldCount: storedCount,
          newCount: actualCount,
          updated: false
        };

        if (storedCount !== actualCount) {
          console.log(`🔧 [FIX-COUNTS]   MISMATCH! Updating ${storedCount} → ${actualCount}`);
          
          // Update the category with the correct count
          await Category.findByIdAndUpdate(category._id, {
            productCount: actualCount
          });
          
          result.updated = true;
          fixedCount++;
          
          console.log(`🔧 [FIX-COUNTS]   ✅ Updated successfully`);
        } else {
          console.log(`🔧 [FIX-COUNTS]   ✅ Count is correct`);
        }
        
        results.push(result);
      }

      // Generate summary
      const fixedCategories = results.filter(r => r.updated);
      const correctCategories = results.filter(r => !r.updated);
      const totalProducts = results.reduce((sum, r) => sum + r.newCount, 0);

      const summary = {
        totalCategories: results.length,
        categoriesFixed: fixedCount,
        categoriesCorrect: correctCategories.length,
        totalProducts,
        details: results,
        fixedCategories: fixedCategories.map(r => ({
          name: r.categoryName,
          slug: r.categorySlug,
          change: `${r.oldCount} → ${r.newCount}`
        }))
      };

      console.log(`🔧 [FIX-COUNTS] Complete! Fixed ${fixedCount} categories, total products: ${totalProducts}`);

      return createSuccessResponse(
        summary,
        `Category product counts updated successfully. Fixed ${fixedCount} categories.`
      );

    } catch (error) {
      console.error('❌ [FIX-COUNTS] Error:', error);
      return handleApiError(error, 'POST /api/admin/fix-category-counts');
    }
  }, ['admin'])(request);
}

/**
 * GET /api/admin/fix-category-counts
 * Check category counts without fixing them (dry run)
 */
export async function GET(request: NextRequest) {
  return withAuth(async (req, user) => {
    try {
      await connectDB();

      console.log('🔍 [CHECK-COUNTS] Checking category product counts...');
      
      // Get all categories with their current counts
      const categories = await Category.find({});
      
      const results: CategoryCountResult[] = [];
      let inconsistentCount = 0;

      for (const category of categories) {
        // Count actual products in this category
        const actualCount = await Product.countDocuments({
          category: category._id,
          isActive: true
        });
        
        const storedCount = category.productCount || 0;
        const isInconsistent = storedCount !== actualCount;
        
        if (isInconsistent) {
          inconsistentCount++;
        }

        results.push({
          categoryId: category._id.toString(),
          categoryName: category.name,
          categorySlug: category.slug,
          oldCount: storedCount,
          newCount: actualCount,
          updated: false
        });
      }

      const summary = {
        totalCategories: results.length,
        inconsistentCategories: inconsistentCount,
        consistentCategories: results.length - inconsistentCount,
        totalProducts: results.reduce((sum, r) => sum + r.newCount, 0),
        inconsistencies: results
          .filter(r => r.oldCount !== r.newCount)
          .map(r => ({
            name: r.categoryName,
            slug: r.categorySlug,
            stored: r.oldCount,
            actual: r.newCount,
            difference: r.newCount - r.oldCount
          })),
        details: results
      };

      console.log(`🔍 [CHECK-COUNTS] Found ${inconsistentCount} inconsistent categories`);

      return createSuccessResponse(
        summary,
        `Category count check complete. Found ${inconsistentCount} inconsistencies.`
      );

    } catch (error) {
      console.error('❌ [CHECK-COUNTS] Error:', error);
      return handleApiError(error, 'GET /api/admin/fix-category-counts');
    }
  }, ['admin'])(request);
}