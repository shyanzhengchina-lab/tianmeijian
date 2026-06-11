const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx)',
    '**/*.(test|spec).(ts|tsx)'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/api/(.*)$': '<rootDir>/src/shared/api/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@/components/(.*)$': '<rootDir>/src/shared/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/shared/hooks/$1',
    '^@/stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@/utils/(.*)$': '<rootDir>/src/shared/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/shared/types/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@rc-component/picker/locale/(.*)$': '<rootDir>/src/__tests__/__mocks__/localeMock.js'
  },
  setupFiles: ['<rootDir>/test-setup.js'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],
  coverageDirectory: '<rootDir>/coverage',
  testTimeout: 10000,
  maxWorkers: '50%',
  verbose: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(antd|@ant-design|rc-.+?|@babel/runtime|.pnpm)/)'
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
