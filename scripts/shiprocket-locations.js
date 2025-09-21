/**
 * Shiprocket Pickup Location Management Utility
 * 
 * This script helps you:
 * 1. Fetch all pickup locations from your Shiprocket account
 * 2. Find the correct pickup location ID
 * 3. Update your environment variables automatically
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const SHIPROCKET_CONFIG = {
  email: process.env.SHIPROCKET_EMAIL,
  password: process.env.SHIPROCKET_PASSWORD,
  baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external'
};

/**
 * Get authentication token from Shiprocket
 */
async function getShiprocketToken() {
  try {
    const response = await fetch(`${SHIPROCKET_CONFIG.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: SHIPROCKET_CONFIG.email,
        password: SHIPROCKET_CONFIG.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error('No token received from Shiprocket');
    }

    return data.token;
  } catch (error) {
    throw new Error(`Failed to authenticate with Shiprocket: ${error.message}`);
  }
}

/**
 * Fetch all pickup locations from Shiprocket account
 */
async function getPickupLocations() {
  try {
    const token = await getShiprocketToken();
    
    const response = await fetch(`${SHIPROCKET_CONFIG.baseUrl}/settings/company/pickup`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pickup locations: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.shipping_address || [];
  } catch (error) {
    throw new Error(`Failed to fetch pickup locations: ${error.message}`);
  }
}

/**
 * Display pickup locations in a formatted table
 */
function displayPickupLocations(locations) {
  console.log('\n🏢 Available Pickup Locations:');
  console.log('=' .repeat(80));
  
  if (!locations || locations.length === 0) {
    console.log('❌ No pickup locations found in your Shiprocket account');
    return;
  }

  locations.forEach((location, index) => {
    console.log(`\n📍 Location ${index + 1}:`);
    console.log(`   ID: ${location.id}`);
    console.log(`   Name: ${location.pickup_location}`);
    console.log(`   Address: ${location.address}`);
    if (location.address_2) {
      console.log(`   Address 2: ${location.address_2}`);
    }
    console.log(`   City: ${location.city}`);
    console.log(`   State: ${location.state}`);
    console.log(`   Pincode: ${location.pin_code}`);
    console.log(`   Phone: ${location.phone}`);
    console.log(`   Status: ${location.status === 2 ? 'Active' : 'Inactive'}`);
    console.log(`   Phone Verified: ${location.phone_verified === 1 ? 'Yes' : 'No'}`);
  });
}

/**
 * Update environment file with correct pickup location ID
 */
function updateEnvironmentFile(locationId) {
  const envPath = path.join(process.cwd(), '.env');
  
  try {
    if (!fs.existsSync(envPath)) {
      throw new Error('.env file not found');
    }

    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update the pickup location ID
    const pickupLocationRegex = /SHIPROCKET_PICKUP_LOCATION_ID=.*/;
    if (pickupLocationRegex.test(envContent)) {
      envContent = envContent.replace(pickupLocationRegex, `SHIPROCKET_PICKUP_LOCATION_ID=${locationId}`);
    } else {
      // Add the line if it doesn't exist
      envContent += `\nSHIPROCKET_PICKUP_LOCATION_ID=${locationId}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Updated .env file with pickup location ID: ${locationId}`);
  } catch (error) {
    console.error(`❌ Failed to update .env file: ${error.message}`);
  }
}

/**
 * Interactive selection of pickup location
 */
function selectPickupLocation(locations) {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🔢 Select the pickup location to use:');
    locations.forEach((location, index) => {
      console.log(`   ${index + 1}. ${location.pickup_location} (ID: ${location.id}) - ${location.city}, ${location.state}`);
    });

    rl.question('\nEnter the number of your preferred location (1-' + locations.length + '): ', (answer) => {
      const selectedIndex = parseInt(answer) - 1;
      
      if (selectedIndex >= 0 && selectedIndex < locations.length) {
        const selected = locations[selectedIndex];
        resolve(selected);
      } else {
        console.log('❌ Invalid selection. Using the first location.');
        resolve(locations[0]);
      }
      
      rl.close();
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Shiprocket Pickup Location Manager');
  console.log('====================================\n');

  // Validate configuration
  if (!SHIPROCKET_CONFIG.email || !SHIPROCKET_CONFIG.password) {
    console.error('❌ Missing Shiprocket credentials in environment variables');
    console.log('Please ensure SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are set in your .env file');
    process.exit(1);
  }

  try {
    console.log('1️⃣ Authenticating with Shiprocket...');
    console.log(`   Email: ${SHIPROCKET_CONFIG.email}`);
    
    console.log('\n2️⃣ Fetching pickup locations...');
    const locations = await getPickupLocations();
    
    displayPickupLocations(locations);

    if (locations && locations.length > 0) {
      // Auto-select if only one location, otherwise prompt user
      let selectedLocation;
      
      if (locations.length === 1) {
        selectedLocation = locations[0];
        console.log(`\n✅ Auto-selected the only available location: ${selectedLocation.pickup_location} (ID: ${selectedLocation.id})`);
      } else {
        selectedLocation = await selectPickupLocation(locations);
      }

      console.log(`\n🎯 Selected Location Details:`);
      console.log(`   ID: ${selectedLocation.id}`);
      console.log(`   Name: ${selectedLocation.pickup_location}`);
      console.log(`   Address: ${selectedLocation.address}${selectedLocation.address_2 ? ', ' + selectedLocation.address_2 : ''}`);
      console.log(`   City: ${selectedLocation.city}, ${selectedLocation.state} - ${selectedLocation.pin_code}`);

      // Update environment file
      updateEnvironmentFile(selectedLocation.id);

      console.log('\n🔄 Next Steps:');
      console.log('1. Restart your development server (npm run dev)');
      console.log('2. Test shipment creation with the updated pickup location');
      console.log('3. The pickup location ID has been updated in your .env file');
      
      console.log('\n✅ Pickup location configuration completed!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify Shiprocket credentials are correct');
    console.log('3. Ensure you have pickup locations configured in your Shiprocket account');
    console.log('4. Check if your Shiprocket account is active');
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getPickupLocations,
  getShiprocketToken,
  updateEnvironmentFile
};