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
yarn add react-native-permissions mitt dayjs
```

### 支持

| 安装包                  | 版本号 | react-native 版本号 |
| ----------------------- | ------ | ------------------- |
| react-native-tools-next | 2.1.5+ | 0.65.0+             |

### 如何使用

[例子](https://github.com/Chooin/react-native-tools-next-example)

### 全局 Hooks

```js
import {
  useAppActive,
  useAppInactive,
  usePermissions,
} from 'react-native-tools-next';
import { PERMISSIONS } from 'react-native-permissions';

export default function App() {
  // App 从后台变为前台时执行
  useAppActive(() => {});

  // App 从前台变为后台时执行
  useAppInactive(() => {});

  // 检查是否打开了多个权限 或请求多个权限
  // status ()=>Promise<boolean> 权限已启用？
  // request ()=>Promise<void> 向系统申请权限
  // openSettings ()=>Promise<void> 打开系统权限设置
  const [status, request, openSettings] = usePermissions([
    PERMISSIONS.IOS.CAMERA,
    PERMISSIONS.ANDROID.CAMERA,
  ]);
  const handleClickOrUseShow = async () => {
    let pass = await status();
    if (!pass) {
      try {
        await request();
      } catch {
        openSettings();
      }
    }
  };
}
```

### 页面 Hooks

```js
import {
  useMount,
  useShow,
  useHide,
  useUnmount,
  useResize,
  useWaitReturn,
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
  useWaitReturn(exit => {
    Alert.alert(
      'useWaitReturn Demo',
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

### Util

##### **msg**

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

##### requestPermissions

```js
import { requestPermissions } from 'react-native-tools-next';
import { PERMISSIONS, RESULTS } from 'react-native-permissions';
// 向系统申请尚未打开的权限
// 当获取权限失败时 返回打开系统权限设置的方法
const handleClickOrUseShow = async() => {
  try {
     await requestPermissions(
       [PERMISSIONS.IOS.CAMERA, PERMISSIONS.ANDROID.CAMERA],
       RESULTS.GRANTED,
     );
   } catch (error:any) {
     error.openSettings();
   }
}
```

##### debounce

```js
import { debounce } from 'react-native-tools-next';
/**
 * 防抖是指在一定时间内，如果事件再次被触发，
 * 就取消之前的操作并重新开始计时。
 * 通常用于处理用户快速点击按钮等场景。
 */
const handleClick = debounce(() => console.log(1), 1000);

// 立刻触发
handleClick(); // 1
handleClick(); // undefined
handleClick(); // undefined
handleClick(); // undefined
handleClick(); // undefined
// 暂停一秒后
handleClick(); // 1
handleClick(); // undefined
handleClick(); // undefined
```

##### throttle

```js
import { throttle } from 'react-native-tools-next';
/**
 * 截流是指在一段时间内只执行一次函数，
 * 通常用于处理窗口滚动、鼠标移动等频繁触发的事件。
 */
const listenForScrolling = throttle(() => new Date().getSeconds(), 2000);

// 立刻触发
listenForScrolling(); // 1
listenForScrolling(); // undefined
listenForScrolling(); // undefined
listenForScrolling(); // 4
listenForScrolling(); // undefined
listenForScrolling(); // undefined
listenForScrolling(); // 7
```
