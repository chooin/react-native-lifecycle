# React Native Tools Next

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/name-q/react-native-tools-next/blob/master/LICENSE)
[![Latest Version on NPM](https://img.shields.io/npm/v/react-native-tools-next.svg)](https://npmjs.com/package/react-native-tools-next)
[![npm](https://img.shields.io/npm/dt/react-native-tools-next.svg)](https://www.npmjs.com/package/react-native-tools-next)
[![build status](https://github.com/name-q/react-native-tools-next/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/name-q/react-native-tools-next/actions/workflows/test.yml)

[English](./README.md)

### 如何安装

```sh
yarn add react-native-tools-next
```

### 第三方依赖

```sh
yarn add @react-navigation/native # >= 6.0.0
```

### 支持

| 安装包                  | 版本号 | react-native 版本号 |
| ----------------------- | ------ | ------------------- |
| react-native-tools-next | 2.1.4+ | 0.65.0+             |

### 如何使用

[例子](https://github.com/Chooin/react-native-tools-next-example)

##### 全局 Hooks

```js
import { useAppActive, useAppInactive } from 'react-native-tools-next';

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
  useWaitRemove,
} from 'react-native-tools-next';

export default function Page() {
  // 组件创建时执行
  useMount(() => {});

  // 页面出现在前台时执行
  useShow(() => {});

  // 页面从前台变为后台时执行
  useHide(() => {});

  // 组件销毁时执行
  useUnmount(() => {});

  // 页面尺寸变化时执行
  useResize(() => {});

  // 拦截返回并使返回可控
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

---

##### Util

###### **msg**

```js
import {
  msg
} from 'react-native-tools-next';

// msg => {on,off,emit,all,exist}
// 实现全局消息：订阅、取消订阅、发送、所有订阅Map值、是否存在此订阅Boolean

export function PageA() {
  React.useEffect(() => {
    const subscribe = msg.on('A', (message) => {
      Alert.alert(
        `pageA 收到消息:::${message}`
      );
    });
    // 取消订阅
    return subscribe.remove;
  }, []);
  ...
}

export function PageB(){
    ...
    return (
      <>
        <... onPress={
          () => {
            const result = msg.emit('A', 'hellow pageA');
            console.log(result, '< boolean');
          }}
        >
          <..>向pageA发送消息</..>
        </...>
        <... onPress={() => msg.off('A')}>
          <..>取消pageA的订阅</..>
        </...>
      </>
    )
}
```
