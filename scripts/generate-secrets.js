/**
 * Secure Secret Generation Script
 * 
 * Generates cryptographically secure secrets for production deployment
 * Run this script to generate new secrets for your .env file
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random string
function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

// Generate a secure hex string
function generateSecureHex(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate a secure URL-safe string
function generateSecureUrlSafe(length = 32) {
  return crypto.randomBytes(length).toString('base64url');
}

// Validate secret strength
function validateSecretStrength(secret) {
  const checks = {
    length: secret.length >= 32,
    entropy: calculateEntropy(secret) > 4.0,
    charset: /[A-Za-z0-9+/]/.test(secret),
    uniqueChars: new Set(secret).size > 16
  };
  
  return {
    isStrong: Object.values(checks).every(Boolean),
    checks
  };
}

// Calculate Shannon entropy
function calculateEntropy(str) {
  const frequencies = {};
  for (let char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  
  return Object.values(frequencies).reduce((entropy, freq) => {
    const p = freq / str.length;
    return entropy - p * Math.log2(p);
  }, 0);
}

// Generate all required secrets
function generateAllSecrets() {
  console.log('🔐 Generating secure secrets...\n');
  
  const secrets = {
    JWT_SECRET: generateSecureSecret(32),
    JWT_REFRESH_SECRET: generateSecureSecret(32),
    NEXTAUTH_SECRET: generateSecureSecret(32),
    MONGODB_DB_NAME: `ecommerce_${generateSecureUrlSafe(8).toLowerCase()}`,
    
    // Webhook secrets
    RAZORPAY_WEBHOOK_SECRET: generateSecureHex(32),
    STRIPE_WEBHOOK_SECRET: `whsec_${generateSecureUrlSafe(32)}`,
    
    // Session secrets
    SESSION_SECRET: generateSecureSecret(32),
    ENCRYPTION_KEY: generateSecureHex(32),
  };
  
  // Validate each secret
  console.log('🔍 Validating secret strength...\n');
  for (const [key, value] of Object.entries(secrets)) {
    const validation = validateSecretStrength(value);
    const status = validation.isStrong ? '✅' : '⚠️ ';
    console.log(`${status} ${key}: ${validation.isStrong ? 'Strong' : 'Weak'}`);
    
    if (!validation.isStrong) {
      console.log(`   Issues: ${Object.entries(validation.checks)
        .filter(([, passed]) => !passed)
        .map(([check]) => check)
        .join(', ')}`);
    }
  }
  
  return secrets;
}

// Create secure .env file
function createSecureEnvFile(secrets) {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  // Read .env.example as template
  let template = '';
  if (fs.existsSync(envExamplePath)) {
    template = fs.readFileSync(envExamplePath, 'utf8');
  } else {
    console.error('❌ .env.example file not found!');
    process.exit(1);
  }
  
  // Replace placeholder values with generated secrets
  let envContent = template;
  for (const [key, value] of Object.entries(secrets)) {
    // Find and replace the placeholder
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add if not found
      envContent += `\n${key}=${value}`;
    }
  }
  
  // Additional security configurations
  const securityConfig = `
# Auto-generated Security Configuration
NODE_ENV=production
ENABLE_SECURITY_HEADERS=true
ENABLE_DEBUG_LOGGING=false
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
LOG_LEVEL=info
`;
  
  envContent += securityConfig;
  
  // Create backup of existing .env
  if (fs.existsSync(envPath)) {
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    console.log(`📋 Backed up existing .env to: ${backupPath}`);
  }
  
  // Write new .env file
  fs.writeFileSync(envPath, envContent);
  
  // Set secure permissions (Unix/Linux only)
  if (process.platform !== 'win32') {
    fs.chmodSync(envPath, '600'); // Read/write for owner only
  }
  
  console.log('\n✅ Generated secure .env file');
}

// Generate deployment checklist
function generateDeploymentChecklist() {
  const checklistPath = path.join(__dirname, '..', 'SECURITY_CHECKLIST.md');
  
  const checklist = `# 🔒 Security Deployment Checklist

## Pre-Deployment Security Checklist

### ✅ Secrets Management
- [ ] Generated new secrets using \`generate-secrets.js\`
- [ ] Verified all secrets are at least 32 characters
- [ ] Ensured JWT_SECRET, JWT_REFRESH_SECRET, and NEXTAUTH_SECRET are different
- [ ] Updated production environment variables
- [ ] Removed .env from version control
- [ ] Set .env file permissions to 600 (Unix/Linux)

### ✅ Environment Configuration
- [ ] Set NODE_ENV=production
- [ ] Configured HTTPS URLs (no http:// in production)
- [ ] Updated NEXT_PUBLIC_APP_URL to production domain
- [ ] Verified MONGODB_URI uses strong credentials
- [ ] Enabled security headers (ENABLE_SECURITY_HEADERS=true)
- [ ] Disabled debug logging (ENABLE_DEBUG_LOGGING=false)

### ✅ Payment Gateway Security
- [ ] Using live API keys (not test keys)
- [ ] Webhook secrets configured
- [ ] Payment endpoints secured with proper validation
- [ ] API keys restricted to production domain

### ✅ Database Security
- [ ] MongoDB connection uses TLS/SSL
- [ ] Database user has minimal required permissions
- [ ] Connection string uses strong password
- [ ] Database firewall configured

### ✅ Server Configuration
- [ ] HTTPS certificate installed and valid
- [ ] Security headers configured in web server
- [ ] Rate limiting configured at server level
- [ ] File upload directory secured
- [ ] Error pages don't expose sensitive information

### ✅ Application Security
- [ ] All dependencies updated to latest versions
- [ ] Security headers enabled in Next.js config
- [ ] Content Security Policy configured
- [ ] CORS properly configured for production domains
- [ ] File upload validation implemented

### ✅ Monitoring & Logging
- [ ] Error tracking configured (Sentry/similar)
- [ ] Security event logging enabled
- [ ] Rate limiting alerts configured
- [ ] Uptime monitoring setup

### ✅ Testing
- [ ] Security scan completed
- [ ] Penetration testing performed
- [ ] Load testing completed
- [ ] SSL/TLS configuration verified

## Emergency Contacts & Procedures

### In Case of Security Incident
1. Immediately rotate all secrets
2. Check access logs for suspicious activity
3. Update all API keys
4. Review user accounts for unauthorized access
5. Document incident details

### Secret Rotation Schedule
- JWT Secrets: Every 90 days
- API Keys: Every 180 days
- Database Passwords: Every 90 days
- Webhook Secrets: Every 180 days

## Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---
Generated on: ${new Date().toISOString()}
`;

  fs.writeFileSync(checklistPath, checklist);
  console.log(`📝 Generated security checklist: ${checklistPath}`);
}

// Main execution
function main() {
  console.log('🚀 Secure E-commerce Deployment Setup\n');
  
  try {
    // Generate secrets
    const secrets = generateAllSecrets();
    
    // Create .env file
    createSecureEnvFile(secrets);
    
    // Generate checklist
    generateDeploymentChecklist();
    
    console.log('\n🎉 Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review and update the generated .env file with your actual API keys');
    console.log('2. Update NEXT_PUBLIC_APP_URL with your production domain');
    console.log('3. Configure your MongoDB connection string');
    console.log('4. Add your payment gateway credentials');
    console.log('5. Review SECURITY_CHECKLIST.md before deployment');
    console.log('\n⚠️  IMPORTANT: Never commit .env files to version control!');
    console.log('   Add .env to your .gitignore file if not already present.');
    
    // Display secret strength summary
    console.log('\n🔐 Generated Secrets Summary:');
    for (const [key, value] of Object.entries(secrets)) {
      console.log(`   ${key}: ${value.length} characters (${calculateEntropy(value).toFixed(1)} bits entropy)`);
    }
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSecureSecret,
  generateSecureHex,
  generateSecureUrlSafe,
  validateSecretStrength,
  calculateEntropy,
  generateAllSecrets
};