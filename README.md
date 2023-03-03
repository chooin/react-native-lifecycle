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
yarn add react-native-permissions mitt dayjs
```

### Support

| package name            | version | react-native version |
| ----------------------- | ------- | -------------------- |
| react-native-tools-next | 2.1.5+  | 0.65.0+              |

### Usage

[Example](https://github.com/name-q/react-native-tools-next-example)

### Global Hooks

```js
import {
  useAppActive,
  useAppInactive,
  usePermissions,
} from 'react-native-tools-next';
import { PERMISSIONS } from 'react-native-permissions';

export default function App() {
  // Called when the application from background to foreground
  useAppActive(() => {});

  // Called when the application from foreground to background
  useAppInactive(() => {});

  // Check whether multiple permissions are open
  // or request multiple permissions
  // status ()=>Promise<boolean> permission enabled?
  // request ()=>Promise<void> Apply to the system for permission
  // openSettings ()=>Promise<void> open setting method
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

### Page/Screen Hooks

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
  // Called when the component is mounted
  useMount(() => {});

  // Called when the page is displayed
  // or in the application from background to foreground
  useShow(() => {});

  // Called when the page is hidden or in the application
  // from foreground to background
  useHide(() => {});

  // Called when the component is unmounted
  useUnmount(() => {});

  // Called after the page window resize
  useResize(() => {});

  // Intercept return to make the return controllable
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
// Implement global messages:
//   subscribe, unsubscribe, and send messages to subscription

export function PageA() {
  React.useEffect(() => {
    const subscribe = msg.on('A', (message) => {
      Alert.alert(
        `pageA message received:::${message}`
      );
    });
    // uninstall subscribe
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
          <..>send a message to the pageA</..>
        </...>
        <... onPress={() => msg.off('A')}>
          <..>uninstall pageA subscribe</..>
        </...>
      </>
    )
}
```

##### requestPermissions

```js
import { requestPermissions } from 'react-native-tools-next';
import { PERMISSIONS, RESULTS } from 'react-native-permissions';
// Apply to the system for permission that has not been opened
// When obtaining permission fails, return to the open setting method
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
 * Debouncing refers to canceling the previous operation and restarting the timer
 * if an event is triggered again within a certain time period.
 * It is usually used to handle rapid button clicks,
 * and other scenarios.
 */
const handleClick = debounce(() => console.log(1), 1000);

// immediately
handleClick(); // 1
handleClick(); // undefined
handleClick(); // undefined
handleClick(); // undefined
handleClick(); // undefined
//  Pause for one second later
handleClick(); // 1
handleClick(); // undefined
handleClick(); // undefined
```

##### throttle

```js
import { throttle } from 'react-native-tools-next';
/**
 * Throttling refers to executing a function only once within a certain period of time,
 * usually used to handle events that are frequently triggered,
 * such as window scrolling, mouse movement, and so on.
 */
const listenForScrolling = throttle(() => new Date().getSeconds(), 2000);

// immediately
listenForScrolling(); // 1
listenForScrolling(); // undefined
listenForScrolling(); // undefined
listenForScrolling(); // 4
listenForScrolling(); // undefined
listenForScrolling(); // undefined
listenForScrolling(); // 7
```
