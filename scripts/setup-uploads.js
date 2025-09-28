const fs = require('fs');
const path = require('path');

// Create upload directories if they don't exist
const uploadDirs = [
  'public/uploads',
  'public/uploads/products',
  'public/uploads/categories'
];

console.log('Setting up upload directories...');

uploadDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  
  try {
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    } else {
      console.log(`✓ Directory already exists: ${dir}`);
    }
    
    // Check write permissions by creating a test file
    const testFile = path.join(fullPath, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`✓ Write permissions confirmed for: ${dir}`);
    
  } catch (error) {
    console.error(`✗ Error with directory ${dir}:`, error.message);
    process.exit(1);
  }
});

console.log('Upload directories setup completed successfully!');