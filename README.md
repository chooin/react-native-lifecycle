# React Native Composition API

> 依赖 @react-navigation

### 生命周期 Lifecycle

- useLoad
- useShow
- useHide
- useUnload
- useResize

``` js
import {
  useLoad,
  useShow,
  useHide,
  useUnload,
  useResize,
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
}
```
