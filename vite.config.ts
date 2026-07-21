import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      bundleTypes: true,
      include: ['src'],
      exclude: ['**/__tests__/**'],
    }),
  ],
  build: {
    target: 'es2015',
    minify: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: format => (format === 'es' ? 'index.mjs' : 'index.js'),
    },
    rollupOptions: {
      external: ['react', 'react-native', '@react-navigation/native'],
    },
  },
});
