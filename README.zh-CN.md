# React Native Lifecycle

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/chooin/react-native-lifecycle/blob/master/LICENSE)
[![Latest Version on NPM](https://img.shields.io/npm/v/react-native-lifecycle.svg)](https://npmjs.com/package/react-native-lifecycle)
[![npm](https://img.shields.io/npm/dt/react-native-lifecycle.svg)](https://www.npmjs.com/package/react-native-lifecycle)
[![build status](https://github.com/chooin/react-native-lifecycle/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/chooin/react-native-lifecycle/actions/workflows/test.yml)

[English](./README.md)

### 如何安装

```sh
yarn add react-native-lifecycle
```

### 第三方依赖

```sh
yarn add @react-navigation/native # >= 5.7.0 或 >= 6.0.0
```

### 支持

| 安装包                 | 版本号 | react-native 版本号 |
| ---------------------- | ------ | ------------------- |
| react-native-lifecycle | 2.0.0+ | 0.65.0+             |
| react-native-lifecycle | 1.2.4+ | 0.59.0+             |

### 如何使用

[例子](https://github.com/Chooin/react-native-lifecycle-example)

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
  useMount,
  useShow,
  useHide,
  useUnmount,
  useResize,
} from 'react-native-lifecycle';

export default function Page() {
  // 页面或组件创建时执行
  useMount(() => {});

  // 页面出现在前台时执行
  useShow(() => {});

  // 页面从前台变为后台时执行
  useHide(() => {});

  // 页面或组件销毁时执行
  useUnmount(() => {});

  // 页面尺寸变化时执行
  useResize(() => {});
}
```
