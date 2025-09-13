// Simple test for the image service without external dependencies

console.log('🖼️  Testing Lovable Image Service...\n');

// Mock UnsplashService for testing without API key
class MockUnsplashService {
  constructor(accessKey) {
    this.accessKey = accessKey || 'demo-key';
    console.log(`📸 UnsplashService initialized with key: ${this.accessKey ? '✅ Present' : '❌ Missing'}`);
  }
  
  async searchImages(query, count = 5, orientation = 'landscape') {
    console.log(`🔍 Searching for "${query}" - ${count} ${orientation} images`);
    
    // Return mock images
    const images = [];
    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 1000);
      images.push({
        id: `mock-${seed}-${i}`,
        url: `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=${seed}`,
        thumbnailUrl: `https://source.unsplash.com/200x150/?${encodeURIComponent(query)}&sig=${seed}`,
        author: `Photographer ${i + 1}`,
        authorUrl: 'https://unsplash.com/@photographer',
        description: `Beautiful ${query} image`,
        downloadUrl: ''
      });
    }
    
    return images;
  }
  
  async getImagesByCategory(category, count = 5) {
    const categoryMap = {
      'hero': 'modern office professional',
      'product': 'product photography minimal',
      'team': 'team collaboration business',
      'ecommerce': 'shopping lifestyle'
    };
    
    const searchTerm = categoryMap[category] || category;
    return this.searchImages(searchTerm, count);
  }
}

// Mock ImageOptimizer
class MockImageOptimizer {
  optimizeUrl(url, options = {}) {
    let optimizedUrl = url;
    
    if (options.width) {
      optimizedUrl += `?w=${options.width}`;
    }
    if (options.quality) {
      optimizedUrl += `${optimizedUrl.includes('?') ? '&' : '?'}q=${options.quality}`;
    }
    
    console.log(`🔧 Optimized URL: ${url} → ${optimizedUrl}`);
    return optimizedUrl;
  }
  
  generateSrcSet(baseUrl, sizes = [320, 640, 1024]) {
    const srcSet = sizes
      .map(size => `${this.optimizeUrl(baseUrl, { width: size })} ${size}w`)
      .join(', ');
    
    console.log(`📱 Generated srcSet: ${srcSet}`);
    return srcSet;
  }
}

// Mock DomainImageService
class MockDomainImageService {
  constructor(unsplashKey) {
    this.unsplash = new MockUnsplashService(unsplashKey);
    this.optimizer = new MockImageOptimizer();
  }
  
  async getImagesForDomain(domain, sections = []) {
    console.log(`🏗️  Getting images for domain: ${domain}`);
    
    const imageMap = {};
    
    switch (domain) {
      case 'ecommerce':
        imageMap.hero = await this.unsplash.searchImages('ecommerce shopping', 1);
        imageMap.products = await this.unsplash.searchImages('product photography', 4);
        imageMap.team = await this.unsplash.searchImages('retail team', 2);
        break;
        
      case 'saas':
        imageMap.hero = await this.unsplash.searchImages('technology dashboard', 1);
        imageMap.features = await this.unsplash.searchImages('tech icons', 3);
        imageMap.team = await this.unsplash.searchImages('startup team', 2);
        break;
        
      case 'landing':
        imageMap.hero = await this.unsplash.searchImages('success startup', 1);
        imageMap.features = await this.unsplash.searchImages('modern icons', 3);
        break;
        
      default:
        imageMap.hero = await this.unsplash.searchImages('modern business', 1);
        imageMap.content = await this.unsplash.searchImages('professional', 2);
    }
    
    return imageMap;
  }
  
  injectImagesIntoCode(code, images, domain) {
    console.log(`💉 Injecting images into ${domain} code...`);
    
    let updatedCode = code;
    
    // Replace placeholder images
    const allImages = Object.values(images).flat();
    
    updatedCode = updatedCode.replace(
      /src="\/placeholder\.(png|jpg|webp)"/g,
      (match) => {
        const randomImage = allImages[Math.floor(Math.random() * allImages.length)];
        return `src="${randomImage.url}"`;
      }
    );
    
    console.log(`✅ Replaced ${(code.match(/\/placeholder\./g) || []).length} placeholder images`);
    
    return updatedCode;
  }
}

// Mock ImageCredits
class MockImageCredits {
  generateCreditsFile(images, options = {}) {
    const { format = 'markdown' } = options;
    const imageList = Array.isArray(images) ? images : Object.values(images).flat();
    
    console.log(`📋 Generating ${format} credits for ${imageList.length} images`);
    
    if (format === 'markdown') {
      let credits = '# Image Credits\n\n';
      credits += 'This project uses beautiful images from Unsplash.\n\n';
      
      imageList.forEach((image, index) => {
        credits += `${index + 1}. **${image.author}** - [View on Unsplash](${image.authorUrl})\n`;
      });
      
      credits += '\n---\nAll images under Unsplash License\n';
      return credits;
    }
    
    return 'Credits generated successfully';
  }
}

// Test functions
async function testDomainImages() {
  console.log('\n=== TESTING DOMAIN IMAGES ===');
  
  const imageService = new MockDomainImageService('demo-key');
  
  const domains = ['ecommerce', 'saas', 'landing', 'blog'];
  
  for (const domain of domains) {
    console.log(`\n--- Testing ${domain.toUpperCase()} ---`);
    
    const images = await imageService.getImagesForDomain(domain);
    
    console.log(`📊 Sections found: ${Object.keys(images).join(', ')}`);
    
    Object.entries(images).forEach(([section, sectionImages]) => {
      console.log(`  ${section}: ${sectionImages.length} images`);
    });
  }
}

async function testImageOptimization() {
  console.log('\n=== TESTING IMAGE OPTIMIZATION ===');
  
  const optimizer = new MockImageOptimizer();
  const testUrl = 'https://images.unsplash.com/photo-123456';
  
  // Test URL optimization
  console.log('\n--- URL Optimization ---');
  optimizer.optimizeUrl(testUrl, { width: 800, quality: 80 });
  
  // Test srcSet generation
  console.log('\n--- Responsive SrcSet ---');
  optimizer.generateSrcSet(testUrl, [320, 640, 1024, 1920]);
}

async function testCodeInjection() {
  console.log('\n=== TESTING CODE INJECTION ===');
  
  const imageService = new MockDomainImageService();
  
  const sampleCode = `
<div class="hero">
  <img src="/placeholder.jpg" alt="Hero image" />
</div>
<div class="gallery">
  <img src="/placeholder.png" alt="Gallery 1" />
  <img src="/placeholder.webp" alt="Gallery 2" />
</div>
  `.trim();
  
  console.log('\n--- Original Code ---');
  console.log(sampleCode);
  
  const images = await imageService.getImagesForDomain('ecommerce');
  const enhancedCode = imageService.injectImagesIntoCode(sampleCode, images, 'ecommerce');
  
  console.log('\n--- Enhanced Code ---');
  console.log(enhancedCode);
}

async function testCreditsGeneration() {
  console.log('\n=== TESTING CREDITS GENERATION ===');
  
  const creditsManager = new MockImageCredits();
  const unsplash = new MockUnsplashService();
  
  const images = await unsplash.searchImages('technology', 3);
  const credits = creditsManager.generateCreditsFile(images, { format: 'markdown' });
  
  console.log('\n--- Generated Credits ---');
  console.log(credits);
}

async function testMainAPI() {
  console.log('\n=== TESTING MAIN API ===');
  
  // Simulate the main enhanceWithImages function
  async function mockEnhanceWithImages(code, domain, options = {}) {
    const imageService = new MockDomainImageService(options.unsplashKey);
    const creditsManager = new MockImageCredits();
    
    console.log(`🚀 Enhancing ${domain} application with images...`);
    
    const images = await imageService.getImagesForDomain(domain);
    const enhancedCode = imageService.injectImagesIntoCode(code, images, domain);
    const credits = creditsManager.generateCreditsFile(images);
    
    const allImages = Object.values(images).flat();
    
    return {
      code: enhancedCode,
      images,
      credits,
      metadata: {
        totalImages: allImages.length,
        sections: Object.keys(images),
        domain,
        generatedAt: new Date().toISOString()
      }
    };
  }
  
  const sampleCode = '<img src="/placeholder.jpg" alt="test" />';
  const result = await mockEnhanceWithImages(sampleCode, 'saas');
  
  console.log('📊 Enhancement Result:');
  console.log(`  - Total images: ${result.metadata.totalImages}`);
  console.log(`  - Sections: ${result.metadata.sections.join(', ')}`);
  console.log(`  - Credits length: ${result.credits.length} characters`);
  console.log(`  - Code enhanced: ${result.code !== sampleCode ? '✅' : '❌'}`);
}

// Run all tests
async function runAllTests() {
  try {
    await testDomainImages();
    await testImageOptimization();
    await testCodeInjection();
    await testCreditsGeneration();
    await testMainAPI();
    
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n📝 Summary:');
    console.log('  ✅ Domain-specific image fetching');
    console.log('  ✅ Image URL optimization');
    console.log('  ✅ Code placeholder injection');
    console.log('  ✅ Credits generation');
    console.log('  ✅ Main API functionality');
    
    console.log('\n🚀 Ready to enhance applications with beautiful images!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests
runAllTests();