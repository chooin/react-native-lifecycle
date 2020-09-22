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
  useInactive
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

  // ? App 从后台变成前台运行
  useActive(() => {})

  // ? App 从前台变后台运行
  useInactive(() => {})
}
```
