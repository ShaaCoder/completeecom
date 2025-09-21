# 📊 CSV Bulk Upload Feature

## 🎯 **Overview**
The CSV Bulk Upload feature allows administrators to upload multiple products at once using a CSV (Comma Separated Values) file. This is perfect for:
- Initial product catalog setup
- Adding large inventories
- Migrating from other e-commerce platforms
- Bulk product updates

## 🚀 **How to Use**

### **1. Access the Bulk Upload**
1. Go to **Admin Panel** → **Bulk Upload** tab
2. You'll see the CSV upload interface

### **2. Download the Template**
1. Click **"Download Template"** button
2. This downloads a `product_template.csv` file with:
   - All required and optional column headers
   - A sample product row showing the correct format

### **3. Prepare Your CSV File**
1. Open the template in Excel, Google Sheets, or any spreadsheet application
2. Fill in your product data following the template format
3. Save as CSV format

### **4. Upload Your File**
1. Click **"Select CSV File"** or drag & drop your CSV file
2. Preview will show first few rows to verify format
3. Click **"Upload Products"** to start processing
4. Monitor the progress bar and wait for completion

### **5. Review Results**
After upload, you'll see:
- ✅ **Success summary**: Number of products created
- ❌ **Error details**: Any validation failures with specific row numbers
- 📋 **Product list**: Names and slugs of successfully created products

## 📋 **CSV Format Requirements**

### **Required Columns**
These columns **must** be included and have values:

| Column | Description | Example |
|--------|-------------|---------|
| `name` | Product name | "Red Lipstick Matte" |
| `description` | Product description | "Long-lasting matte lipstick" |
| `price` | Product price (number) | "599" |
| `images` | Image URLs (comma-separated) | "https://example.com/img1.jpg,uploads/products/img2.jpg" |
| `category` | Category name (must match existing) | "Makeup" |
| `brand` | Brand name | "BeautyBrand" |
| `stock` | Stock quantity (number) | "50" |

### **Optional Columns**
These can be left empty if not needed:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `originalPrice` | Number | Original price for discounts | "799" |
| `subcategory` | Text | Subcategory name | "Lipsticks" |
| `rating` | Number (0-5) | Product rating | "4.5" |
| `reviewCount` | Number | Number of reviews | "125" |
| `tags` | Comma-separated | Product tags | "matte,long-lasting,waterproof" |
| `features` | Comma-separated | Product features | "Long-lasting,Matte finish,Waterproof" |
| `ingredients` | Comma-separated | Ingredients list | "Dimethicone,Cyclopentasiloxane" |
| `isNewProduct` | Boolean | New product flag | "true" or "false" |
| `isBestseller` | Boolean | Bestseller flag | "true" or "false" |
| `isFeatured` | Boolean | Featured product flag | "true" or "false" |
| `sku` | Text | Stock Keeping Unit | "LP001" |
| `barcode` | Text | Product barcode | "123456789" |
| `color` | Text | Product color | "Red" |
| `size` | Text | Product size | "3.5g" |
| `material` | Text | Material composition | "Cotton blend" |
| `scent` | Text | Fragrance/scent | "Rose" |
| `gender` | Text | Target gender | "women", "men", "unisex" |
| `ageGroup` | Text | Age group | "adult", "teen", "kids" |
| `manufacturer` | Text | Manufacturer name | "BeautyBrand Inc" |
| `countryOfOrigin` | Text | Country of origin | "India" |
| `allergens` | Comma-separated | Allergen information | "nuts,dairy" |
| `dietaryInfo` | Comma-separated | Dietary information | "vegan,cruelty-free" |
| `skinType` | Comma-separated | Suitable skin types | "oily,combination" |
| `hairType` | Comma-separated | Suitable hair types | "curly,damaged" |
| `careInstructions` | Comma-separated | Care instructions | "Store in cool place" |
| `certifications` | Comma-separated | Product certifications | "FDA Approved" |
| `keywords` | Comma-separated | SEO keywords | "lipstick,makeup,beauty" |
| `metaTitle` | Text (max 60 chars) | SEO title | "Best Matte Lipstick" |
| `metaDescription` | Text (max 160 chars) | SEO description | "Premium matte lipstick with 12-hour staying power" |
| `minOrderQuantity` | Number | Minimum order qty | "1" |
| `maxOrderQuantity` | Number | Maximum order qty | "10" |
| `season` | Text | Seasonal relevance | "summer", "winter", "all-season" |
| `spf` | Number (0-100) | SPF value for cosmetics | "30" |

## 🔧 **Data Format Guidelines**

### **Images**
- **URLs**: `https://example.com/image.jpg`
- **Local uploads**: `uploads/products/filename.jpg`
- **Multiple images**: Separate with commas (no spaces)
- **Example**: `https://cdn.site.com/img1.jpg,uploads/products/img2.jpg`

### **Categories**
- Must match existing category names **exactly**
- Case-sensitive: "Makeup" ≠ "makeup"
- Check your existing categories in the Categories tab

### **Boolean Fields**
- Use: `true`, `false`, `1`, `0`, `yes`, `no`
- Leave empty for false

### **Array Fields** (tags, features, etc.)
- Separate multiple values with commas
- Example: `"tag1,tag2,tag3"`
- Spaces around commas are automatically trimmed

### **Numbers**
- Prices: Use decimal format `599.99`
- Stock: Use whole numbers `50`
- Ratings: Use decimal 0-5 `4.5`

## ✅ **Validation Rules**

### **Automatic Validation**
The system checks for:
- ✅ Required fields are present
- ✅ Proper number formats
- ✅ Valid image URLs/paths
- ✅ Category exists in database
- ✅ Rating within 0-5 range
- ✅ Stock is non-negative
- ✅ Prices are positive numbers

### **Error Reporting**
If validation fails:
- Shows specific row numbers with errors
- Lists exact error messages
- Displays total errors found
- Process stops until errors are fixed

## 📊 **Sample CSV Data**

```csv
name,description,price,originalPrice,images,category,brand,stock,rating,tags,isNewProduct
"Red Matte Lipstick","Long-lasting matte lipstick",599,799,"https://example.com/red-lipstick.jpg","Makeup","BeautyBrand",50,4.5,"matte,long-lasting,red",true
"Blue Eyeshadow","Shimmery blue eyeshadow palette",899,1199,"https://example.com/eyeshadow.jpg,uploads/products/eyeshadow2.jpg","Makeup","ColorBrand",30,4.2,"eyeshadow,shimmer,blue",false
```

## 🚨 **Common Issues & Solutions**

### **Issue: "Category not found"**
**Solution**: 
- Check exact spelling and case
- Ensure category exists in Categories tab
- Create missing categories first

### **Issue: "Invalid image URL"**
**Solution**:
- Ensure URLs start with `http://` or `https://`
- For local uploads, use format: `uploads/products/filename.jpg`
- Check for typos in URLs

### **Issue: "Price must be positive number"**
**Solution**:
- Remove currency symbols: `599` not `$599`
- Use decimal format: `599.99`
- Don't use commas in numbers

### **Issue: "CSV parsing errors"**
**Solution**:
- Save file as proper CSV format
- Ensure commas in text are properly quoted: `"text, with comma"`
- Check for special characters

## 📈 **Performance Tips**

### **File Size**
- **Recommended**: Under 5MB per upload
- **Max products**: 1000+ products per file
- **Large files**: Split into smaller batches

### **Processing Time**
- **Small files** (< 100 products): ~30 seconds
- **Medium files** (100-500 products): ~2-3 minutes
- **Large files** (500+ products): ~5+ minutes

### **Best Practices**
- Test with 5-10 products first
- Use template as starting point
- Prepare images beforehand
- Create categories before bulk upload
- Keep backup of original CSV

## 🔍 **Troubleshooting**

### **Upload Fails Completely**
1. Check file format is `.csv`
2. Verify required columns exist
3. Test with template file first
4. Check server logs for detailed errors

### **Partial Success**
1. Review failed products in results
2. Fix errors in original CSV
3. Upload only failed rows again
4. Check for duplicate SKUs/names

### **Images Not Displaying**
1. Verify image URLs are accessible
2. Check local upload paths format
3. Use image URL helper for testing
4. Ensure images are properly uploaded first

## 📁 **File Structure**

```
/api/products/bulk-upload/
├── route.ts                 # API endpoint
├── GET (template download)  # CSV template generation
└── POST (file upload)      # CSV processing

/components/admin/
└── csv-upload.tsx          # Upload component

/docs/
└── CSV_BULK_UPLOAD.md      # This documentation
```

## 🎉 **Success! What's Next?**

After successful upload:
1. ✅ **Review Products**: Check the Products tab
2. 🖼️ **Verify Images**: Ensure images display correctly
3. 🏷️ **Check Categories**: Confirm proper categorization
4. 📝 **Edit if Needed**: Use individual product forms for fine-tuning
5. 🚀 **Go Live**: Your bulk products are ready!

---

**Need Help?** The CSV upload feature includes built-in validation and error reporting to guide you through any issues. Always test with a small file first! 🚀