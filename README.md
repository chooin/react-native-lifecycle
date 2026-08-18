

# React Native Lifecycle

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/chooin/react-native-lifecycle/blob/master/LICENSE)
[![Latest Version on NPM](https://img.shields.io/npm/v/react-native-lifecycle.svg)](https://npmjs.com/package/react-native-lifecycle)
[![npm](https://img.shields.io/npm/dt/react-native-lifecycle.svg)](https://www.npmjs.com/package/react-native-lifecycle)
[![build status](https://github.com/chooin/react-native-lifecycle/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/chooin/react-native-lifecycle/actions/workflows/test.yml)

[简体中文](./README.zh-CN.md)

### Install

```sh
pnpm add react-native-lifecycle
```

### Peer Dependencies

```sh
pnpm add @react-navigation/native # >= 6.0.0, optional: only required by useShow / useHide
```

### Support

| package name           | version | react version | react-native version |
| ---------------------- | ------- | ------------- | -------------------- |
| react-native-lifecycle | 3.0.0+  | 18.0.0+       | 0.73.0+              |
| react-native-lifecycle | 2.0.0+  | -             | 0.65.0+              |
| react-native-lifecycle | 1.2.4+  | -             | 0.59.0+              |

### Usage

[Example](https://github.com/Chooin/react-native-lifecycle-example)

##### Global Hooks

```js
import { useAppActive, useAppInactive } from 'react-native-lifecycle';

export default function App() {
  // Called when the app returns to the foreground
  useAppActive(() => {});

  // Called when the app leaves the foreground
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
  // Called once when the component is mounted
  useMount(() => {});

  // Called when the screen gains focus, or when the app returns to the foreground while the screen is focused
  useShow(() => {});

  // Called when the screen loses focus, or unmounts while focused, or when the app leaves the foreground while the screen is focused
  useHide(() => {});

  // Called once when the component is unmounted
  useUnmount(() => {});

  // Called when the window dimensions change
  useResize(() => {});
}
```
