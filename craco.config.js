const CracoAlias = require('react-app-alias');

module.exports = {
  webpack: {
    alias: {
      '@': './src',
      '@/shared': './src/shared',
      '@/modules': './src/modules',
      '@/components': './src/shared/components',
      '@/hooks': './src/shared/hooks',
      '@/utils': './src/shared/utils',
      '@/types': './src/shared/types',
      '@/api': './src/shared/api',
      '@/stores': './src/shared/stores'
    }
  }
};

module.exports = CracoAlias({
  webpack: {
    alias: {
      '@': './src',
      '@/shared': './src/shared',
      '@/modules': './src/modules',
      '@/components': './src/shared/components',
      '@/hooks': './src/shared/hooks',
      '@/utils': './src/shared/utils',
      '@/types': './src/shared/types',
      '@/api': './src/shared/api',
      '@/stores': './src/shared/stores'
    }
  }
});