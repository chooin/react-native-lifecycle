# React Native Composition API

[![Latest Version on NPM](https://img.shields.io/npm/v/react-native-composition.svg?style=flat-square)](https://npmjs.com/package/react-native-composition)
[![npm](https://img.shields.io/npm/dt/react-native-composition.svg?style=flat-square)](https://www.npmjs.com/package/react-native-composition)

### 如何安装

``` sh
yarn add react-native-composition
```

##### 第三方依赖

``` sh
yarn add @react-navigation/native # >=5.6.0
```


### 如何使用

##### App 生命周期 Hooks

``` js
import {
  useAppActive,
  useAppInactive,
} from 'react-native-composition';

export default function App() {
  // App 从后台变为前台时执行
  useAppActive(() => {})

  // App 从前台变为后台时执行
  useAppInactive(() => {})
}
```

##### Page 生命周期 Hooks

``` js
import {
  useLoad,
  useShow,
  useHide,
  useUnload,
  useResize,
  useActive,
  useInactive,
} from 'react-native-composition';

export default function Page() {
  // 页面创建时执行
  useLoad(() => {})

  // 页面出现在前台时执行
  useShow(() => {})

  // 页面从前台变为后台时执行
  useHide(() => {})

  // 页面销毁时执行
  useUnload(() => {})

  // 页面尺寸变化时执行
  useResize(() => {})

  // 当前页面从 App 后台变为前台时执行
  useActive(() => {})

  // 当前页面从 App 前台变为后台时执行
  useInactive(() => {})
}
```
