# RN 0.86 + React 19 升级与 vitest 迁移 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `yarn test` 从"jest 启动失败、零测试执行"变成"7 个 hook 全绿",同时保证 `yarn build` 产出与线上 2.1.2 逐字节一致。

**Architecture:** 运行时完全替换 `react-native`(mock),类型仍走真包。砍掉整层 Flow/babel/jest-preset 基础设施 —— 本库从不渲染 RN 组件,只订阅 `AppState`/`Dimensions`,加载真 RN 在测试环境零价值。构建链(tsc + api-extractor)不动。

**Tech Stack:** vitest 4 + @testing-library/react 16 + jsdom · TypeScript 5.9 · React 19.2.3 · RN 0.86(仅类型)· Node 24 · yarn v1

设计依据:`docs/superpowers/specs/2026-07-16-rn-086-vitest-upgrade-design.md`

## Global Constraints

- **不动 `peerDependencies`** —— 保持 `"@react-navigation/native": ">= 5.7.0"`、`"react-native": ">= 0.65.0"`。测试栈的 RN 下界是测试约束,不是运行时约束。
- **不动 `README.md` / `README.zh-CN.md`** 的支持表(`2.0.0+ → 0.65.0+` 依然准确)。
- **不动 `package.json` 的 `version`**(保持 `2.1.2`),不发版。
- **不动 `tsconfig.json`** —— `"include": ["src/index.ts"]` 保持原样。它同时被 `tsc`(emit 到 `dist/`)和 `tsc --noEmit` 使用,加入测试会导致 `yarn build` 把测试也 emit 到 `dist/`。
- **不升 `husky`(^7.0.2)/ `prettier`(^2.6.1)/ `pretty-quick`(^3.1.1)** —— 均只在 git pre-commit 钩子中运行,不在 `yarn test`/`yarn build` 路径上。
- **Node 24** —— 所有命令必须在 Node 24 下运行。fnm 已装有 v24.6.0;`.nvmrc` 改为 `24` 后新 shell 自动切换。若不确定,命令前加 `fnm exec --using=24 --`。
- **既有 bug 不静默修复** —— 若测试暴露既有 bug,报告并询问后再处理(见 Task 10)。
- 提交信息沿用仓库既有风格:`type(scope): Description`(英文,冒号后首字母大写)。

## File Structure

| 文件                                             | 职责                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `vitest.config.ts`(新)                           | 把运行时 `react-native` / `@react-navigation/native` 指向替身;设 jsdom 环境;挂 setup |
| `test/setup.ts`(新)                              | 每个用例后卸载组件并重置替身状态 —— 唯一的跨用例隔离点                               |
| `test/mocks/react-native.ts`(新)                 | 受控 `AppState` / `Dimensions` / `Platform` + `__` 前缀测试控制面                    |
| `test/mocks/react-navigation.ts`(新)             | 受控 `useNavigation`,单例 navigation 对象                                            |
| `src/<hook>/__tests__/<hook>.test.ts`(3 改 4 增) | 每 hook 一个测试文件,沿用既有布局                                                    |
| `jest.config.js`、`babel.config.js`              | **删除**                                                                             |

替身的**唯一状态**存放在 `test/mocks/*.ts` 的模块作用域内,只经 `__` 前缀函数读写。测试不直接改内部变量。

---

### Task 1: 沙箱验证 —— vitest + alias 替身能否跑通(spike)

在改动仓库前,先在沙箱确认这套组合可行。**本任务不产生仓库提交**,产出是"配置形状已验证"这一结论。

**Files:**

- Create: `/private/tmp/claude-501/-Users-zhuning-Projects-github-react-native-lifecycle/d023da42-7bd9-4954-9bb1-7bb82817291d/scratchpad/spike/` 下的临时文件(用完即弃)

**Interfaces:**

- Consumes: 无
- Produces: 已验证可行的 `vitest.config.ts` 形状(alias + jsdom + setupFiles),供 Task 4 照搬

- [ ] **Step 1: 建沙箱并装依赖**

```bash
mkdir -p /private/tmp/claude-501/-Users-zhuning-Projects-github-react-native-lifecycle/d023da42-7bd9-4954-9bb1-7bb82817291d/scratchpad/spike && cd /private/tmp/claude-501/-Users-zhuning-Projects-github-react-native-lifecycle/d023da42-7bd9-4954-9bb1-7bb82817291d/scratchpad/spike
echo '{"name":"spike","private":true,"type":"module"}' > package.json
fnm exec --using=24 -- npm install \
  vitest@^4.1.10 @testing-library/react@^16.3.2 @testing-library/dom@^10 \
  react@^19.2.3 react-dom@^19.2.3 jsdom@^29.1.1 typescript@^5.9.3 \
  --no-audit --no-fund
```

- [ ] **Step 2: 写替身、配置与探针测试**

`/private/tmp/claude-501/-Users-zhuning-Projects-github-react-native-lifecycle/d023da42-7bd9-4954-9bb1-7bb82817291d/scratchpad/spike/mock-rn.ts`:

```ts
let listeners: Array<(s: string) => void> = [];

export const AppState = {
  addEventListener(type: string, listener: (s: string) => void) {
    if (type !== 'change') return { remove() {} };
    listeners.push(listener);
    return {
      remove() {
        listeners = listeners.filter(l => l !== listener);
      },
    };
  },
};

export function __emit(s: string) {
  [...listeners].forEach(l => l(s));
}

export function __count() {
  return listeners.length;
}
```

`/private/tmp/claude-501/-Users-zhuning-Projects-github-react-native-lifecycle/d023da42-7bd9-4954-9bb1-7bb82817291d/scratchpad/spike/vitest.config.ts`:

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    alias: {
      'react-native': fileURLToPath(new URL('./mock-rn.ts', import.meta.url)),
    },
  },
});
```

`/private/tmp/claude-501/-Users-zhuning-Projects-github-react-native-lifecycle/d023da42-7bd9-4954-9bb1-7bb82817291d/scratchpad/spike/probe.test.ts` —— 探针要同时证明四件事:alias 生效、renderHook 可用、effect 已 flush、卸载后监听器摘除。

```ts
import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { expect, it, vi } from 'vitest';
import { __count, __emit } from './mock-rn';

function useProbe(fn: () => void) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') fn();
    });
    return () => sub.remove();
  }, []);
}

it('alias 生效且 effect 已 flush', () => {
  const fn = vi.fn();
  const hook = renderHook(() => useProbe(fn));

  expect(__count()).toBe(1);
  __emit('active');
  expect(fn).toHaveBeenCalledTimes(1);

  hook.unmount();
  expect(__count()).toBe(0);
});
```

- [ ] **Step 3: 运行探针**

```bash
cd /private/tmp/claude-501/-Users-zhuning-Projects-github-react-native-lifecycle/d023da42-7bd9-4954-9bb1-7bb82817291d/scratchpad/spike && fnm exec --using=24 -- npx vitest run
```

Expected: `Test Files 1 passed (1)` / `Tests 1 passed (1)`。

**若失败,按症状分诊:**

| 症状                                                 | 含义            | 处理                                                           |
| ---------------------------------------------------- | --------------- | -------------------------------------------------------------- |
| `Cannot find module 'react-native'` 或 Flow 语法错误 | alias 未生效    | 检查 `test.alias` 是否写在 `test` 内(不是顶层 `resolve.alias`) |
| `document is not defined`                            | jsdom 未启用    | 确认 `environment: 'jsdom'`                                    |
| `__count()` 得 0                                     | effect 未 flush | 确认 `renderHook` 来自 `@testing-library/react` 而非别处       |

- [ ] **Step 4: 记录结论,不提交**

沙箱不入库。把 Step 3 通过的 `vitest.config.ts` 形状带到 Task 4。

---

### Task 2: Node 24 + 依赖大换血

**Files:**

- Modify: `.nvmrc`(整个文件:`20` → `24`)
- Modify: `package.json:14-32`(`devDependencies` 整块)

**Interfaces:**

- Consumes: 无
- Produces: 可用的 `node_modules`,含 `vitest`、`@testing-library/react`、`react@19`、`react-native@0.86`

- [ ] **Step 1: 确认起点是红的**

```bash
node -v
```

Expected: `v20.15.1` —— 因 `.nvmrc` 写着 `20`,fnm 按它切换。这是待修复的起点。

- [ ] **Step 2: 改 `.nvmrc`**

整个文件内容改为:

```
24
```

- [ ] **Step 3: 验证 Node 已切到 24**

```bash
fnm exec --using-file -- node -v
```

Expected: `v24.6.0`(fnm 已装,无需下载)。

- [ ] **Step 4: 重写 `package.json` 的 `devDependencies`**

把 `package.json` 中整个 `devDependencies` 块替换为:

```json
  "devDependencies": {
    "@microsoft/api-extractor": "^7.58.10",
    "@react-navigation/native": "^7.3.8",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.1.1",
    "@types/react-dom": "^19.0.0",
    "husky": "^7.0.2",
    "jsdom": "^29.1.1",
    "prettier": "^2.6.1",
    "pretty-quick": "^3.1.1",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-native": "^0.86.0",
    "typescript": "^5.9.3",
    "vitest": "^4.1.10",
    "zx": "^8.8.5"
  },
```

相对原文件的变化:

- **删除**:`@testing-library/react-hooks`、`@types/jest`、`@types/react-native`、`babel-jest`、`jest`、`react-test-renderer`、`ts-jest`
- **新增**:`@testing-library/dom`、`@testing-library/react`、`@types/react-dom`、`jsdom`、`react-dom`、`vitest`
- **升级**:`@microsoft/api-extractor`、`@react-navigation/native`、`@types/react`、`react`、`react-native`、`typescript`、`zx`
- **保留原样**:`husky`、`prettier`、`pretty-quick`

`vite` 无需声明 —— 它是 `vitest` 的真实 dependency,自动带入。

- [ ] **Step 5: 安装**

```bash
fnm exec --using=24 -- yarn install
```

Expected: 安装成功。会出现 peer 警告(yarn v1 只警告不拦截),可忽略。

**关键观察点:`prepare: husky install` 必须在 Node 24 下跑通。** 若报错,停下报告 —— 这会触发设计文档里"husky 风险"条目,需要把 husky 升到 9 并同步改写 `.husky/pre-commit`,属于范围变更。

- [ ] **Step 6: 确认 `@types/react-native` 已从依赖树消失**

```bash
fnm exec --using=24 -- yarn list --pattern "@types/react-native" --depth=0 2>&1 | tail -3
```

Expected: 不出现 `@types/react-native@`。它与 RN 0.86 自带类型冲突,必须彻底消失。

- [ ] **Step 7: 提交**

```bash
git add .nvmrc package.json yarn.lock
git commit -m "build(deps): Upgrade to RN 0.86, React 19, Node 24 and swap jest for vitest"
```

---

### Task 3: 修 `useRef`,让 `tsc --noEmit` 转绿

React 19 的 types 不再允许无参 `useRef<T>()`。这是 React 的 breaking change,与 RN 无关。

**Files:**

- Modify: `src/useShow/index.ts:16`
- Modify: `src/useHide/index.ts:16`

**Interfaces:**

- Consumes: Task 2 的 `node_modules`
- Produces: `tsc --noEmit` 零错误

- [ ] **Step 1: 确认失败(RED)**

```bash
fnm exec --using=24 -- npx tsc --noEmit
```

Expected: 恰好 2 个错误 ——

```
src/useHide/index.ts(16,23): error TS2554: Expected 1 arguments, but got 0.
src/useShow/index.ts(16,23): error TS2554: Expected 1 arguments, but got 0.
```

若错误多于这 2 条,停下报告 —— 说明 Task 2 的依赖组合与预期不符。

- [ ] **Step 2: 修 `src/useShow/index.ts:16`**

原:

```ts
const AppStateRef = useRef<NativeEventSubscription>();
```

改为:

```ts
const AppStateRef = useRef<NativeEventSubscription | undefined>(undefined);
```

- [ ] **Step 3: 修 `src/useHide/index.ts:16`**

同上,原:

```ts
const AppStateRef = useRef<NativeEventSubscription>();
```

改为:

```ts
const AppStateRef = useRef<NativeEventSubscription | undefined>(undefined);
```

- [ ] **Step 4: 确认转绿(GREEN)**

```bash
fnm exec --using=24 -- npx tsc --noEmit && echo "✅ tsc 零错误"
```

Expected: `✅ tsc 零错误`

- [ ] **Step 5: 提交**

```bash
git add src/useShow/index.ts src/useHide/index.ts
git commit -m "fix(types): Pass explicit undefined to useRef for React 19"
```

---

### Task 4: vitest 基础设施 + 迁移 useMount / useUnmount

先迁移这两个 —— 它们**不 import `react-native`**,是最干净的首个绿色信号,能把"vitest 通不通"和"替身对不对"两个问题分开。

**Files:**

- Create: `vitest.config.ts`
- Create: `test/setup.ts`
- Create: `test/mocks/react-native.ts`
- Delete: `jest.config.js`、`babel.config.js`
- Modify: `scripts/test.mjs:4`
- Modify: `src/useMount/__tests__/useMount.test.ts`
- Modify: `src/useUnmount/__tests__/useUnmount.test.ts`

**Interfaces:**

- Consumes: Task 1 验证过的配置形状;Task 2 的依赖
- Produces:

  - `test/mocks/react-native.ts` 导出 `AppState`、`Dimensions`、`Platform`、类型 `AppStateStatus` / `NativeEventSubscription` / `ScaledSize`,以及测试控制面 `__emitAppState(state: AppStateStatus): void`、`__emitDimensions(change?: DimensionsChange): void`、`__setPlatform(os: 'ios' | 'android'): void`、`__appStateListenerCount(): number`、`__dimensionsListenerCount(): number`、`__reset(): void`
  - `test/setup.ts` 全局 `afterEach`:先 `cleanup()` 再重置替身

- [ ] **Step 1: 写 `test/mocks/react-native.ts`**

```ts
/**
 * react-native 的受控替身,取代运行时的真包。
 *
 * 真 react-native 发布的是 Flow 源码,esbuild 解析不了;而且在测试环境里真的
 * AppState 永远不会 emit 任何事件。本库从不渲染 RN 组件,只订阅 AppState 与
 * Dimensions,因此整包替换。类型仍走真包 —— tsc 读的是真 .d.ts。
 *
 * 只实现本库真正调用到的 API。面越小,替身与真 RN 漂移的风险越低。
 */

export type AppStateStatus =
  | 'active'
  | 'background'
  | 'inactive'
  | 'unknown'
  | 'extension';

export interface NativeEventSubscription {
  remove(): void;
}

export interface ScaledSize {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

export interface DimensionsChange {
  window: ScaledSize;
  screen: ScaledSize;
}

type PlatformOS = 'ios' | 'android';

interface PlatformSelectSpec<T> {
  ios?: T;
  android?: T;
  native?: T;
  default?: T;
}

function createEmitter<T>() {
  let listeners: Array<(value: T) => void> = [];

  return {
    add(listener: (value: T) => void): NativeEventSubscription {
      listeners.push(listener);
      return {
        remove() {
          listeners = listeners.filter(l => l !== listener);
        },
      };
    },
    emit(value: T) {
      [...listeners].forEach(listener => listener(value));
    },
    count() {
      return listeners.length;
    },
    clear() {
      listeners = [];
    },
  };
}

const appStateEmitter = createEmitter<AppStateStatus>();
const dimensionsEmitter = createEmitter<DimensionsChange>();

let platformOS: PlatformOS = 'ios';

export const AppState = {
  addEventListener(
    type: string,
    listener: (state: AppStateStatus) => void,
  ): NativeEventSubscription {
    if (type !== 'change') {
      return { remove() {} };
    }
    return appStateEmitter.add(listener);
  },
};

export const Dimensions = {
  addEventListener(
    type: string,
    listener: (change: DimensionsChange) => void,
  ): NativeEventSubscription {
    if (type !== 'change') {
      return { remove() {} };
    }
    return dimensionsEmitter.add(listener);
  },
};

export const Platform = {
  get OS(): PlatformOS {
    return platformOS;
  },
  select<T>(spec: PlatformSelectSpec<T>): T | undefined {
    if (platformOS in spec) {
      return spec[platformOS];
    }
    if ('native' in spec) {
      return spec.native;
    }
    return spec.default;
  },
};

// —— 以下均非 react-native 真实 API,仅供测试驱动;故加 __ 前缀 ——

const DEFAULT_SIZE: ScaledSize = {
  width: 375,
  height: 812,
  scale: 3,
  fontScale: 1,
};

export function __emitAppState(state: AppStateStatus): void {
  appStateEmitter.emit(state);
}

export function __emitDimensions(
  change: DimensionsChange = { window: DEFAULT_SIZE, screen: DEFAULT_SIZE },
): void {
  dimensionsEmitter.emit(change);
}

export function __setPlatform(os: PlatformOS): void {
  platformOS = os;
}

export function __appStateListenerCount(): number {
  return appStateEmitter.count();
}

export function __dimensionsListenerCount(): number {
  return dimensionsEmitter.count();
}

export function __reset(): void {
  appStateEmitter.clear();
  dimensionsEmitter.clear();
  platformOS = 'ios';
}
```

- [ ] **Step 2: 写 `test/setup.ts`**

```ts
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { __reset as resetReactNative } from './mocks/react-native';

afterEach(() => {
  // 顺序要紧:先卸载组件,让 hook 的 cleanup 跑完、自行摘掉监听器,
  // 再清空替身。反过来会掩盖"忘记 remove"这类真 bug。
  cleanup();
  resetReactNative();
});
```

- [ ] **Step 3: 写 `vitest.config.ts`**

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    alias: {
      // 运行时走替身,类型走真包。
      // 理由见 docs/superpowers/specs/2026-07-16-rn-086-vitest-upgrade-design.md
      'react-native': fileURLToPath(
        new URL('./test/mocks/react-native.ts', import.meta.url),
      ),
    },
  },
});
```

- [ ] **Step 4: 删除 jest 与 babel 配置**

```bash
git rm jest.config.js babel.config.js
```

`babel.config.js` 已无人读取:babel-jest 已移除,而消费者的 Metro 用的是消费者自己的 babel 配置,不是本仓库的。

- [ ] **Step 5: 改 `scripts/test.mjs`**

整个文件内容改为:

```js
#!/usr/bin/env zx

await $`tsc --noEmit`;
await $`vitest run`;
```

（`vitest` 默认是 watch 模式,`run` 子命令使其单次执行后退出。）

- [ ] **Step 6: 迁移 `src/useMount/__tests__/useMount.test.ts`**

整个文件内容改为:

```ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMount } from '../index';

describe('useMount', () => {
  it('should be defined', () => {
    expect(useMount).toBeDefined();
  });

  it('test useMount', async () => {
    const fn = vi.fn();
    const hook = renderHook(() => useMount(fn));
    expect(fn).toHaveBeenCalledTimes(1);
    hook.rerender();
    expect(fn).toHaveBeenCalledTimes(1);
    hook.unmount();
    expect(fn).toHaveBeenCalledTimes(1);
    renderHook(() => useMount(fn)).unmount();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```

变化:`@testing-library/react-hooks` → `@testing-library/react`;新增 `vitest` 显式导入;`jest.fn()` → `vi.fn()`;`toBeCalledTimes` → `toHaveBeenCalledTimes`(用全称,不依赖别名)。断言逻辑与次数完全不变。

- [ ] **Step 7: 迁移 `src/useUnmount/__tests__/useUnmount.test.ts`**

整个文件内容改为:

```ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useUnmount } from '../index';

describe('useUnmount', () => {
  it('should be defined', () => {
    expect(useUnmount).toBeDefined();
  });

  it('test useUnmount', async () => {
    const fn = vi.fn();
    const hook = renderHook(() => useUnmount(fn));
    expect(fn).toHaveBeenCalledTimes(0);
    hook.rerender();
    expect(fn).toHaveBeenCalledTimes(0);
    hook.unmount();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 8: 运行 —— 首次拿到绿色信号**

```bash
fnm exec --using=24 -- npx vitest run src/useMount src/useUnmount
```

Expected: `Test Files 2 passed (2)` / `Tests 4 passed (4)`

**关键:必须看到测试计数 > 0。** 本仓库原有的失败模式正是"启动失败、零测试执行" —— 没有红色输出不等于通过。

- [ ] **Step 9: 提交**

```bash
git add vitest.config.ts test/setup.ts test/mocks/react-native.ts scripts/test.mjs src/useMount/__tests__/useMount.test.ts src/useUnmount/__tests__/useUnmount.test.ts
git commit -m "test(vitest): Add vitest config with react-native double, migrate useMount and useUnmount"
```

---

### Task 5: useAppActive —— 首个经过替身的测试

本任务同时是 **alias 是否真的生效**的验收。原测试里 `it('test useAppActive', async () => {})` 是空壳,本任务用真断言取代它。

**Files:**

- Modify: `src/useAppActive/__tests__/useAppActive.test.ts`

**Interfaces:**

- Consumes: `test/mocks/react-native.ts` 的 `__emitAppState`、`__appStateListenerCount`
- Produces: 无(叶子任务)

- [ ] **Step 1: 写测试(RED)**

整个文件内容改为:

```ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __appStateListenerCount,
  __emitAppState,
} from '../../../test/mocks/react-native';
import { useAppActive } from '../index';

describe('useAppActive', () => {
  it('should be defined', () => {
    expect(useAppActive).toBeDefined();
  });

  it('回到前台时调用 fn', () => {
    const fn = vi.fn();
    renderHook(() => useAppActive(fn));

    __emitAppState('active');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('非 active 状态不调用 fn', () => {
    const fn = vi.fn();
    renderHook(() => useAppActive(fn));

    __emitAppState('background');
    __emitAppState('inactive');

    expect(fn).not.toHaveBeenCalled();
  });

  it('卸载后摘除监听器', () => {
    const fn = vi.fn();
    const hook = renderHook(() => useAppActive(fn));
    expect(__appStateListenerCount()).toBe(1);

    hook.unmount();

    expect(__appStateListenerCount()).toBe(0);
    __emitAppState('active');
    expect(fn).not.toHaveBeenCalled();
  });
});
```

注:替身经 alias 与相对路径解析到**同一个绝对路径**,因此 hook 里的 `import ... from 'react-native'` 与此处的 `'../../../test/mocks/react-native'` 是同一个模块实例、共享同一份监听器状态。

- [ ] **Step 2: 运行**

```bash
fnm exec --using=24 -- npx vitest run src/useAppActive
```

Expected: `Tests 4 passed (4)`

若报 Flow 语法错误或 `Cannot find module 'react-native'`,说明 alias 未生效 —— 回到 `vitest.config.ts` 检查 `alias` 是否在 `test` 块内。

- [ ] **Step 3: 提交**

```bash
git add src/useAppActive/__tests__/useAppActive.test.ts
git commit -m "test(useAppActive): Replace empty stub with real AppState assertions"
```

---

### Task 6: useAppInactive —— 锁住 iOS/Android 平台差异

`Platform.select({ ios: 'inactive', android: 'background' })` 在 `useHide`、`useAppInactive`、`useShow` 三处重复且未抽取。本任务是这条不变式的唯一保护。

**Files:**

- Create: `src/useAppInactive/__tests__/useAppInactive.test.ts`

**Interfaces:**

- Consumes: `__emitAppState`、`__setPlatform`
- Produces: 无(叶子任务)

- [ ] **Step 1: 写测试(RED)**

```ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __emitAppState,
  __setPlatform,
} from '../../../test/mocks/react-native';
import { useAppInactive } from '../index';

describe('useAppInactive', () => {
  it('should be defined', () => {
    expect(useAppInactive).toBeDefined();
  });

  it('ios 上 inactive 触发、background 不触发', () => {
    __setPlatform('ios');
    const fn = vi.fn();
    renderHook(() => useAppInactive(fn));

    __emitAppState('background');
    expect(fn).not.toHaveBeenCalled();

    __emitAppState('inactive');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('android 上 background 触发、inactive 不触发', () => {
    __setPlatform('android');
    const fn = vi.fn();
    renderHook(() => useAppInactive(fn));

    __emitAppState('inactive');
    expect(fn).not.toHaveBeenCalled();

    __emitAppState('background');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

`test/setup.ts` 的 `afterEach` 会把平台复位回 `ios`,两个用例互不污染。

- [ ] **Step 2: 运行**

```bash
fnm exec --using=24 -- npx vitest run src/useAppInactive
```

Expected: `Tests 3 passed (3)`

- [ ] **Step 3: 提交**

```bash
git add src/useAppInactive/__tests__/useAppInactive.test.ts
git commit -m "test(useAppInactive): Cover ios inactive and android background split"
```

---

### Task 7: useResize

**Files:**

- Create: `src/useResize/__tests__/useResize.test.ts`

**Interfaces:**

- Consumes: `__emitDimensions`、`__dimensionsListenerCount`
- Produces: 无(叶子任务)

- [ ] **Step 1: 写测试(RED)**

```ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __dimensionsListenerCount,
  __emitDimensions,
} from '../../../test/mocks/react-native';
import { useResize } from '../index';

describe('useResize', () => {
  it('should be defined', () => {
    expect(useResize).toBeDefined();
  });

  it('尺寸变化时调用 fn', () => {
    const fn = vi.fn();
    renderHook(() => useResize(fn));

    __emitDimensions();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('卸载后摘除监听器', () => {
    const fn = vi.fn();
    const hook = renderHook(() => useResize(fn));
    expect(__dimensionsListenerCount()).toBe(1);

    hook.unmount();

    expect(__dimensionsListenerCount()).toBe(0);
    __emitDimensions();
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行**

```bash
fnm exec --using=24 -- npx vitest run src/useResize
```

Expected: `Tests 3 passed (3)`

- [ ] **Step 3: 提交**

```bash
git add src/useResize/__tests__/useResize.test.ts
git commit -m "test(useResize): Add Dimensions change and cleanup coverage"
```

---

### Task 8: react-navigation 替身 + useHide

**Files:**

- Create: `test/mocks/react-navigation.ts`
- Modify: `vitest.config.ts`(新增一条 alias)
- Modify: `test/setup.ts`(新增 navigation 复位)
- Create: `src/useHide/__tests__/useHide.test.ts`

**Interfaces:**

- Consumes: `test/mocks/react-native.ts`
- Produces: `test/mocks/react-navigation.ts` 导出 `useNavigation(): { addListener(event: 'focus' | 'blur', listener: () => void): () => void }`,以及 `__emitFocus(): void`、`__emitBlur(): void`、`__reset(): void`

- [ ] **Step 1: 写 `test/mocks/react-navigation.ts`**

```ts
/**
 * @react-navigation/native 的受控替身。
 *
 * useShow / useHide 只用到 useNavigation().addListener('focus' | 'blur', cb)。
 *
 * 注意形状差异:react-navigation 的 addListener 返回的是【取消订阅函数】,
 * 而不是 RN AppState 那样的 { remove } 对象 —— 两个 hook 都直接把它作为
 * useEffect 的 cleanup 返回,替身必须匹配这个形状。
 */

type NavigationEvent = 'focus' | 'blur';

function createEmitter() {
  let listeners: Array<() => void> = [];

  return {
    add(listener: () => void): () => void {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter(l => l !== listener);
      };
    },
    emit() {
      [...listeners].forEach(listener => listener());
    },
    clear() {
      listeners = [];
    },
  };
}

const emitters: Record<NavigationEvent, ReturnType<typeof createEmitter>> = {
  focus: createEmitter(),
  blur: createEmitter(),
};

// 必须是模块级单例:useShow / useHide 的 effect 依赖数组是 [navigation],
// 若每次渲染返回新对象,effect 会不断重订阅。
const navigation = {
  addListener(event: NavigationEvent, listener: () => void): () => void {
    return emitters[event].add(listener);
  },
};

export function useNavigation() {
  return navigation;
}

// —— 非真实 API,仅供测试驱动 ——

export function __emitFocus(): void {
  emitters.focus.emit();
}

export function __emitBlur(): void {
  emitters.blur.emit();
}

export function __reset(): void {
  emitters.focus.clear();
  emitters.blur.clear();
}
```

- [ ] **Step 2: 在 `vitest.config.ts` 增加 alias**

整个文件内容改为:

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    alias: {
      // 运行时走替身,类型走真包。
      // 理由见 docs/superpowers/specs/2026-07-16-rn-086-vitest-upgrade-design.md
      'react-native': fileURLToPath(
        new URL('./test/mocks/react-native.ts', import.meta.url),
      ),
      '@react-navigation/native': fileURLToPath(
        new URL('./test/mocks/react-navigation.ts', import.meta.url),
      ),
    },
  },
});
```

- [ ] **Step 3: 在 `test/setup.ts` 增加 navigation 复位**

整个文件内容改为:

```ts
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { __reset as resetReactNative } from './mocks/react-native';
import { __reset as resetNavigation } from './mocks/react-navigation';

afterEach(() => {
  // 顺序要紧:先卸载组件,让 hook 的 cleanup 跑完、自行摘掉监听器,
  // 再清空替身。反过来会掩盖"忘记 remove"这类真 bug。
  cleanup();
  resetReactNative();
  resetNavigation();
});
```

- [ ] **Step 4: 写 `src/useHide/__tests__/useHide.test.ts`(RED)**

```ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __appStateListenerCount,
  __emitAppState,
  __setPlatform,
} from '../../../test/mocks/react-native';
import { __emitBlur, __emitFocus } from '../../../test/mocks/react-navigation';
import { useHide } from '../index';

describe('useHide', () => {
  it('should be defined', () => {
    expect(useHide).toBeDefined();
  });

  it('页面 blur 时调用 fn', () => {
    const fn = vi.fn();
    renderHook(() => useHide(fn));

    __emitBlur();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('ios 上 focus 后进入后台(inactive)调用 fn', () => {
    __setPlatform('ios');
    const fn = vi.fn();
    renderHook(() => useHide(fn));

    // 必须先 focus —— AppState 监听器是在 focus 时才挂载的
    __emitFocus();
    __emitAppState('inactive');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('android 上 focus 后进入后台(background)调用 fn', () => {
    __setPlatform('android');
    const fn = vi.fn();
    renderHook(() => useHide(fn));

    __emitFocus();
    __emitAppState('background');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('blur 后摘除 AppState 监听器', () => {
    const fn = vi.fn();
    renderHook(() => useHide(fn));

    __emitFocus();
    expect(__appStateListenerCount()).toBe(1);

    __emitBlur();

    expect(__appStateListenerCount()).toBe(0);
  });
});
```

- [ ] **Step 5: 运行**

```bash
fnm exec --using=24 -- npx vitest run src/useHide
```

Expected: `Tests 5 passed (5)`

- [ ] **Step 6: 提交**

```bash
git add test/mocks/react-navigation.ts vitest.config.ts test/setup.ts src/useHide/__tests__/useHide.test.ts
git commit -m "test(useHide): Add navigation double and cover blur plus background paths"
```

---

### Task 9: useShow —— 锁住后台返回去重

CLAUDE.md 明确警告:重做 `useShow` 的 effect 而不保留 `isAppStateChangeRef`,会导致从后台返回时**双触发**。本任务把这条不变式钉死。

**Files:**

- Create: `src/useShow/__tests__/useShow.test.ts`

**Interfaces:**

- Consumes: `__emitAppState`、`__setPlatform`、`__appStateListenerCount`、`__emitFocus`、`__emitBlur`
- Produces: 无(叶子任务)

- [ ] **Step 1: 写测试(RED)**

```ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __appStateListenerCount,
  __emitAppState,
  __setPlatform,
} from '../../../test/mocks/react-native';
import { __emitBlur, __emitFocus } from '../../../test/mocks/react-navigation';
import { useShow } from '../index';

describe('useShow', () => {
  it('should be defined', () => {
    expect(useShow).toBeDefined();
  });

  it('页面 focus 时调用 fn', () => {
    const fn = vi.fn();
    renderHook(() => useShow(fn));

    __emitFocus();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('从后台返回时不重复触发 —— AppState 与 navigation focus 只算一次', () => {
    __setPlatform('ios');
    const fn = vi.fn();
    renderHook(() => useShow(fn));

    __emitFocus(); // 首次进入页面
    expect(fn).toHaveBeenCalledTimes(1);

    __emitAppState('inactive'); // 进入后台,置位 isAppStateChangeRef
    __emitAppState('active'); // 恢复前台 —— 由 AppState 路径负责这次调用
    expect(fn).toHaveBeenCalledTimes(2);

    // 真机上紧随其后还会来一个 navigation focus。
    // isAppStateChangeRef 必须让它被识别为 resume 而跳过。
    __emitFocus();

    // 若去重逻辑被破坏,这里会是 3。
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('blur 后摘除 AppState 监听器', () => {
    const fn = vi.fn();
    renderHook(() => useShow(fn));

    __emitFocus();
    expect(__appStateListenerCount()).toBe(1);

    __emitBlur();

    expect(__appStateListenerCount()).toBe(0);
  });
});
```

- [ ] **Step 2: 运行**

```bash
fnm exec --using=24 -- npx vitest run src/useShow
```

Expected: `Tests 4 passed (4)`

若"从后台返回"一例得到 3 次,说明 `isAppStateChangeRef` 的去重已失效 —— 停下报告,不要改测试去迁就实现。

- [ ] **Step 3: 提交**

```bash
git add src/useShow/__tests__/useShow.test.ts
git commit -m "test(useShow): Lock resume de-duplication between AppState and focus"
```

---

### Task 10: CI 对齐 + 全量验证 + 既有 bug 报告

**Files:**

- Modify: `.github/workflows/test.yml`

**Interfaces:**

- Consumes: 前 9 个任务的全部产出
- Produces: 最终验证结论

- [ ] **Step 1: 改写 `.github/workflows/test.yml`**

整个文件内容改为:

```yaml
name: CI

on:
  push:
    branches: [master, 'feature/*']
  pull_request:
    branches: [master]
  schedule:
    - cron: '0 2 * * *'

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [24.x]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - run: yarn install --frozen-lockfile
      - run: yarn test
```

关键变化:原先的 `yarn add @react-navigation/native react-native react @types/react @types/react-native` 是**无锁安装**,导致 CI 与本地从未测试同一套依赖(且会装回本次删掉的 `@types/react-native`)。改用 `--frozen-lockfile` 后,CI 与本地严格一致。`yarn.lock` 已在仓库中且被跟踪。

- [ ] **Step 2: 全量跑 `yarn test`**

```bash
fnm exec --using=24 -- yarn test
```

Expected: `tsc --noEmit` 无输出,随后 `Test Files 7 passed (7)` / `Tests 23 passed (23)`。

**验收要点:测试文件数必须是 7** —— 7 个 hook 各一个。若少于 7,说明有文件未被 vitest 收集。

- [ ] **Step 3: 验证 `yarn build` 未被破坏**

```bash
fnm exec --using=24 -- yarn build && ls -la dist/index.d.ts dist/index.js
```

Expected: 构建成功,两个文件都在。api-extractor 不应报 TypeScript 版本不匹配。

- [ ] **Step 4: 验证发布产物与线上 2.1.2 逐字节一致(防回归锚点)**

这是"使用者侧无感知"这一承诺的可执行证据。

```bash
cd /private/tmp/claude-501/-Users-zhuning-Projects-github-react-native-lifecycle/d023da42-7bd9-4954-9bb1-7bb82817291d/scratchpad && mkdir -p pubcheck && cd pubcheck
npm pack react-native-lifecycle@2.1.2 --silent >/dev/null 2>&1
tar -xzf react-native-lifecycle-2.1.2.tgz
diff package/dist/index.d.ts /Users/zhuning/Projects/github/react-native-lifecycle/dist/index.d.ts \
  && echo "✅ dist/index.d.ts 与线上 2.1.2 逐字节一致"
```

Expected: `✅ dist/index.d.ts 与线上 2.1.2 逐字节一致`

若有差异,**停下报告** —— 说明本次改动泄漏到了公开 API 面,违反"不发版、使用者无感知"的前提。

- [ ] **Step 5: 提交**

```bash
git add .github/workflows/test.yml
git commit -m "ci: Install from lockfile and run on Node 24"
```

- [ ] **Step 6: 报告既有 bug,不擅自修复**

Task 9 的用例会让 `useShow` 在两次 `focus` 之间没有 `blur` 时,把 AppState 监听器数留在 2(每次 `focus` 都新挂一个并覆盖 `AppStateRef.current`,前一个成为孤儿)。后果:下一轮后台返回时 `onChange` 被调用两次,`fn` **双触发** —— 正是 CLAUDE.md 警告过的症状,只是成因不同(不是去重逻辑失效,而是监听器泄漏)。

用如下一次性探针确认它可复现,然后**向用户报告并等待决定**,不要在本计划内修复。

探针文件必须放在**仓库内**(vitest 的 `include` 是相对项目根解析的,`/tmp` 下的文件既不会被收集,相对 import 也解析不到),用完即删、不提交:

```bash
cd /Users/zhuning/Projects/github/react-native-lifecycle
cat > src/useShow/__tests__/leak.probe.test.ts <<'EOF'
import { renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { __appStateListenerCount } from '../../../test/mocks/react-native';
import { __emitFocus } from '../../../test/mocks/react-navigation';
import { useShow } from '../index';

it('两次 focus 之间无 blur 时 AppState 监听器泄漏', () => {
  renderHook(() => useShow(() => {}));
  __emitFocus();
  __emitFocus();
  // 期望 1;若得 2,说明每次 focus 都新挂监听器且覆盖了 AppStateRef,前一个成为孤儿
  expect(__appStateListenerCount()).toBe(1);
});
EOF
fnm exec --using=24 -- npx vitest run src/useShow/__tests__/leak.probe.test.ts 2>&1 | tail -20
rm -f src/useShow/__tests__/leak.probe.test.ts
```

Expected: 探针**失败**,报 `expected 2 to be 1` —— 这正是要报告的证据。若它意外通过,说明泄漏推断有误,如实报告即可。

报告须包含:复现路径、用户可见后果(第二轮后台返回时 `fn` 双触发)、以及"修它属于行为变更,不在本次升级范围"这一判断。

---

## 完成标准

- [ ] `fnm exec --using=24 -- yarn test` —— `tsc` 零错误,7 个测试文件全绿,测试计数 > 0
- [ ] `fnm exec --using=24 -- yarn build` —— 成功,且 `dist/index.d.ts` 与线上 2.1.2 逐字节一致
- [ ] `git status` 干净(除未跟踪的 `CLAUDE.md`)
- [ ] `package.json` 的 `peerDependencies` 与 `version` 未被改动
- [ ] `README.md` / `README.zh-CN.md` 未被改动
- [ ] `useShow` 监听器泄漏已报告、未擅自修复
