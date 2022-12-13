# React Native Tools Next

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/name-q/react-native-tools-next/blob/master/LICENSE)
[![Latest Version on NPM](https://img.shields.io/npm/v/react-native-tools-next.svg)](https://npmjs.com/package/react-native-tools-next)
[![npm](https://img.shields.io/npm/dt/react-native-tools-next.svg)](https://www.npmjs.com/package/react-native-tools-next)
[![build status](https://github.com/name-q/react-native-tools-next/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/name-q/react-native-tools-next/actions/workflows/test.yml)

[简体中文](./README.zh-CN.md)

### Install

```sh
yarn add react-native-tools-next
```

### Peer Dependencies

```sh
yarn add @react-navigation/native # >= 6.0.0
```

### Support

| package name            | version | react-native version |
| ----------------------- | ------- | -------------------- |
| react-native-tools-next | 2.1.1+  | 0.65.0+              |

### Usage

[Example](https://github.com/name-q/react-native-tools-next-example)

##### Global Hooks

```js
import { useAppActive, useAppInactive } from 'react-native-tools-next';

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
  useWaitRemove,
} from 'react-native-tools-next';

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

  // Intercept return to make the return controllable
  useWaitRemove(exit => {
    Alert.alert(
      'useWaitRemove Demo',
      'Are you sure to discard them and leave the screen?',
      [
        {
          text: "Don't leave",
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => exit(),
        },
      ],
    );
  });
}
```
