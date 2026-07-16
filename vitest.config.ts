import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    alias: {
      // 运行时走替身,类型走真包。
      // 理由见 docs/superpowers/specs/2026-07-16-rn-086-vitest-upgrade-design.md
      'react-native': fileURLToPath(
        new URL('./test/mocks/react-native.ts', import.meta.url),
      ),
    },
  },
});
