# React Native Composition API

[![Latest Version on NPM](https://img.shields.io/npm/v/react-native-composition.svg?style=flat-square)](https://npmjs.com/package/react-native-composition)
[![npm](https://img.shields.io/npm/dt/react-native-composition.svg?style=flat-square)](https://www.npmjs.com/package/react-native-composition)

> 依赖 @react-navigation

### 如何安装

``` sh
yarn add react-native-composition
```

### 如何使用

``` js
import {
  useLoad,
  useShow,
  useHide,
  useUnload,
  useResize,
  useActive,
  useInactive,
  useAppActive,
  useAppInactive,
} from 'react-native-composition';

export default function App() {
  // ? 页面创建时执行
  useLoad(() => {})

  // ? 页面出现在前台时执行
  useShow(() => {})

  // ? 页面从前台变为后台时执行
  useHide(() => {})

  // ? 页面销毁时执行
  useUnload(() => {})

  // ? 页面尺寸变化时执行
  useResize(() => {})

  // ? App 从后台变为前台时执行（方法执行后只有执行过该方法的页面且满足条件才会再次执行）
  useActive(() => {})

  // ? App 从前台变为后台时执行（方法执行后只有执行过该方法的页面且满足条件才会再次执行）
  useInactive(() => {})

  // ? App 从后台变为前台时执行（方法执行后只有满足条件才会再次执行）
  useAppActive(() => {})

  // ? App 从前台变为后台时执行（方法执行后只有满足条件才会再次执行）
  useAppInactive(() => {})
}
```
