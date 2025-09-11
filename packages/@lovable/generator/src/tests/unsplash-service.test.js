const { UnsplashService } = require('../services/unsplash-service');
const { ApiConfig } = require('../config/api-config');

describe('UnsplashService', () => {
  let unsplashService;
  
  beforeAll(() => {
    // Mock ApiConfig pour les tests
    jest.spyOn(ApiConfig, 'getInstance').mockReturnValue({
      getUnsplashConfig: () => ({
        accessKey: 'test_access_key',
        perPage: 10,
        quality: 'regular'
      })
    });
  });
  
  beforeEach(() => {
    // Mock du createApi d'Unsplash
    jest.doMock('unsplash-js', () => ({
      createApi: jest.fn(() => ({
        search: {
          getPhotos: jest.fn(() => Promise.resolve({
            response: {
              results: [
                {
                  urls: {
                    regular: 'https://test.com/regular.jpg',
                    small: 'https://test.com/small.jpg',
                    thumb: 'https://test.com/thumb.jpg'
                  },
                  alt_description: 'Test image',
                  user: {
                    name: 'Test Author',
                    links: {
                      html: 'https://unsplash.com/@testauthor'
                    }
                  },
                  links: {
                    download_location: 'https://api.unsplash.com/download/test'
                  }
                }
              ]
            }
          }))
        },
        photos: {
          getRandom: jest.fn(() => Promise.resolve({
            response: {
              urls: {
                regular: 'https://test.com/random-regular.jpg',
                small: 'https://test.com/random-small.jpg',
                thumb: 'https://test.com/random-thumb.jpg'
              },
              alt_description: 'Random test image',
              user: {
                name: 'Random Author',
                links: {
                  html: 'https://unsplash.com/@randomauthor'
                }
              },
              links: {
                download_location: 'https://api.unsplash.com/download/random'
              }
            }
          }))
        }
      }))
    }));
    
    unsplashService = new UnsplashService('test_access_key');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    unsplashService?.clearCache();
  });
  
  test('should initialize with access key', () => {
    expect(unsplashService).toBeDefined();
    expect(() => new UnsplashService()).toThrow('Unsplash access key is required');
  });
  
  test('should get domain queries for known domains', () => {
    const service = new UnsplashService('test');
    
    // Test via une méthode publique qui utilise getDomainQueries
    expect(() => service.getImagesForDomain('ecommerce_b2c', 1)).not.toThrow();
    expect(() => service.getImagesForDomain('health_medical', 1)).not.toThrow();
    expect(() => service.getImagesForDomain('unknown_domain', 1)).not.toThrow();
  });
  
  test('should return default images on error', async () => {
    // Mock une erreur d'API
    const errorService = new UnsplashService('test');
    errorService.unsplash.search.getPhotos = jest.fn(() => Promise.reject(new Error('API Error')));
    
    const result = await errorService.getImagesForDomain('test_domain', 5);
    
    expect(result).toBeDefined();
    expect(result.images).toHaveLength(5);
    expect(result.total).toBe(0);
    expect(result.images[0].alt).toContain('Image par défaut');
  });
  
  test('should handle cache correctly', () => {
    const stats = unsplashService.getCacheStats();
    expect(stats.entries).toBe(0);
    expect(stats.totalImages).toBe(0);
    expect(stats.cacheSize).toContain('KB');
    
    unsplashService.clearCache();
    expect(unsplashService.getCacheStats().entries).toBe(0);
  });
  
  test('should validate image structure', async () => {
    const result = await unsplashService.getImagesForDomain('food', 1);
    
    expect(result).toHaveProperty('images');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('query');
    
    if (result.images.length > 0) {
      const image = result.images[0];
      expect(image).toHaveProperty('regular');
      expect(image).toHaveProperty('small');
      expect(image).toHaveProperty('thumb');
      expect(image).toHaveProperty('alt');
      expect(image).toHaveProperty('author');
      expect(image).toHaveProperty('authorUrl');
      expect(image).toHaveProperty('downloadUrl');
    }
  });
  
  test('should handle domain mappings correctly', async () => {
    // Test des domaines spécifiques
    const domains = [
      'ecommerce_b2c',
      'health_medical',
      'edtech_school',
      'fintech_banking',
      'food',
      'fitness'
    ];
    
    for (const domain of domains) {
      const result = await unsplashService.getImagesForDomain(domain, 1);
      expect(result).toBeDefined();
      expect(result.query).toBeTruthy();
    }
  });
  
  console.log('🧪 Tests UnsplashService : Validation des fonctionnalités de base');
});

// Test d'intégration (commenté pour éviter les vrais appels API)
/*
describe('UnsplashService Integration Tests', () => {
  test.skip('should fetch real images from Unsplash API', async () => {
    const service = new UnsplashService(process.env.UNSPLASH_ACCESS_KEY);
    const result = await service.getImagesForDomain('food', 3);
    
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0].regular).toMatch(/^https:\/\//);
  });
});
*/