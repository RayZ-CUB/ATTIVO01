module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'services/**/*.ts',
    'store/**/*.ts',
    'hooks/**/*.ts',
    '!services/**/*.test.ts',
    '!store/**/*.test.ts',
    '!hooks/**/*.test.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^expo-router$': '<rootDir>/__mocks__/expo-router.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
    }],
    '^.+\\.jsx?$': ['ts-jest', {
      isolatedModules: true,
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|expo|@expo|expo-router|@supabase)/)',
  ],
  clearMocks: true,
};
