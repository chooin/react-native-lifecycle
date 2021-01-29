# React Native Lifecycle

[![Latest Version on NPM](https://img.shields.io/npm/v/react-native-lifecycle.svg?style=flat-square)](https://npmjs.com/package/react-native-lifecycle)
[![npm](https://img.shields.io/npm/dt/react-native-lifecycle.svg?style=flat-square)](https://www.npmjs.com/package/react-native-lifecycle)

[English](./README.md)

### 如何安装

```sh
yarn add react-native-lifecycle
```

### 第三方依赖

```sh
yarn add @react-navigation/native # >= 5.7.0
```

### 如何使用

##### 全局 Hooks

```js
import { useAppActive, useAppInactive } from 'react-native-lifecycle';

export default function App() {
  // App 从后台变为前台时执行
  useAppActive(() => {});

  // App 从前台变为后台时执行
  useAppInactive(() => {});
}
```

##### 页面 Hooks

```js
import {
  useLoad,
  useShow,
  useHide,
  useUnload,
  useResize,
} from 'react-native-lifecycle';

export default function Page() {
  // 页面创建时执行
  useLoad(() => {});

  // 页面出现在前台时执行
  useShow(() => {});

  // 页面从前台变为后台时执行
  useHide(() => {});

  // 页面销毁时执行
  useUnload(() => {});

  // 页面尺寸变化时执行
  useResize(() => {});
}
```
