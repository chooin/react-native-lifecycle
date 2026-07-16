import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { __reset as resetReactNative } from './mocks/react-native';

afterEach(() => {
  // 顺序要紧:先卸载组件,让 hook 的 cleanup 跑完、自行摘掉监听器,
  // 再清空替身。反过来会掩盖"忘记 remove"这类真 bug。
  cleanup();
  resetReactNative();
});
