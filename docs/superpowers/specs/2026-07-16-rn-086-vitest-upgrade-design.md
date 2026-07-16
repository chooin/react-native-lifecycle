# 升级到 RN 0.86 + React 19,测试栈迁移到 vitest

日期:2026-07-16
状态:待实现

## 背景

仓库 HEAD 停在 2023-12(`f904587`),休眠约两年半。`yarn test` 在干净安装下失败:`tsc --noEmit` 通过,`jest` **启动失败**,零个测试执行。

调查结论分两层,必须区分开:

- **对使用者:RN 0.86(最新版)已经完全可用,零改动。** peer 范围 `react-native: ">= 0.65.0"` 开放上界;用到的 4 个 API(`AppState.addEventListener`、`Dimensions.addEventListener`、`Platform.select`、`subscription.remove()`)在 0.86 全部健在且无废弃标记;发布的 `dist/index.d.ts` 零 import,不引用任何 RN/React 类型,因此下游 RN 升级不可能波及它。
- **对维护者:开发工具链已经跟不上。** 这份设计只解决第二层。

### 关键实测证据

| 组合                               | 结果                    |
| ---------------------------------- | ----------------------- |
| RN 0.86 + `@types/react@19`        | 2 处报错(均为 `useRef`) |
| RN 0.86 + `@types/react@18`        | 零错误                  |
| RN 0.86 + React 19 + 修补 `useRef` | 零错误                  |

**换 RN 到 0.86 不产生任何错误,换 React types 才产生。** 报错来自 React 19 的 `useRef` 类型变更(不再允许无参调用),不是 RN 的 API 变更。

## 目标

`yarn test` 跑绿,且 `yarn build` 产出与线上 2.1.2 逐字节一致。补全 7 个 hook 的测试。

## 非目标(明确不做)

- **不动 `peerDependencies`**,保持 `react-native: ">= 0.65.0"`。测试栈的 RN 下界是**测试**约束,不是**运行时**约束;抬高 peer 下界会平白打断 0.65–0.77 上的现有用户,而那些 API 已验证从 0.65 起就存在。
- **不动 README 支持表**(`2.0.0+ → 0.65.0+` 依然准确)。
- **不发版**。
- **不升 `husky` / `prettier` / `pretty-quick`** —— 全在 pre-commit 链路,不参与 `yarn test`。prettier 2→3 会重排整个代码库,是纯噪音。
- **不换构建工具**(见下节)。

## 决策记录

### 为什么不用 vite 做构建

现构建:`tsc` 出 per-file JS 到 `dist/` + `api-extractor` 把所有 `.d.ts` 滚成一个 `dist/index.d.ts`。

vite 的三个核心价值在此全部落空:

- **dev server / HMR** —— 这是个库,没有 dev server。
- **bundling** —— 7 个文件、约 150 行、零运行时依赖;Metro 也不在乎。
- **依赖预构建** —— 没有依赖可预构建(RN 和 react-navigation 都是 peer,必须 external)。

代价却真实:vite 不产出 `.d.ts`,需额外引入 `vite-plugin-dts`。而 `dist/index.d.ts` 是本库**最不能出错的产物** —— 那些 `@public` TSDoc **就是**发布出去的 API 文档,api-extractor 的 rollup 是其唯一来源。

**结论:tsc + api-extractor 在此场景不是历史包袱,是正确工具。**

### 为什么用 vitest + 完全 mock RN,而不是 jest + RN preset

两条路都可行,选择"完全 mock"是因为**本库从不渲染任何 RN 组件** —— 7 个 hook 全是 `(fn: () => void) => void`,只订阅 `AppState`/`Dimensions`。在 node 里加载真 react-native 买不到任何东西:真的 `AppState` 在测试环境不会 emit 任何事件。

而本库真正需要的测试**本来就必须 mock AppState**。既然如此,没有理由先扛一整层基础设施把真 RN 加载进来、再把它 mock 掉。

被砍掉的成本(若走 jest + `@react-native/jest-preset`,这些都得扛):

| RN preset 提供的                                                                                                                 | 完全 mock 后 |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| babel 剥 Flow(RN 0.86 发布的是 `@flow strict-local` 源码,esbuild 解析不了)                                                       | 不需要       |
| 强制转换 `node_modules/react-native`                                                                                             | 不需要       |
| haste 平台解析(`.ios`/`.android`/`.native`)                                                                                      | 不需要       |
| 自定义 resolver(32 行)                                                                                                           | 不需要       |
| `setup.js`(177 行,注入 `__DEV__`/`performance`/`nativeFabricUIManager`;且自身调用 `jest.fn()`/`jest.mock()`,是 jest-specific 的) | 不需要       |
| `customExportConditions: ['require','react-native']`                                                                             | 不需要       |

CLAUDE.md 记载的两个崩溃(babel preset 找不到、`global.performance` 只读)**根源都在这一层**。不加载真 RN,它们不是"被修好",而是**不存在了**。

**承认的代价:**

1. **mock 会漂移** —— RN 真改了契约,mock 照样绿。缓解:本库契约面极小(`addEventListener` 返回带 `.remove()` 的对象、`Platform.select`、`Dimensions.addEventListener`),已验证跨 0.65→0.86 二十一个版本未变。
2. **偏离 RN 生态默认路径** —— jest preset 由 Meta 维护跟进,vitest 配置需自行维护。缓解:配置面极小(压根不碰真 RN)。

### 为什么 `react-native` 仍留在 devDependencies

**角色变了:只提供类型,运行时永不加载。**

`tsc --noEmit` 需要真 RN 的 `.d.ts` 校验 `import { AppState } from 'react-native'`;vitest 通过 alias 把运行时的 `react-native` 指向 mock。**类型走真货,运行时走替身。**

这正好取 RN 好的那一半:痛点全在运行时(Flow 源码、haste、原生模块),而 `.d.ts` 是干净的 TypeScript。

### 为什么用 `@testing-library/react` 的 `renderHook`

`@testing-library/react-hooks` 当年被废弃,正是因为功能并入了 `@testing-library/react` v13.1+ —— 这是**官方指定迁移路径**。返回形状 `{ result, rerender, unmount }` 一致,现有测试各改一行 import。

替代方案 `test-renderer@1.2.0`(2 个包 vs 6 个包,无需 jsdom)被否:它只导出 `createRoot`,`render`/`unmount` 均标注 "Must be called within act()",需自写 ~15 行 `renderHook`。把 act/cleanup 语义握在自己手里,不适合一个休眠仓库。

### 为什么 api-extractor 必须与 TypeScript 同步升级

api-extractor **自带一份 TypeScript**(7.34 内置 TS ~4.8.4,7.58.10 内置 TS 5.9.3),用自己捆绑的那份解析 `.d.ts`,而非项目的 tsc。TS 升到 5.9 而 api-extractor 停在 7.34,会用 4.8 的解析器读 5.9 产出的声明文件。

`yarn test` 和 `yarn build` 是两条独立命令。**只盯着 test 变绿,很容易让 build 悄悄坏掉。**

### 为什么 Node 必须升到 24

`.nvmrc` 写的是 `20`,而 **Node 20 已于 2026-04-30 EOL**(权威数据来自 `node-releases` 包)。RN 0.86 的 engines 为 `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`。

Node 24 是当前 Active LTS,EOL 2028-04-30,runway 最长。(Node 22 维护期至 2027-04-30;Node 25 已 EOL。)

## 变更清单

### 依赖

**新增**:`vitest` ^4.1.10、`@testing-library/react` ^16.3.2、`@testing-library/dom` ^10、`react-dom` ^19.2.3、`@types/react-dom` ^19、`jsdom` ^29.1.1

`@testing-library/dom` 必须显式声明:它是 `@testing-library/react` 的**非可选** peer,而 yarn v1 不自动安装 peer。

**`vite` 不需要声明。** 它既是 vitest 4 的必装 peer,也是其真实 `dependency`,安装 vitest 时自动带入(实测得到 vite 8.1.5)。这正是本设计"要 vitest、不要 vite 构建"的分界:vite 作为 **vitest 的引擎**是白拿的零配置产物;vite 作为**构建工具**才需要付出 `vite.config.ts` + `vite-plugin-dts`、并交出 `dist/index.d.ts` 的生成权。

**删除**:`jest`、`ts-jest`、`babel-jest`、`@types/jest`、`@testing-library/react-hooks`、`react-test-renderer`、`@types/react-native`

- `@types/react-native` 删除原因:RN 0.71+ 自带类型,留着与内置类型冲突。
- `@testing-library/react-hooks` 删除原因:peer 为 `react ^16.9 || ^17`,**连 React 18 都不支持**(仓库现装 React 18,早已在契约外运行,yarn v1 对 peer 冲突只警告不拦截,把问题藏了两年)。
- `react-test-renderer` 删除原因:React 19 已废弃。

**升级**:`react-native` ^0.68.2→^0.86.0、`react` ^18.1.0→^19.2.3、`@types/react` ^18.0.9→^19.1.1、`@react-navigation/native` ^6.0.8→^7.3.8、`typescript` ^4.6.3→^5.9.3、`@microsoft/api-extractor` ^7.34.0→^7.58.10、`zx` ^6.0.7→^8.8.5

**不动**:`husky` ^7.0.2、`prettier` ^2.6.1、`pretty-quick` ^3.1.1

升不升的判据是**是否在 `yarn test` / `yarn build` 的执行路径上**,而非包的新旧:

- `zx` 升级 —— `scripts/test.mjs` 和 `scripts/build.mjs` 都是 zx 脚本,它在路径上。二者只用了 `` await $`cmd` `` 这一个核心 API,跨 zx 6→8 稳定。
- `husky` / `prettier` / `pretty-quick` 不升 —— 只在 git pre-commit 钩子里跑,不参与两条命令。升 prettier 2→3 还会因默认值变更重排整个代码库,是纯噪音。

### Node 24 兼容性核对

全部新增/升级包的 `engines` 均已核对通过:`vitest@4.1.10` (`^20.0.0 || ^22.0.0 || >=24.0.0`)、`jsdom@29.1.1` (`^20.19.0 || ^22.13.0 || >=24.0.0`)、`zx@8.8.5` (`>= 12.17.0`)、`react-native@0.86.0` (`^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`)。

### 文件

| 动作 | 文件                                                 | 说明                                                                                                                                                                          |
| ---- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 删除 | `jest.config.js`                                     | 由 `vitest.config.ts` 取代                                                                                                                                                    |
| 删除 | `babel.config.js`                                    | 已无人读取(不再有 babel-jest;消费者的 Metro 用消费者自己的 babel 配置)                                                                                                        |
| 新增 | `vitest.config.ts`                                   | ① alias `react-native`/`@react-navigation/native` → mock;② `environment: 'jsdom'`(`@testing-library/react` 经 react-dom 渲染,无 DOM 必挂);③ `setupFiles: ['./test/setup.ts']` |
| 新增 | `test/setup.ts`                                      | 全局 `afterEach`:先 `cleanup()` 再 `__reset()` 替身。RTL 的自动 cleanup 依赖全局 `afterEach`,vitest 默认 `globals: false` 下不生效,必须显式接管                               |
| 新增 | `test/mocks/react-native.ts`                         | 受控 AppState/Dimensions/Platform                                                                                                                                             |
| 新增 | `test/mocks/react-navigation.ts`                     | 受控 useNavigation                                                                                                                                                            |
| 改   | `src/useShow/index.ts:16`、`src/useHide/index.ts:16` | `useRef<NativeEventSubscription>()` → `useRef<NativeEventSubscription \| undefined>(undefined)`                                                                               |
| 改   | 3 个现有测试文件                                     | 各改一行 import                                                                                                                                                               |
| 新增 | 4 个测试文件                                         | useAppInactive / useResize / useShow / useHide                                                                                                                                |
| 改   | `scripts/test.mjs`                                   | `jest` → `vitest run`                                                                                                                                                         |
| 改   | `.nvmrc`                                             | `20` → `24`                                                                                                                                                                   |
| 改   | `.github/workflows/test.yml`                         | 见下                                                                                                                                                                          |

### `tsconfig.json` 不动

`"include": ["src/index.ts"]` 保持原样。**这是刻意的**:该文件同时被 `tsc`(构建,emit 到 `dist/`)和 `tsc --noEmit`(测试)使用。把测试加进 `include` 会导致 `yarn build` 把测试文件也 emit 到 `dist/`。

副作用:测试文件不被 `tsc --noEmit` 检查,vitest 用 esbuild 转译也不做类型检查。**这与现状一致**(现状是 ts-jest 会检查,但 jest 从来没跑起来过,所以测试实际上从未被类型检查)。属已知缺口,不在本次范围。

### CI(`.github/workflows/test.yml`)

现状 `yarn add @react-navigation/native react-native react @types/react @types/react-native`(无锁安装,且安装了本次要删的 `@types/react-native`)→ 改为 `yarn install --frozen-lockfile`(`yarn.lock` 已在仓库中且被跟踪)。

`node-version` `20.x` → `24.x`;`actions/checkout@v3`、`actions/setup-node@v3` → `v4`。

理由:CLAUDE.md 记载 CI 与本地从未测试同一套依赖。若修完后 CI 仍无锁安装,**在 CI 上依然拿不到可信信号**。

## Mock 设计

### `test/mocks/react-native.ts`

只覆盖本库真正用到的 API 面。类型在 mock 内部本地定义,不从 `react-native` import(避免运行时自引用)。

已核对源码,四个 RN hook 实际只触及以下 4 点 —— **`AppState.currentState` 和 `Dimensions.get()` 均无人调用,故不实现**(保持 mock 面最小,是抑制 mock 漂移的主要手段):

- `AppState.addEventListener(type, listener) → { remove }`
- `Dimensions.addEventListener('change', listener) → { remove }`
- `Platform.OS`(可切换)、`Platform.select(spec)`
- `NativeEventSubscription`(仅类型导出,运行时擦除)

外加测试控制面(命名以 `__` 前缀标明非 RN 真实 API):`__emitAppState(state)`、`__emitDimensions(payload)`、`__setPlatform(os)`、`__listenerCount()`、`__reset()`。

`__listenerCount()` 是必需的 —— 它是验证"unmount 后监听器被移除"的唯一手段,而这正是本库 `subscribe.remove()` 契约的核心。

`Platform.select` 须还原真实语义:返回 `spec[Platform.OS]`,缺失则回退 `spec.native`,再缺失则 `spec.default`。

### `test/mocks/react-navigation.ts`

提供 `useNavigation()` → `{ addListener(event, cb) → unsubscribe }`,外加 `__emitFocus()`、`__emitBlur()`、`__reset()`。

**关键约束:`useNavigation()` 必须返回模块级单例对象。** `useShow`/`useHide` 的 effect 依赖数组是 `[navigation]`;若每次渲染返回新对象,会导致无限重订阅。

**注意 API 形状差异**:react-navigation 的 `addListener` 返回的是**取消订阅函数**(`() => void`),不是 `{ remove }` —— 与 RN 的 `AppState.addEventListener` 不同。hook 里直接把它作为 effect 的 cleanup 返回,mock 必须匹配这个形状。

## 测试设计

### 跨用例隔离由 `test/setup.ts` 统一负责

**`@testing-library/react` 的自动 cleanup 在此失效,必须显式接管。** RTL 是靠探测全局 `afterEach` 来自动注册组件卸载的;而 vitest 默认 `globals: false`,没有全局 `afterEach`,自动 cleanup 静默不生效 —— 组件会跨用例残留、监听器持续累积,`__listenerCount()` 类断言随即失去意义。

因此新增 `test/setup.ts`(挂在 `vitest.config.ts` 的 `setupFiles`),用一个全局 `afterEach` 同时做两件事,顺序不可颠倒:

1. `cleanup()` —— 卸载组件,让 hook 自己的 cleanup 跑完、自行摘除监听器
2. `__reset()` 两个 mock —— 清空残留并把 `Platform.OS` 复位为 `ios`

**顺序即语义**:先卸载再清空,监听器是被 hook 主动摘掉的;反过来先清空,则任何"忘记 remove"的真 bug 都会被 `__reset()` 掩盖成绿色。

这样各测试文件无需 `beforeEach` 样板,平台设置也不会跨用例泄漏。

| Hook             | 要验证的行为                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `useMount`       | 挂载调用一次;rerender 不再调用;unmount 不调用(**现有测试,仅改 import**)                                     |
| `useUnmount`     | 挂载/rerender 不调用;unmount 调用一次(**现有测试,仅改 import**)                                             |
| `useAppActive`   | emit `'active'` → 调用;emit `'background'` → 不调用;unmount 后监听器数归零                                  |
| `useAppInactive` | **ios**:`'inactive'` → 调用,`'background'` → 不调用;**android**:`'background'` → 调用,`'inactive'` → 不调用 |
| `useResize`      | emit 尺寸变化 → 调用;unmount 后监听器数归零                                                                 |
| `useShow`        | focus → 调用;**后台返回去重**(见下);blur 后移除 AppState 监听器                                             |
| `useHide`        | blur → 调用;focus 后 ios `'inactive'` / android `'background'` → 调用                                       |

**实现测试时的关键前提:`useShow`/`useHide` 只在 focus 后才挂载 AppState 监听器,blur 时移除**(设计如此 —— 屏幕只在自己是活动屏时才监听)。因此这两个 hook 的任何 AppState 相关断言,都必须**先 `__emitFocus()`**,否则监听器根本不存在,`__emitAppState()` 会静默无效果、测试假绿。`useAppActive`/`useAppInactive`/`useResize` 无此前提 —— 它们在 mount 时直接订阅。

### 两个 CLAUDE.md 点名的脆弱点,必须被锁住

**1. 平台差异** —— `Platform.select({ ios: 'inactive', android: 'background' })` 在 `useHide`、`useAppInactive`、`useShow` 三处重复,未被抽取。`useAppInactive` 的双平台测试是这条不变式的唯一保护。

**2. `useShow` 的后台返回去重** —— 从后台返回会**同时**触发 AppState `'active'` 和 react-navigation `'focus'`;`isAppStateChangeRef` 使后续的 focus 被识别为 resume 而跳过,让 AppState 路径独占该次调用。测试场景:

```
__emitFocus()              → fn 第 1 次(首次进入)
__emitAppState('inactive') → 记录已后台(ios)
__emitAppState('active')   → fn 第 2 次(恢复)
__emitFocus()              → 必须【不】触发
断言 fn 共调用 2 次
```

若去重逻辑被破坏,此处会得到 3 次。

## 验证标准

1. `tsc --noEmit` 零错误。
2. vitest **真的执行测试**且全绿 —— 关键指标是**测试计数 > 0**,而非"没报错"。现状的失败模式恰恰是启动失败、零测试执行,"没有红色输出"不等于通过。
3. `yarn build` 产出的 `dist/index.d.ts` 与线上 2.1.2 **逐字节一致**(零 import、7 个 `@public` hook)。

第 3 条是防回归锚点 —— 它是"使用者侧无感知"这一承诺的**可执行证据**。

## 风险

| 风险                                                                                                                                                                       | 缓解                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **补测试可能照出既有 bug**。已注意到:`useShow` 每次 `focus` 都新增一个 AppState 监听器并覆盖 `AppStateRef.current`,若 focus 连续触发两次而中间无 blur,前一个监听器会泄漏。 | 若测试暴露既有 bug,**报告并询问后再修**,不在本次静默修复。                                                                           |
| `husky@7` + Node 24:`yarn install` 会触发 `prepare: husky install`,husky 7 是 2021 年的包,且不在升级清单里                                                                 | 沙箱先撞。崩了则最小化升 husky 9(需同步改 `.husky/pre-commit` 写法),届时再回来更新本设计的"不动"清单                                 |
| **alias 未生效导致真 react-native 被加载** —— 症状会是 Flow 语法解析错误,而非静默失败                                                                                      | 验证时正面确认 mock 生效:断言 `__setPlatform('android')` 能改变 `Platform.OS`。真 RN 的 `Platform.OS` 不可写,若 alias 失效此断言必挂 |
| **测试文件不被类型检查**(esbuild 只转译不校验;`tsconfig.json` 的 `include` 又够不到测试)                                                                                   | 接受。与现状一致 —— 现状的 ts-jest 虽会校验,但 jest 从未跑起来,测试实际上从未被类型检查过。不在本次范围                              |

## 实施顺序

采用**沙箱先行**策略:先在临时目录调通 `RN 0.86 + React 19 + vitest + mock` 组合、让测试真跑绿,确认配置可行后再一次性移植回仓库。

理由:仓库现有 `yarn test` 是红的,**没有基线可对比**,分不清"新错误"还是"老错误"。在沙箱里撞墙比在仓库里撞墙便宜,仓库全程保持干净,不会卡在既跑不起来又不好回滚的半成品状态。

(已排除"分阶段递进"方案:中间态如 RN 0.68 配 vitest 是不会保留的组合,为其调试是纯浪费;且 jest 现状就是红的,前几个阶段结束时依然拿不到绿色信号 —— 递进的价值在于每步都有信号,而此处信号不存在。)
