# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`react-native-lifecycle` — seven React Native lifecycle hooks, published to npm as a TypeScript source tree compiled into `dist/`. It has no runtime `dependencies`; `@react-navigation/native` (>= 5.7.0), `react` (>= 18.0.0), and `react-native` (>= 0.71.0) are **peer** dependencies. Current published major is 3.0.0.

## Commands

Uses yarn v1 and Node 24 (`.nvmrc`). Node 20 is EOL as of 2026-04-30; RN 0.86 requires `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.

| Task                      | Command                                          |
| ------------------------- | ------------------------------------------------ |
| Install                   | `yarn install`                                   |
| Test (typecheck + vitest) | `yarn test`                                      |
| Build                     | `yarn build`                                     |
| Typecheck only            | `npx tsc --noEmit`                               |
| Single test file          | `npx vitest run src/useMount`                    |
| Single test by name       | `npx vitest run -t '卸载后摘除 AppState 监听器'` |
| Watch mode                | `npx vitest`                                     |

`yarn test` and `yarn build` are zx scripts (`scripts/test.mjs`, `scripts/build.mjs`), not npm-script one-liners. They hardcode their commands and **do not forward CLI args** — `yarn test src/useMount` silently runs the entire suite. Invoke `npx vitest` directly to scope a run.

- `yarn test` = `tsc --noEmit`, then `vitest run`.
- `yarn build` = `tsc` (emits JS and per-file `.d.ts` to `dist/`), then `api-extractor run` (rolls every `.d.ts` into one flat `dist/index.d.ts`, overwriting the entry point).

Both scripts set `$.verbose = true`. Do not remove it: zx 8 is silent by default (zx 6 was not), and without it `yarn test` prints nothing at all — no test counts, no failure detail — while still exiting correctly. That failure mode is exactly how this repo's tests stayed broken unnoticed for two years.

## Architecture

### The barrel drives compilation

`tsconfig.json` sets `"include": ["src/index.ts"]`, making the barrel the only root. TypeScript compiles just what it reaches through imports from there. **A hook not re-exported from `src/index.ts` is invisible** — never typechecked, never emitted to `dist/` — and it fails silently rather than erroring. Re-exporting from the barrel is what makes a hook exist.

Do not widen `include` to cover tests: the same `tsconfig.json` drives `yarn build`, so tests would be emitted into the published package. Consequence: **test files and `test/mocks/**` are never typechecked\*\* (vitest's esbuild only transpiles). Known gap.

### Layout

One hook per directory, every one re-exported from the barrel:

```
src/<hookName>/index.ts                       implementation
src/<hookName>/__tests__/<hookName>.test.ts   tests
src/index.ts                                  barrel — re-exports all 7
test/mocks/react-native.ts                    controlled AppState / Dimensions / Platform
test/mocks/react-navigation.ts                controlled useNavigation
test/setup.ts                                 global afterEach
vitest.config.ts                              aliases the runtime to the doubles
```

### Public API surface

Every exported hook has a TSDoc block tagged `@public`. api-extractor reads that release tag and copies the comment into the rolled-up `dist/index.d.ts` — those doc comments **are** the shipped API documentation. All seven share one signature: `(fn: () => void) => void`.

`dist/index.d.ts` has **zero imports**. That is load-bearing, not incidental: because no RN or React type ever reaches the public surface, consumers' RN version is fully decoupled from this library's internals. It is why the public surface never changed as RN moved from 0.65 all the way to 0.86. Keep it that way — a hook whose signature leaked, say, `ScaledSize` would couple every consumer's typecheck to their RN version.

api-extractor **bundles its own TypeScript** (7.58.x bundles 5.9.x). Upgrading `typescript` without upgrading `@microsoft/api-extractor` in step makes `yarn build` parse 5.9 output with an older compiler. `yarn test` won't catch it — they're separate commands.

### Three tiers of hooks

- **Pure React** — `useMount`, `useUnmount`. `useEffect` wrappers with `[]` deps. No RN, no navigation.
- **RN globals** — `useAppActive`, `useAppInactive`, `useResize`. Subscribe to `AppState` / `Dimensions` on mount; work anywhere.
- **Navigation × AppState composites** — `useShow`, `useHide`. These call `useNavigation()`, so they **throw outside a navigator**, and they multiplex navigation focus/blur against app foreground/background.

Two different floors are in play, and they don't coincide. The **runtime capability** these hooks need — `addEventListener` returning a removable subscription (`NativeEventSubscription`, `subscribe.remove()`) — arrived in RN 0.65; older RN required a paired `removeEventListener`, so the code genuinely cannot run below 0.65. The **declared peer floor**, though, is `react-native >= 0.71.0`, raised at the 3.0.0 major: 0.71 is where RN began bundling its own types (making `@types/react-native` obsolete, which this repo depends on) and where React 18 became the baseline. So 0.65–0.70 is a range the code would technically run on but 3.0.0 no longer supports — a deliberate policy choice, not a technical necessity. The README support table maps 3.0.0+ to RN 0.71.0+, keeping the older 2.0.0+ → 0.65.0+ line for history. The floor is a manual API audit, not something CI verifies — and it is structurally unverifiable here, since RN < 0.71 shipped no bundled types.

### Two cross-cutting invariants

Both are duplicated across files rather than factored out, so they're easy to break. Both are now covered by tests:

1. **iOS and Android report backgrounding differently.** Every "app went to background" check spells it `Platform.select({ ios: 'inactive', android: 'background' })` — repeated in `useHide`, `useAppInactive`, and `useShow`. Any new background-aware hook must repeat it. Guarded by `useAppInactive`'s dual-platform tests — the only thing standing between you and a hook that silently no-ops on one platform.

2. **`useShow` de-dupes resume against navigation focus.** Returning from the background fires _both_ an `AppState` `'active'` event and a react-navigation `'focus'` event; naively, both would call `fn()`. `isAppStateChangeRef` records that the app backgrounded, so the following `focus` is recognized as a resume and skipped, letting the `AppState` path own that call. Guarded by three tests in `useShow.test.ts` covering all three sites the ref is read/written.

`useShow` and `useHide` attach their `AppState` listener on `focus` and remove it on `blur`, so a screen only listens while it is the active one. **They also remove it in the effect's cleanup and before re-attaching on a repeat `focus`** — do not drop either. Without the cleanup, a screen that unmounts while focused (a conditionally-rendered navigator) keeps firing `fn` after unmount. Without the pre-attach removal, consecutive focuses stack listeners and the Nth background-return fires `fn` N times.

## Testing

`yarn test` runs 21 tests across 7 files — every hook is covered.

### The runtime `react-native` is completely replaced; the types are not

`vitest.config.ts` aliases **runtime** `react-native` and `@react-navigation/native` to `test/mocks/*`. `tsc --noEmit` still resolves the **real** packages' `.d.ts`. Types come from the real thing; behavior comes from the double.

Why: real react-native ships **Flow** source (`@flow strict-local`), which esbuild cannot parse — using it would require babel plus the RN jest preset's ~590 lines of haste resolution, native-module mocks, and global injection. And it would buy nothing: these hooks never render an RN component, and a real `AppState` never emits in a node test. Any meaningful test of this library has to control `AppState` anyway.

The doubles implement **only the four API points this library actually calls**: `AppState.addEventListener`, `Dimensions.addEventListener`, `Platform.select`/`Platform.OS`, and `subscription.remove()`. Do not "complete" them — `AppState.currentState` and `Dimensions.get()` are deliberately absent. A smaller surface is the main defense against the doubles drifting from real RN.

The emitters model **per-registration removal**: `remove()` strips only its own registration, matching RN's EventEmitter. Reference-equality removal would be wrong — `useShow` registers the same `onChange` closure on repeat focus, so one `remove()` would strip both and the double would be more forgiving than reality.

**Shape difference to keep straight:** RN's `AppState.addEventListener` returns a `{ remove }` **object**; react-navigation's `addListener` returns a bare **unsubscribe function**. The doubles model each correctly; both hooks depend on the difference.

`test/mocks/react-navigation.ts`'s `useNavigation()` returns a **module-level singleton**. `useShow`/`useHide` have `[navigation]` effect deps — a fresh object per render would re-subscribe forever.

### Conventions

- **No `beforeEach` in test files.** `test/setup.ts`'s global `afterEach` handles isolation: `cleanup()` then `__reset()` on both doubles (which also restores `Platform.OS` to `ios`). It exists because `@testing-library/react` registers auto-cleanup only if a global `afterEach` exists, and vitest's default `globals: false` means there isn't one — so RTL's auto-cleanup silently no-ops. Tests import `{ describe, expect, it, vi }` from `vitest` explicitly.
- **No `it('should be defined')` / `expect(useX).toBeDefined()`.** Every real test in the file already proves the hook exists — if it didn't, the import would fail first. Ruled out repo-wide.
- Drive the doubles only through their `__`-prefixed exports (`__emitAppState`, `__setPlatform`, `__appStateListenerCount`, `__emitFocus`, …); never reach into their internals.
- **`useShow`/`useHide` only attach their AppState listener after `focus`.** Any AppState assertion for those two must `__emitFocus()` first, or the listener doesn't exist and the emit silently does nothing — a green test that verifies nothing.

## Conventions

- Prettier runs on staged files via the husky `pre-commit` hook (`pretty-quick --staged`). Config: single quotes, trailing commas, `arrowParens: 'avoid'`. `husky`/`prettier`/`pretty-quick` are deliberately held at old versions — they run only in the pre-commit hook, not in `yarn test`/`yarn build`.
- `README.md` and `README.zh-CN.md` mirror each other and both enumerate all seven hooks — adding or renaming a hook means updating both.
- CI (`.github/workflows/test.yml`) installs with `--frozen-lockfile` on Node 24, so it resolves the same tree as a local `yarn install`. It previously used an unpinned `yarn add`, which meant CI and local never tested the same dependencies.

## Known gaps

- `package.json`'s `files: ["dist", "src"]` publishes `src/**/__tests__` to npm. Inert (`main` points at `dist/`), but the test files import `../../../test/mocks/*`, which is not in the tarball. `"!src/**/__tests__"` would fix it.
- Test files and `test/mocks/**` are not typechecked (see "The barrel drives compilation"). A `tsconfig.test.json` plus a second `tsc --noEmit -p` in `scripts/test.mjs` would close this without touching the build's `tsconfig.json`.
