import pandas as pd
import random

# Define sample values
brands = ["Optimus", "Health Supp", "GNC", "MuscleBlaze", "Ultimate Nutrition", "ON", "Labrada", "Dymatize"]
manufacturers = ["Optimus Inc", "GNC Ltd", "MuscleBlaze Pvt", "Ultimate Nutrition Co", "Dymatize India", "ON Labs"]
countries = ["India", "USA", "Germany", "UK", "Canada"]
flavors = ["Chocolate", "Vanilla", "Strawberry", "Mango", "Banana", "Cookies & Cream", "Unflavored"]
certifications = ["FSSAI Approved", "GMP Certified", "ISO 22000", "FDA Approved", "Halal Certified"]
dietary_info = ["vegetarian", "vegan", "non-GMO", "gluten-free", "organic"]
skin_types = ["normal", "dry", "oily", "combination", "sensitive"]
hair_types = ["straight", "wavy", "curly", "fine", "thick"]
allergens = ["nuts", "dairy", "gluten", "soy"]
seasons = ["spring", "summer", "fall", "winter", "all-season"]
genders = ["men", "women", "unisex"]
age_groups = ["adult", "teen", "senior", "all-ages"]

# ALL CSV COLUMNS (based on your bulk upload system)
all_columns = [
    'name', 'description', 'price', 'originalPrice', 'images', 'category', 'subcategory', 'brand', 'stock', 
    'rating', 'reviewCount', 'tags', 'features', 'ingredients', 'isNewProduct', 'isBestseller', 'isFeatured',
    'sku', 'barcode', 'color', 'size', 'material', 'scent', 'gender', 'ageGroup', 'manufacturer', 
    'countryOfOrigin', 'allergens', 'dietaryInfo', 'skinType', 'hairType', 'careInstructions', 
    'certifications', 'keywords', 'metaTitle', 'metaDescription', 'minOrderQuantity', 'maxOrderQuantity', 
    'season', 'spf'
]

# Generate 400 protein products
products = []
for i in range(1, 401):
    price = random.randint(999, 4999)
    original_price = price + random.randint(200, 1000)
    stock = random.randint(50, 300)
    rating = round(random.uniform(3.5, 5.0), 1)
    reviews = random.randint(50, 1000)
    brand = random.choice(brands)
    manufacturer = random.choice(manufacturers)
    country = random.choice(countries)
    flavor = random.choice(flavors)
    cert = random.choice(certifications)
    diet = random.choice(dietary_info)
    
    # Use correct image paths that exist
    image_num = (i % 9) + 1  # Cycle through protien1.jpg to protien9.jpg (based on your uploads)
    
    row = {
        "name": f"Protein Supplement {i}",
        "description": f"High-quality Protein supplement {i} ideal for muscle growth and recovery. {flavor} flavor for gym and fitness enthusiasts.",
        "price": price,
        "originalPrice": original_price,
        "images": f"uploads/products/protien{image_num}.jpg",  # Using your existing images
        "category": "Proteins",  # FIXED: Changed from "Protien" to "Proteins"
        "subcategory": "Health Supplement",
        "brand": brand,
        "stock": stock,
        "rating": rating,
        "reviewCount": reviews,
        "tags": "Protein,supplement,gym,fitness,muscle",  # FIXED: Spelling
        "features": f"Supports muscle growth,Boosts recovery,High Protein content,{flavor} flavor",  # FIXED: Spelling
        "ingredients": "Whey Protein Concentrate,Whey Protein Isolate,BCAAs,Digestive Enzymes",  # FIXED: Spelling
        "isNewProduct": random.choice(["TRUE", "FALSE"]),
        "isBestseller": random.choice(["TRUE", "FALSE"]),
        "isFeatured": random.choice(["TRUE", "FALSE"]),
        "sku": f"PROT{i:04d}",
        "barcode": str(random.randint(100000000000, 999999999999)),
        "color": "N/A",
        "size": f"{random.randint(500, 2000)}g",
        "material": "Plastic Jar",
        "scent": flavor,
        "gender": random.choice(genders),
        "ageGroup": random.choice(age_groups),
        "manufacturer": manufacturer,
        "countryOfOrigin": country,
        "allergens": random.choice(allergens) if random.choice([True, False]) else "",  # Optional
        "dietaryInfo": diet,
        "skinType": random.choice(skin_types) if random.choice([True, False]) else "",  # Optional
        "hairType": random.choice(hair_types) if random.choice([True, False]) else "",  # Optional
        "careInstructions": "Store in a cool dry place,Keep away from moisture",
        "certifications": cert,
        "keywords": "Protein,health,supplement,gym,fitness,muscle",  # FIXED: Spelling
        "metaTitle": f"{brand} Protein Supplement {i} - {flavor}",  # FIXED: Spelling
        "metaDescription": f"Buy {brand} {flavor} Protein supplement {i} - premium protein for strength, muscle growth, and fitness.",  # FIXED: Spelling
        "minOrderQuantity": 1,
        "maxOrderQuantity": random.randint(5, 20),
        "season": random.choice(seasons),
        "spf": ""  # Not applicable for protein supplements
    }
    
    products.append(row)

# Create DataFrame with all columns
df = pd.DataFrame(products, columns=all_columns)

# Save to CSV
output_file = "protein_products_400_complete.csv"
df.to_csv(output_file, index=False)

print(f"✅ {output_file} generated successfully!")
print(f"📊 Total products: {len(df)}")
print(f"🔧 All {len(all_columns)} CSV columns included")
print("🎯 Key fixes applied:")
print("   - Category: 'Protien' → 'Proteins'")
print("   - Spelling: 'Protien' → 'Protein' throughout")
print("   - All required CSV fields included")
print("   - Using existing image paths (protien1.jpg to protien9.jpg)")
print("   - Proper data types and validation-ready format")

# Display first few rows for verification
print("\n📋 Sample data preview:")
print(df[['name', 'category', 'images', 'price', 'brand']].head(3).to_string(index=False))