import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    alias: {
      'next/link': path.resolve(__dirname, './src/__tests__/mocks/next-link.tsx'),
      'next/image': path.resolve(__dirname, './src/__tests__/mocks/next-image.tsx'),
      'next/navigation': path.resolve(__dirname, './src/__tests__/mocks/next-navigation.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
