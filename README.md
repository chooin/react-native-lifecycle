# React Native Lifecycle

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/chooin/react-native-lifecycle/blob/master/LICENSE)
[![Latest Version on NPM](https://img.shields.io/npm/v/react-native-lifecycle.svg)](https://npmjs.com/package/react-native-lifecycle)
[![npm](https://img.shields.io/npm/dt/react-native-lifecycle.svg)](https://www.npmjs.com/package/react-native-lifecycle)
[![build status](https://github.com/chooin/react-native-lifecycle/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/chooin/react-native-lifecycle/actions/workflows/test.yml)

[简体中文](./README.zh-CN.md)

### Install

```sh
yarn add react-native-lifecycle
```

### Peer Dependencies

```sh
yarn add @react-navigation/native # >= 5.7.0 or >= 6.0.0
```

### Support

| package name           | version | react-native version |
| ---------------------- | ------- | -------------------- |
| react-native-lifecycle | 2.0.0+  | 0.65.0+              |
| react-native-lifecycle | 1.2.4+  | 0.59.0+              |

### Usage

[Example](https://github.com/Chooin/react-native-lifecycle-example)

##### Global Hooks

```js
import { useAppActive, useAppInactive } from 'react-native-lifecycle';

export default function App() {
  // Called when the application from background to foreground
  useAppActive(() => {});

  // Called when the application from foreground to background
  useAppInactive(() => {});
}
```

##### Page/Screen Hooks

```js
import {
  useMount,
  useShow,
  useHide,
  useUnmount,
  useResize,
} from 'react-native-lifecycle';

export default function Page() {
  // Called when the component is mounted
  useMount(() => {});

  // Called when the page is displayed or in the application from background to foreground
  useShow(() => {});

  // Called when the page is hidden or in the application from foreground to background
  useHide(() => {});

  // Called when the component is unmounted
  useUnmount(() => {});

  // Called after the page window resize
  useResize(() => {});
}
```
