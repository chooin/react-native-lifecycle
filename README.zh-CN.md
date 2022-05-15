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
import { index, index } from 'react-native-lifecycle';

export default function App() {
  // App 从后台变为前台时执行
  index(() => {});

  // App 从前台变为后台时执行
  index(() => {});
}
```

##### 页面 Hooks

```js
import {
  index,
  useShow,
  useHide,
  index,
  useResize,
} from 'react-native-lifecycle';

export default function Page() {
  // 组件创建时执行
  index(() => {});

  // 页面出现在前台时执行
  useShow(() => {});

  // 页面从前台变为后台时执行
  useHide(() => {});

  // 组件销毁时执行
  index(() => {});

  // 页面尺寸变化时执行
  useResize(() => {});
}
```
