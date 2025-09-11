// Configuration globale pour les tests Jest

import fs from 'fs-extra';
import path from 'path';

// Créer les dossiers nécessaires pour les tests
beforeAll(() => {
  const testDirs = [
    'test-output',
    'logs/test',
    'generated-apps/test'
  ];

  testDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    fs.ensureDirSync(fullPath);
  });
});

// Nettoyer après tous les tests
afterAll(() => {
  const cleanupDirs = [
    'test-output',
    'logs/test',
    'generated-apps/test'
  ];

  cleanupDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(fullPath)) {
      fs.removeSync(fullPath);
    }
  });
});

// Configuration des mocks globaux
global.console = {
  ...console,
  // Supprimer les logs en mode test sauf erreurs
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Garder les erreurs
};

// Mock des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.ANTHROPIC_API_KEY = 'test-key-for-mocking';
process.env.MAX_REQUESTS_PER_MINUTE = '60';
process.env.MAX_GENERATIONS_PER_DAY = '50';
process.env.MAX_DAILY_COST = '50.00';