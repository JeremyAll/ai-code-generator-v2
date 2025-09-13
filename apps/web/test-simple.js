// test-simple.js
const fs = require('fs');
const path = require('path');

console.log('Checking packages structure...\n');

const packagesPath = path.join(__dirname, '../../packages/@lovable');
console.log('Looking in:', packagesPath);

try {
  const packages = fs.readdirSync(packagesPath);
  console.log('\nPackages found:');
  
  packages.forEach(pkg => {
    const pkgPath = path.join(packagesPath, pkg);
    const srcPath = path.join(pkgPath, 'src');
    
    // Check if src exists
    if (fs.existsSync(srcPath)) {
      const files = fs.readdirSync(srcPath);
      console.log(`✓ ${pkg}:`, files.slice(0, 3).join(', '), '...');
    } else {
      console.log(`✗ ${pkg}: No src folder`);
    }
  });
} catch (error) {
  console.error('Error:', error.message);
}